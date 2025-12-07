#include "Capturer.h"
#include "PcapLiveDeviceList.h"
#include "PcapLiveDevice.h"
#include "TcpReassembly.h"
#include "Packet.h"
#include "TcpLayer.h"
#include <spdlog/spdlog.h>

namespace rwd {

    Capturer::Capturer()
        : device_(nullptr)
        , tcpReassembly_(nullptr)
        , packetCount_(0)
        , httpMessageCount_(0)
    {
    }

    Capturer::~Capturer() 
    {
        close();
    }

    std::vector<std::string> Capturer::getAvailableInterfaces() 
    {
        std::vector<std::string> interfaces;

        auto& deviceList = pcpp::PcapLiveDeviceList::getInstance();
        auto devices = deviceList.getPcapLiveDevicesList();

        for (auto* dev : devices) {
            std::string desc = dev->getDesc();

            if (dev->getIPv4Address() != pcpp::IPv4Address::Zero) {
                desc += " (IP: " + dev->getIPv4Address().toString() + ")";
            }

            interfaces.push_back(desc);
        }

        return interfaces;
    }

    bool Capturer::open(size_t interfaceIndex) 
    {
        auto& deviceList = pcpp::PcapLiveDeviceList::getInstance();
        auto devices = deviceList.getPcapLiveDevicesList();

        if (interfaceIndex >= devices.size()) {
            spdlog::error("Invalid interface index: {}", interfaceIndex);
            return false;
        }

        device_ = devices[interfaceIndex];

        if (!device_->open()) {
            spdlog::error("Failed to open device: {}", device_->getDesc());
            return false;
        }

        spdlog::info("Opened device: {}", device_->getDesc());
        return true;
    }

    bool Capturer::startCapture(HttpMessageCallback callback) 
    {
        if (!device_) {
            spdlog::error("Device not opened!");
            return false;
        }

        httpCallback_ = callback;

        tcpReassembly_ = std::make_unique<pcpp::TcpReassembly>(
            onTcpMessageReadyStatic,
            this  
        );

        if (!device_->startCapture(onPacketArrivesStatic, this)) {
            spdlog::error("Failed to start capture!");
            return false;
        }

        spdlog::info("Capture started");
        return true;
    }

    void Capturer::stopCapture() 
    {
        if (device_) {
            device_->stopCapture();
            spdlog::info("Capture stopped");
        }
    }

    void Capturer::close() 
    {
        stopCapture();

        if (device_) {
            device_->close();
            device_ = nullptr;
        }

        tcpReassembly_.reset();
    }

    void Capturer::onPacketArrivesStatic(
        void* rawPacket,
        void* pcapLiveDevice,
        void* userCookie)
    {
        auto* capturer = static_cast<Capturer*>(userCookie);
        capturer->packetCount_++;

        auto* raw = static_cast<pcpp::RawPacket*>(rawPacket);
        pcpp::Packet packet(raw);

        if (packet.isPacketOfType(pcpp::TCP)) {
            capturer->tcpReassembly_->reassemblePacket(packet);
        }
    }

    void Capturer::onTcpMessageReadyStatic(
        int8_t side,
        const pcpp::TcpStreamData& tcpData,
        void* userCookie)
    {
        auto* capturer = static_cast<Capturer*>(userCookie);
        capturer->onTcpMessageReady(side, tcpData);
    }

    void Capturer::onTcpMessageReady(int8_t side, const pcpp::TcpStreamData& tcpData) {
        std::string data(
            reinterpret_cast<const char*>(tcpData.getData()),
            tcpData.getDataLength()
        );

        bool isClientToServer = (side == 0);
        HttpMessage msg = HttpMessage::parseFromData(data, isClientToServer);

        if (msg.isValid()) {
            httpMessageCount_++;

            // TODO: Extract connection info from tcpData
            // For now, use placeholder values
            std::string clientIp = "127.0.0.1";
            int clientPort = 52341;
            std::string serverIp = "127.0.0.1";
            int serverPort = 3000;
            bool isRequest = (msg.getType() == HttpMessage::Type::Request);

            if (httpCallback_) {
                httpCallback_(msg, clientIp, clientPort, serverIp, serverPort, isRequest);
            }
        }
    }

}