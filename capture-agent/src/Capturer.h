#pragma once

#include "HttpMessage.h"
#include <functional>
#include <string>
#include <vector>
#include <memory>

namespace pcpp {
    class PcapLiveDevice;
    class TcpReassembly;
    struct TcpStreamData;
}

namespace rwd {

    using HttpMessageCallback = std::function<void(const HttpMessage&)>;

    class Capturer {
    public:
        Capturer();
        ~Capturer();

        static std::vector<std::string> getAvailableInterfaces();

        bool open(size_t interfaceIndex);
        bool startCapture(HttpMessageCallback callback);
        void stopCapture();
        void close();

        int getPacketCount() const { return packetCount_; }
        int getHttpMessageCount() const { return httpMessageCount_; }

    private:
        static void onPacketArrivesStatic(void* rawPacket, void* pcapLiveDevice, void* userCookie);
        static void onTcpMessageReadyStatic(int8_t side, const pcpp::TcpStreamData& tcpData, void* userCookie);

        void onTcpMessageReady(int8_t side, const pcpp::TcpStreamData& tcpData);

        pcpp::PcapLiveDevice* device_;
        std::unique_ptr<pcpp::TcpReassembly> tcpReassembly_;
        HttpMessageCallback httpCallback_;

        int packetCount_;
        int httpMessageCount_;
    };

}