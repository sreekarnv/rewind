#include "SessionManager.h"
#include <spdlog/spdlog.h>
#include <chrono>
#include <sstream>
#include <iomanip>

namespace rwd {

    SessionManager::SessionManager() 
    {
    }

    SessionManager::~SessionManager()
    {
        closeAllSessions();
    }

    std::string SessionManager::createSessionId(
        const std::string& clientIp, int clientPort,
        const std::string& serverIp, int serverPort) const
    {
        std::ostringstream oss;
        oss << clientIp << ":" << clientPort << "->"
            << serverIp << ":" << serverPort;
        return oss.str();
    }

    double SessionManager::getCurrentTimestamp() const 
    {
        auto now = std::chrono::system_clock::now();
        auto duration = now.time_since_epoch();
        auto millis = std::chrono::duration_cast<std::chrono::milliseconds>(duration);
        return millis.count() / 1000.0;
    }

    void SessionManager::addMessage(
        const HttpMessage& msg,
        const std::string& clientIp, int clientPort,
        const std::string& serverIp, int serverPort,
        bool isRequest)
    {
        std::string sessionId = createSessionId(clientIp, clientPort, serverIp, serverPort);

        auto it = sessions_.find(sessionId);
        if (it == sessions_.end()) {
            auto session = std::make_shared<Session>(
                sessionId, clientIp, clientPort, serverIp, serverPort
            );
            sessions_[sessionId] = session;

            spdlog::info("Created new session: {}", sessionId);
            it = sessions_.find(sessionId);
        }

        double timestamp = getCurrentTimestamp();

        if (isRequest) {
            it->second->addRequest(msg, timestamp);
        }
        else {
            it->second->addResponse(msg, timestamp);
        }
    }

    std::vector<std::shared_ptr<Session>> SessionManager::getAllSessions() const 
    {
        std::vector<std::shared_ptr<Session>> result;
        for (const auto& [id, session] : sessions_) {
            result.push_back(session);
        }
        return result;
    }

    void SessionManager::closeAllSessions() 
    {
        for (auto& [id, session] : sessions_) {
            if (!session->isClosed()) {
                session->close();
            }
        }
    }

    nlohmann::json SessionManager::toJson() const 
    {
        nlohmann::json j;

        j["sessionCount"] = sessions_.size();

        nlohmann::json sessionsArray = nlohmann::json::array();
        for (const auto& [id, session] : sessions_) {
            sessionsArray.push_back(session->toJson());
        }
        j["sessions"] = sessionsArray;

        return j;
    }
}
