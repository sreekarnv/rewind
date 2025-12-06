#include "Capturer.h"
#include "HttpMessage.h"
#include <iostream>
#include <thread>
#include <chrono>
#include <spdlog/spdlog.h>

int main() {
    spdlog::info("Rewind Capture Agent Starting...");

    rwd::Capturer capturer;

    auto interfaces = rwd::Capturer::getAvailableInterfaces();
    spdlog::info("Found {} network interfaces", interfaces.size());

    for (size_t i = 0; i < interfaces.size(); i++) 
    {
        spdlog::info("[{}] {}", i, interfaces[i]);
    }

    std::cout << "\nWhich interface? (enter number): ";
    size_t choice;
    std::cin >> choice;

    if (!capturer.open(choice)) 
    {
        spdlog::error("Failed to open interface!");
        return 1;
    }

    auto onHttpMessage = [](const rwd::HttpMessage& msg) 
    {
        spdlog::info("=== HTTP {} ===",
            msg.getType() == rwd::HttpMessage::Type::Request ? "Request" : "Response"
        );
        spdlog::info("First line: {}", msg.getFirstLine());

        std::string host = msg.getHeader("Host");
        if (!host.empty()) 
        {
            spdlog::info("Host: {}", host);
        }

        std::string contentType = msg.getHeader("Content-Type");
        if (!contentType.empty()) 
        {
            spdlog::info("Content-Type: {}", contentType);
        }

        std::cout << std::endl;
    };

    spdlog::info("Starting capture...");
    spdlog::info("Visit http://localhost:3000 in your browser");

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

    std::cout << "\nPress Enter to exit..." << std::endl;
    std::cin.ignore();
    std::cin.get();

    return 0;
}