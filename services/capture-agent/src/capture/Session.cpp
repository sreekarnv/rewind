#include "rewind/capture/Session.h"
#include <spdlog/spdlog.h>

namespace rwd {

    nlohmann::json HttpTransaction::toJson() const 
    {
        nlohmann::json j;

        if (hasRequest()) {
            j["request"] = request_.toJson();
            j["requestTime"] = requestTime_;
        }

        if (hasResponse()) {
            j["response"] = response_.toJson();
            j["responseTime"] = responseTime_;
        }

        if (isComplete()) {
            j["duration"] = duration_;
        }

        return j;
    }

    Session::Session(const std::string& sessionId,
        const std::string& clientIp, int clientPort,
        const std::string& serverIp, int serverPort)
        : sessionId_(sessionId)
        , clientIp_(clientIp)
        , clientPort_(clientPort)
        , serverIp_(serverIp)
        , serverPort_(serverPort)
        , startTime_(0.0)
        , endTime_(0.0)
        , closed_(false)
        , currentTransaction_(nullptr)
    {
    }

    void Session::addRequest(const HttpMessage& msg, double timestamp) 
    {
        if (startTime_ == 0.0) {
            startTime_ = timestamp;
        }
        endTime_ = timestamp;

        transactions_.emplace_back();
        currentTransaction_ = &transactions_.back();
        currentTransaction_->setRequest(msg, timestamp);

        spdlog::debug("Session {}: Added request {} {}",
            sessionId_, msg.getMethod(), msg.getUri());
    }

    void Session::addResponse(const HttpMessage& msg, double timestamp) 
    {
        endTime_ = timestamp;

        if (currentTransaction_ && !currentTransaction_->hasResponse()) 
        {
            currentTransaction_->setResponse(msg, timestamp);

            spdlog::debug("Session {}: Added response {} ({}ms)",
                sessionId_,
                msg.getStatusCode(),
                static_cast<int>(currentTransaction_->getDuration() * 1000));

            currentTransaction_ = nullptr; 
        }
        else 
        {
            spdlog::warn("Session {}: Received response without matching request", sessionId_);

            transactions_.emplace_back();
            transactions_.back().setResponse(msg, timestamp);
        }
    }

    void Session::close() 
    {
        closed_ = true;
        spdlog::debug("Session {} closed: {} transactions, {:.2f}s duration",
            sessionId_,
            transactions_.size(),
            getDuration());
    }

    nlohmann::json Session::toJson() const 
    {
        nlohmann::json j;

        j["sessionId"] = sessionId_;
        j["clientIp"] = clientIp_;
        j["clientPort"] = clientPort_;
        j["serverIp"] = serverIp_;
        j["serverPort"] = serverPort_;
        j["startTime"] = startTime_;
        j["endTime"] = endTime_;
        j["duration"] = getDuration();
        j["transactionCount"] = transactions_.size();

        nlohmann::json transArray = nlohmann::json::array();

        for (const auto& trans : transactions_) 
        {
            if (trans.hasRequest() || trans.hasResponse())
            {
                transArray.push_back(trans.toJson());
            }
        }

        j["transactions"] = transArray;

        return j;
    }

}