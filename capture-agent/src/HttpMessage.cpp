#include "HttpMessage.h"
#include <sstream>
#include <algorithm>
#include <spdlog/spdlog.h>


namespace rwd {
    std::string getDefaultStatusMessage(int statusCode) {
        switch (statusCode) {
            case 200: return "OK";
            case 201: return "Created";
            case 204: return "No Content";
            case 301: return "Moved Permanently";
            case 302: return "Found";
            case 304: return "Not Modified";
            case 400: return "Bad Request";
            case 401: return "Unauthorized";
            case 403: return "Forbidden";
            case 404: return "Not Found";
            case 500: return "Internal Server Error";
            case 502: return "Bad Gateway";
            case 503: return "Service Unavailable";
            default: return "Unknown";
        }
    }

    bool isValidUtf8(const std::string& str) {
        for (size_t i = 0; i < str.length(); ) {
            unsigned char c = str[i];

            if (c <= 0x7F) {
                i++;
                continue;
            }
            
            if (c >= 0xC0 && c <= 0xDF) {
                if (i + 1 >= str.length()) return false;
                if ((str[i + 1] & 0xC0) != 0x80) return false;
                i += 2;
                continue;
            }

            if (c >= 0xE0 && c <= 0xEF) {
                if (i + 2 >= str.length()) return false;
                if ((str[i + 1] & 0xC0) != 0x80) return false;
                if ((str[i + 2] & 0xC0) != 0x80) return false;
                i += 3;
                continue;
            }

            if (c >= 0xF0 && c <= 0xF7) {
                if (i + 3 >= str.length()) return false;
                if ((str[i + 1] & 0xC0) != 0x80) return false;
                if ((str[i + 2] & 0xC0) != 0x80) return false;
                if ((str[i + 3] & 0xC0) != 0x80) return false;
                i += 4;
                continue;
            }

            return false;
        }

        return true;
    }

    HttpMessage::HttpMessage()
        : type_(Type::Unknown)
        , statusCode_(0)
        , length_(0)
    {
    }

    HttpMessage HttpMessage::parseFromData(const std::string& data, bool isClientToServer) 
    {
        HttpMessage msg;
        msg.setLength(data.length());

        if (data.find("HTTP/") == std::string::npos &&
            data.find("GET ") != 0 &&
            data.find("POST ") != 0 &&
            data.find("PUT ") != 0 &&
            data.find("DELETE ") != 0 &&
            data.find("HEAD ") != 0 &&
            data.find("OPTIONS ") != 0 &&
            data.find("PATCH ") != 0) {
            return msg;
        }

        size_t firstLineEnd = data.find("\r\n");
        if (firstLineEnd == std::string::npos) {
            return msg;
        }

        std::string firstLine = data.substr(0, firstLineEnd);
        std::istringstream firstLineStream(firstLine);

        std::string part1, part2, part3;
        firstLineStream >> part1 >> part2 >> part3;

        if (part1.find("HTTP/") == 0) 
        {
            msg.setType(Type::Response);
            msg.setVersion(part1.substr(5));

            try {
                msg.setStatusCode(std::stoi(part2));
            }
            catch (...) {
                msg.setStatusCode(0);
            }

            std::string statusMsg;
            std::getline(firstLineStream, statusMsg);

            if (!statusMsg.empty()) {
                if (statusMsg[0] == ' ') {
                    statusMsg = statusMsg.substr(1);
                }
                while (!statusMsg.empty() &&
                    (statusMsg.back() == '\r' || statusMsg.back() == ' ')) {
                    statusMsg.pop_back();
                }
            }

            if (statusMsg.empty()) {
                statusMsg = getDefaultStatusMessage(msg.getStatusCode());
            }

            msg.setStatusMessage(statusMsg);

        }
        else {
            msg.setType(Type::Request);
            msg.setMethod(part1);
            msg.setUri(part2);
            if (part3.find("HTTP/") == 0) {
                msg.setVersion(part3.substr(5));
            }
        }

        size_t headersStart = firstLineEnd + 2;
        size_t headersEnd = data.find("\r\n\r\n", headersStart);

        if (headersEnd != std::string::npos) {
            std::string headersSection = data.substr(headersStart, headersEnd - headersStart);
            std::istringstream headersStream(headersSection);
            std::string line;

            while (std::getline(headersStream, line)) {
                if (!line.empty() && line.back() == '\r') {
                    line.pop_back();
                }

                size_t colonPos = line.find(':');
                if (colonPos != std::string::npos) {
                    std::string name = line.substr(0, colonPos);
                    std::string value = line.substr(colonPos + 1);

                    size_t start = value.find_first_not_of(" \t");
                    size_t end = value.find_last_not_of(" \t");
                    if (start != std::string::npos && end != std::string::npos) {
                        value = value.substr(start, end - start + 1);
                    }

                    msg.setHeader(name, value);
                }
            }

            size_t bodyStart = headersEnd + 4;
            if (bodyStart < data.length()) {
                msg.setBody(data.substr(bodyStart));
            }
        }

        return msg;
    }

    std::string HttpMessage::getHeader(const std::string& name) const
    {
        auto it = headers_.find(name);
        if (it != headers_.end()) {
            return it->second;
        }
        return "";
    }

    void HttpMessage::setHeader(const std::string& name, const std::string& value) 
    {
        headers_[name] = value;
    }

    std::string HttpMessage::getFirstLine() const 
    {
        if (type_ == Type::Request) {
            return method_ + " " + uri_ + " HTTP/" + version_;
        }
        else if (type_ == Type::Response) {
            return "HTTP/" + version_ + " " + std::to_string(statusCode_) + " " + statusMessage_;
        }
        return "";
    }


    nlohmann::json HttpMessage::toJson() const {
        nlohmann::json j = nlohmann::json::object();

        // Type
        if (type_ == Type::Request) 
        {
            j["type"] = "request";
            if (!method_.empty()) j["method"] = method_;
            if (!uri_.empty()) j["uri"] = uri_;
        }
        else if (type_ == Type::Response)
        {
            j["type"] = "response";
            j["statusCode"] = statusCode_;
            if (!statusMessage_.empty()) j["statusMessage"] = statusMessage_;
        }

        // Version
        if (!version_.empty()) {
            j["version"] = version_;
        }

        j["length"] = static_cast<int>(length_);

        // Headers
        nlohmann::json headersObj = nlohmann::json::object();
        for (const auto& [key, value] : headers_)
        {
            if (!key.empty() && !value.empty()) 
            {
                if (isValidUtf8(value))
                {
                    headersObj[key] = value;
                }
            }
        }
        if (!headersObj.empty()) {
            j["headers"] = headersObj;
        }

        // Body - ONLY include if it's text
        if (!body_.empty()) {
            j["bodyLength"] = body_.length();

            std::string contentType = getHeader("Content-Type");
            bool isTextContent =
                contentType.find("text/") != std::string::npos ||
                contentType.find("application/json") != std::string::npos ||
                contentType.find("application/xml") != std::string::npos ||
                contentType.find("application/javascript") != std::string::npos;

            if (isTextContent && body_.length() <= 10000) 
            {
                if (isValidUtf8(body_)) 
                {
                    if (body_.length() > 500) 
                    {
                        j["bodyPreview"] = body_.substr(0, 500) + "...";
                    }
                    else
                    {
                        j["body"] = body_;
                    }
                }
                else
                {
                    j["bodyType"] = "binary";
                }
            }
            else 
            {
                j["bodyType"] = contentType.empty() ? "unknown" : contentType;
            }
        }

        return j;
    }
} 