#include "HttpMessage.h"
#include <sstream>
#include <algorithm>

namespace rwd {

    HttpMessage::HttpMessage()
        : type_(Type::Unknown)
        , statusCode_(0)
        , length_(0)
    {
    }

    HttpMessage HttpMessage::parseFromData(const std::string& data, bool isClientToServer) {
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

        if (part1.find("HTTP/") == 0) {
            msg.setType(Type::Response);
            msg.setVersion(part1.substr(5));
            msg.setStatusCode(std::stoi(part2));

            std::string statusMsg;
            std::getline(firstLineStream, statusMsg);
            if (!statusMsg.empty() && statusMsg[0] == ' ') {
                statusMsg = statusMsg.substr(1);
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

    std::string HttpMessage::getHeader(const std::string& name) const {
        auto it = headers_.find(name);
        if (it != headers_.end()) {
            return it->second;
        }
        return "";
    }

    void HttpMessage::setHeader(const std::string& name, const std::string& value) {
        headers_[name] = value;
    }

    std::string HttpMessage::getFirstLine() const {
        if (type_ == Type::Request) {
            return method_ + " " + uri_ + " HTTP/" + version_;
        }
        else if (type_ == Type::Response) {
            return "HTTP/" + version_ + " " + std::to_string(statusCode_) + " " + statusMessage_;
        }
        return "";
    }

}