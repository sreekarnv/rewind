#include "Capturer.h"
#include "HttpMessage.h"
#include <iostream>
#include <thread>
#include <fstream>
#include <vector>
#include <spdlog/spdlog.h>
#include <nlohmann/json.hpp>

int main() {
    spdlog::set_level(spdlog::level::debug);

    spdlog::info("Rewind Capture Agent Starting...");

    std::vector<rwd::HttpMessage> capturedMessages;

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

    auto onHttpMessage = [&capturedMessages](const rwd::HttpMessage& msg) {
        capturedMessages.push_back(msg);

        spdlog::info("=== HTTP {} ===",
            msg.getType() == rwd::HttpMessage::Type::Request ? "Request" : "Response"
        );
        spdlog::info("First line: {}", msg.getFirstLine());

        std::string host = msg.getHeader("Host");
        if (!host.empty()) {
            spdlog::info("Host: {}", host);
        }

        std::string contentType = msg.getHeader("Content-Type");
        if (!contentType.empty()) {
            spdlog::info("Content-Type: {}", contentType);
        }

        std::cout << std::endl;
        };

    spdlog::info("Starting capture...");
    spdlog::info("Visit http://localhost:3000 in your browser");

    if (!capturer.startCapture(onHttpMessage)) {
        spdlog::error("Failed to start capture!");
        return 1;
    }

    auto startTime = std::chrono::steady_clock::now();
    while (capturer.getHttpMessageCount() < 10) {
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

    spdlog::info("Converting {} messages to JSON...", capturedMessages.size());

    nlohmann::json jsonArray = nlohmann::json::array();
    int successCount = 0;
    int errorCount = 0;

    for (size_t i = 0; i < capturedMessages.size(); i++) {
        const auto& msg = capturedMessages[i];

        spdlog::debug("Processing message {} of {}", i + 1, capturedMessages.size());

        try {
            nlohmann::json msgJson = msg.toJson();
            jsonArray.push_back(msgJson);
            successCount++;
            spdlog::debug("  ✓ Message {} converted successfully", i + 1);

        }
        catch (const nlohmann::json::type_error& e) {
            errorCount++;
            spdlog::error("  ✗ JSON type error for message {}: {}", i + 1, e.what());
            spdlog::error("     Message type: {}",
                msg.getType() == rwd::HttpMessage::Type::Request ? "Request" : "Response");
            spdlog::error("     First line: {}", msg.getFirstLine());

            try {
                nlohmann::json fallback;
                fallback["error"] = "Serialization failed";
                fallback["errorDetails"] = std::string(e.what());
                fallback["messageIndex"] = i;
                fallback["firstLine"] = msg.getFirstLine();
                jsonArray.push_back(fallback);
            }
            catch (...) {
                spdlog::error("     Even fallback failed!");
            }

        }
        catch (const std::exception& e) {
            errorCount++;
            spdlog::error("  ✗ General exception for message {}: {}", i + 1, e.what());

        }
        catch (...) {
            errorCount++;
            spdlog::error("  ✗ Unknown exception for message {}", i + 1);
        }
    }

    spdlog::info("Conversion complete: {} success, {} errors", successCount, errorCount);

    if (!jsonArray.empty()) {
        std::string filename = "captured.json";

        try {
            std::ofstream outFile(filename);
            if (outFile.is_open()) {
                outFile << jsonArray.dump(2);
                outFile.close();
                spdlog::info("✓ Saved {} messages to {}", jsonArray.size(), filename);
            }
            else {
                spdlog::error("✗ Failed to open {} for writing!", filename);
            }
        }
        catch (const std::exception& e) {
            spdlog::error("✗ Failed to write JSON file: {}", e.what());
        }
    }
    else {
        spdlog::warn("No messages to save");
    }

    std::cout << "\nPress Enter to exit..." << std::endl;
    std::cin.ignore();
    std::cin.get();

    return 0;
}
