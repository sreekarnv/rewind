#pragma once

#include "rewind/parsers/HttpMessage.h"
#include <functional>
#include <TcpReassembly.h>
#include <string>
#include <vector>
#include <memory>
#include <map>

namespace pcpp {
    class PcapLiveDevice;
    class TcpReassembly;
    struct TcpStreamData;
}

namespace rwd {

    using HttpMessageCallback = std::function<void(
        const HttpMessage&,
        const std::string& clientIp,
        int clientPort,
        const std::string& serverIp,
        int serverPort,
        bool isRequest
    )>;

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
        static void onTcpConnectionStartStatic(const pcpp::ConnectionData& connectionData, void* userCookie);
        static void onTcpConnectionEndStatic(const pcpp::ConnectionData& connectionData, pcpp::TcpReassembly::ConnectionEndReason reason, void* userCookie);

        void onTcpMessageReady(int8_t side, const pcpp::TcpStreamData& tcpData);
        
        struct ConnectionInfo {
            std::string clientIp;
            int clientPort;
            std::string serverIp;
            int serverPort;
        };

        std::map<uint32_t, ConnectionInfo> connectionMap_;

        pcpp::PcapLiveDevice* device_;
        std::unique_ptr<pcpp::TcpReassembly> tcpReassembly_;
        HttpMessageCallback httpCallback_;

        int packetCount_;
        int httpMessageCount_;
    };

}