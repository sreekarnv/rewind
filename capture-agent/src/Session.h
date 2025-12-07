#pragma once

#include "HttpMessage.h"
#include <string>
#include <vector>
#include <chrono>
#include <nlohmann/json.hpp>

namespace rwd {

    class HttpTransaction {
    public:
        HttpTransaction()
            : requestTime_(0.0)
            , responseTime_(0.0)
            , duration_(0.0)
        {
        }

        void setRequest(const HttpMessage& req, double timestamp) {
            request_ = req;
            requestTime_ = timestamp;
        }

        void setResponse(const HttpMessage& res, double timestamp) {
            response_ = res;
            responseTime_ = timestamp;
            duration_ = responseTime_ - requestTime_;
        }

        bool hasRequest() const { return request_.isValid(); }
        bool hasResponse() const { return response_.isValid(); }
        bool isComplete() const { return hasRequest() && hasResponse(); }

        const HttpMessage& getRequest() const { return request_; }
        const HttpMessage& getResponse() const { return response_; }
        double getRequestTime() const { return requestTime_; }
        double getResponseTime() const { return responseTime_; }
        double getDuration() const { return duration_; }

        nlohmann::json toJson() const;

    private:
        HttpMessage request_;
        HttpMessage response_;
        double requestTime_;    
        double responseTime_;
        double duration_;       
    };

    class Session {
    public:
        Session(const std::string& sessionId,
            const std::string& clientIp, int clientPort,
            const std::string& serverIp, int serverPort);

        std::string getSessionId() const { return sessionId_; }

        void addRequest(const HttpMessage& msg, double timestamp);
        void addResponse(const HttpMessage& msg, double timestamp);

        double getStartTime() const { return startTime_; }
        double getEndTime() const { return endTime_; }
        double getDuration() const { return endTime_ - startTime_; }
        size_t getTransactionCount() const { return transactions_.size(); }

        void close();
        bool isClosed() const { return closed_; }

        nlohmann::json toJson() const;

    private:
        std::string sessionId_;
        std::string clientIp_;
        int clientPort_;
        std::string serverIp_;
        int serverPort_;

        double startTime_;
        double endTime_;
        bool closed_;

        std::vector<HttpTransaction> transactions_;
        HttpTransaction* currentTransaction_;
    };

}
