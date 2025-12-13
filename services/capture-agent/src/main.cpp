#include "rewind/capture/Capturer.h"
#include "rewind/parsers/HttpMessage.h"
#include "rewind/capture/SessionManager.h"
#include "rewind/config/Config.h"
#include "rewind/metrics/MetricsServer.h"
#include <iostream>
#include <thread>
#include <iomanip>
#include <chrono>
#include <fstream>
#include <filesystem>
#include <spdlog/spdlog.h>
#include <nlohmann/json.hpp>

void printUsage(const char* programName) {
    std::cout << "Usage: " << programName << " [options]\n"
              << "Options:\n"
              << "  --config <file>    Path to configuration file (default: config/config.yaml)\n"
              << "  --help             Show this help message\n";
}

spdlog::level::level_enum parseLogLevel(const std::string& level) {
    if (level == "debug") return spdlog::level::debug;
    if (level == "info") return spdlog::level::info;
    if (level == "warn") return spdlog::level::warn;
    if (level == "error") return spdlog::level::err;
    return spdlog::level::info;
}

int main(int argc, char* argv[]) {
    std::string configFile = "config/config.yaml";

    for (int i = 1; i < argc; ++i) {
        std::string arg = argv[i];
        if (arg == "--help" || arg == "-h") {
            printUsage(argv[0]);
            return 0;
        } else if (arg == "--config" && i + 1 < argc) {
            configFile = argv[++i];
        } else {
            std::cerr << "Unknown argument: " << arg << std::endl;
            printUsage(argv[0]);
            return 1;
        }
    }

    rwd::Config config;
    if (!config.loadFromFile(configFile)) {
        spdlog::warn("Failed to load config file: {}", configFile);
        spdlog::info("Using default configuration");
    }

    spdlog::set_level(parseLogLevel(config.getLogging().level));
    spdlog::info("Rewind Capture Agent Starting...");
    spdlog::info("Version 1.0.0");

    std::unique_ptr<rwd::MetricsServer> metricsServer;
    if (config.isMetricsEnabled()) {
        auto metricsConfig = config.getMetrics();
        metricsServer = std::make_unique<rwd::MetricsServer>(
            metricsConfig.port,
            metricsConfig.endpoint
        );
        if (metricsServer->start()) {
            spdlog::info("Metrics server started on port {}", metricsConfig.port);
        } else {
            spdlog::warn("Failed to start metrics server");
            metricsServer.reset();
        }
    }

    rwd::SessionManager sessionManager;
    rwd::Capturer capturer;

    auto interfaces = rwd::Capturer::getAvailableInterfaces();
    spdlog::info("Found {} network interfaces", interfaces.size());

    for (size_t i = 0; i < interfaces.size(); i++) {
        spdlog::info("[{}] {}", i, interfaces[i]);
    }

    size_t choice;
    auto configInterface = config.getInterfaceIndex();

    if (configInterface.has_value()) {
        choice = configInterface.value();
        spdlog::info("Using interface {} from config", choice);
    } else {
        std::cout << "\nWhich interface? (enter number): ";
        std::cin >> choice;
    }

    if (!capturer.open(choice)) {
        spdlog::error("Failed to open interface!");
        return 1;
    }

    auto onHttpMessage = [&sessionManager, &metricsServer](
        const rwd::HttpMessage& msg,
        const std::string& clientIp,
        int clientPort,
        const std::string& serverIp,
        int serverPort,
        bool isRequest)
        {
            sessionManager.addMessage(msg, clientIp, clientPort, serverIp, serverPort, isRequest);

            if (metricsServer) {
                if (isRequest) {
                    metricsServer->incrementHttpRequests();
                } else {
                    metricsServer->incrementHttpResponses();
                }
            }

            spdlog::info("=== HTTP {} ===",
                isRequest ? "Request" : "Response"
            );
            spdlog::info("Connection: {}:{} -> {}:{}",
                clientIp, clientPort, serverIp, serverPort);
            spdlog::info("First line: {}", msg.getFirstLine());

            if (isRequest) {
                std::string host = msg.getHeader("Host");
                if (!host.empty()) {
                    spdlog::info("Host: {}", host);
                }
            }
            else {
                std::string contentType = msg.getHeader("Content-Type");
                if (!contentType.empty()) {
                    spdlog::info("Content-Type: {}", contentType);
                }
            }
        };

    spdlog::info("Starting capture...");
    spdlog::info("Packet limit: {}", config.getPacketLimit());
    spdlog::info("Timeout: {} seconds", config.getTimeoutSeconds());

    if (!capturer.startCapture(onHttpMessage))
    {
        spdlog::error("Failed to start capture!");
        return 1;
    }

    auto startTime = std::chrono::steady_clock::now();
    int packetLimit = config.getPacketLimit();
    int timeoutSeconds = config.getTimeoutSeconds();
    int lastPacketCount = 0;

    while (true) {
        std::this_thread::sleep_for(std::chrono::milliseconds(100));

        if (metricsServer) {
            int currentPacketCount = capturer.getPacketCount();
            int newPackets = currentPacketCount - lastPacketCount;
            for (int i = 0; i < newPackets; i++) {
                metricsServer->incrementPacketsProcessed();
            }
            lastPacketCount = currentPacketCount;

            metricsServer->setActiveSessions(sessionManager.getSessionCount());
        }

        if (packetLimit > 0 && capturer.getHttpMessageCount() >= packetLimit) {
            spdlog::info("Packet limit reached");
            break;
        }

        auto elapsed = std::chrono::steady_clock::now() - startTime;
        if (std::chrono::duration_cast<std::chrono::seconds>(elapsed).count() >= timeoutSeconds) {
            spdlog::info("Timeout reached");
            break;
        }
    }

    capturer.stopCapture();
    spdlog::info("Capture complete!");
    spdlog::info("Total packets: {}", capturer.getPacketCount());
    spdlog::info("HTTP messages: {}", capturer.getHttpMessageCount());

    sessionManager.closeAllSessions();
    spdlog::info("Sessions tracked: {}", sessionManager.getSessionCount());

    if (metricsServer) {
        auto sessions = sessionManager.getAllSessions();
        for (const auto& session : sessions) {
            metricsServer->incrementSessionsClosed();
            metricsServer->recordSessionDuration(session->getDuration());
        }
        metricsServer->setActiveSessions(0);
    }

    spdlog::info("Converting {} sessions to JSON...", sessionManager.getSessionCount());

    nlohmann::json output;

    try
    {
        output = sessionManager.toJson();
        spdlog::info("Conversion complete!");
    }
    catch (const std::exception& e)
    {
        spdlog::error("Failed to convert sessions to JSON: {}", e.what());
        return 1;
    }

    std::filesystem::path outputDir = config.getOutputDirectory();
    std::filesystem::path outputFile = outputDir / config.getOutputFile();

    try {
        std::filesystem::create_directories(outputDir);

        std::ofstream outFile(outputFile);
        if (outFile.is_open())
        {
            outFile << output.dump(2);
            outFile.close();

            std::filesystem::path fullPath = std::filesystem::absolute(outputFile);
            spdlog::info("Saved {} sessions to:", sessionManager.getSessionCount());
            spdlog::info("  {}", fullPath.string());
        }
        else
        {
            spdlog::error("Failed to open {}", outputFile.string());
        }
    }
    catch (const std::exception& e)
    {
        spdlog::error("Failed to write JSON file: {}", e.what());
    }

    std::cout << "\n=== CAPTURE SUMMARY ===" << std::endl;
    std::cout << "Sessions: " << sessionManager.getSessionCount() << std::endl;
    std::cout << "Packets:  " << capturer.getPacketCount() << std::endl;
    std::cout << "Messages: " << capturer.getHttpMessageCount() << std::endl;

    if (sessionManager.getSessionCount() > 0)
    {
        auto sessions = sessionManager.getAllSessions();
        auto firstSession = sessions[0];

        std::cout << "\n--- Example Session ---" << std::endl;
        std::cout << "ID: " << firstSession->getSessionId() << std::endl;
        std::cout << "Transactions: " << firstSession->getTransactionCount() << std::endl;
        std::cout << "Duration: " << std::fixed << std::setprecision(3)
            << firstSession->getDuration() << "s" << std::endl;
        std::cout << "----------------------\n" << std::endl;
    }

    std::cout << "Press Enter to exit..." << std::endl;
    std::cin.ignore();
    std::cin.get();

    return 0;
}
