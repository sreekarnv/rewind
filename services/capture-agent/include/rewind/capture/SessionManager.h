#pragma once

#include "rewind/capture/Session.h"
#include "rewind/parsers/HttpMessage.h"
#include <map>
#include <memory>
#include <string>

namespace rwd {

    class SessionManager {
    public:
        SessionManager();
        ~SessionManager();

        void addMessage(const HttpMessage& msg,
            const std::string& clientIp, int clientPort,
            const std::string& serverIp, int serverPort,
            bool isRequest);

        std::vector<std::shared_ptr<Session>> getAllSessions() const;

        void closeAllSessions();

        size_t getSessionCount() const { return sessions_.size(); }

        nlohmann::json toJson() const;

    private:
        std::string createSessionId(const std::string& clientIp, int clientPort,
            const std::string& serverIp, int serverPort) const;

        double getCurrentTimestamp() const;

        std::map<std::string, std::shared_ptr<Session>> sessions_;
    };

}
