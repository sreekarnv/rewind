#include "Capturer.h"
#include "HttpMessage.h"
#include "SessionManager.h"
#include <iostream>
#include <thread>
#include <iomanip>
#include <chrono>
#include <fstream>
#include <filesystem>
#include <spdlog/spdlog.h>
#include <nlohmann/json.hpp>

int main() {
    spdlog::set_level(spdlog::level::debug);

    spdlog::info("Rewind Capture Agent Starting...");
    spdlog::info("Phase 3: Session Tracking Enabled");

    rwd::SessionManager sessionManager;

    rwd::Capturer capturer;

    auto interfaces = rwd::Capturer::getAvailableInterfaces();
    spdlog::info("Found {} network interfaces", interfaces.size());

    for (size_t i = 0; i < interfaces.size(); i++) {
        spdlog::info("[{}] {}", i, interfaces[i]);
    }

    std::cout << "\nWhich interface? (enter number): ";
    size_t choice;
    std::cin >> choice;

    if (!capturer.open(choice)) {
        spdlog::error("Failed to open interface!");
        return 1;
    }

    auto onHttpMessage = [&sessionManager](
        const rwd::HttpMessage& msg,
        const std::string& clientIp,
        int clientPort,
        const std::string& serverIp,
        int serverPort,
        bool isRequest)
        {
            sessionManager.addMessage(msg, clientIp, clientPort, serverIp, serverPort, isRequest);

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

            std::cout << std::endl;
        };

    spdlog::info("Starting capture...");

    if (!capturer.startCapture(onHttpMessage)) 
    {
        spdlog::error("Failed to start capture!");
        return 1;
    }

    auto startTime = std::chrono::steady_clock::now();
    while (capturer.getHttpMessageCount() < 10) 
    {
        std::this_thread::sleep_for(std::chrono::milliseconds(100));

        auto elapsed = std::chrono::steady_clock::now() - startTime;
        if (std::chrono::duration_cast<std::chrono::seconds>(elapsed).count() > 30) {
            spdlog::info("30 seconds elapsed, stopping...");
            break;
        }
    }

    capturer.stopCapture();
    spdlog::info("Capture complete!");
    spdlog::info("Total packets: {}", capturer.getPacketCount());
    spdlog::info("HTTP messages: {}", capturer.getHttpMessageCount());

    sessionManager.closeAllSessions();
    spdlog::info("Sessions tracked: {}", sessionManager.getSessionCount());

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
    std::string filename = "captured_sessions.json";

    try {
        std::ofstream outFile(filename);
        if (outFile.is_open()) 
        {
            outFile << output.dump(2);
            outFile.close();

            std::filesystem::path fullPath = std::filesystem::absolute(filename);
            spdlog::info("Saved{} sessions to : ", sessionManager.getSessionCount());
            spdlog::info("  {}", fullPath.string());
        }
        else 
        {
            spdlog::error("Failed to open {}", filename);
        }
    }
    catch (const std::exception& e)
    {
        spdlog::error("Failed to write JSON file : {}", e.what());
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