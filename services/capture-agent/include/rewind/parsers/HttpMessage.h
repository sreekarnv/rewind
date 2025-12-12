#pragma once

#include <string>
#include <map>
#include <cstdint>
#include <nlohmann/json.hpp>

namespace rwd {

    class HttpMessage {
    public:
        enum class Type {
            Request,
            Response,
            Unknown
        };

        HttpMessage();

        static HttpMessage parseFromData(const std::string& data, bool isClientToServer);

        Type getType() const { return type_; }
        std::string getMethod() const { return method_; }
        std::string getUri() const { return uri_; }
        std::string getVersion() const { return version_; }
        int getStatusCode() const { return statusCode_; }
        std::string getStatusMessage() const { return statusMessage_; }
        std::string getHeader(const std::string& name) const;
        const std::map<std::string, std::string>& getHeaders() const { return headers_; }
        std::string getBody() const { return body_; }
        size_t getLength() const { return length_; }

        void setType(Type type) { type_ = type; }
        void setMethod(const std::string& method) { method_ = method; }
        void setUri(const std::string& uri) { uri_ = uri; }
        void setVersion(const std::string& version) { version_ = version; }
        void setStatusCode(int code) { statusCode_ = code; }
        void setStatusMessage(const std::string& msg) { statusMessage_ = msg; }
        void setHeader(const std::string& name, const std::string& value);
        void setBody(const std::string& body) { body_ = body; }
        void setLength(size_t length) { length_ = length; }

        std::string getFirstLine() const;
        bool isValid() const { return type_ != Type::Unknown; }
        nlohmann::json toJson() const;

    private:
        Type type_;
        std::string method_;
        std::string uri_;
        int statusCode_;
        std::string statusMessage_;
        std::string version_;
        std::map<std::string, std::string> headers_;
        std::string body_;
        size_t length_;
    };

}