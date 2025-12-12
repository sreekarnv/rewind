#include "rewind/sanitizers/PIISanitizer.h"
#include <spdlog/spdlog.h>
#include <algorithm>

namespace rwd {

    PIISanitizer::PIISanitizer(bool sanitizeHeaders, bool sanitizeBody)
        : sanitizeHeaders_(sanitizeHeaders)
        , sanitizeBody_(sanitizeBody)
        , emailPattern_(R"(\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b)")
        , apiKeyPattern_(R"(\b[A-Za-z0-9]{32,64}\b)")
        , jwtPattern_(R"(eyJ[A-Za-z0-9-_=]+\.eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+)")
        , phonePattern_(R"(\+?\d{1,3}[\s\-\.]?\(?\d{1,4}\)?[\s\-\.]?\d{1,4}[\s\-\.]?\d{1,4}[\s\-\.]?\d{1,9})")
        , ipv4Pattern_(R"(\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b)")
    {
    }

    std::map<std::string, std::string> PIISanitizer::sanitizeHeaders(
        const std::map<std::string, std::string>& headers,
        const std::vector<std::string>& headersToSanitize) const
    {
        if (!sanitizeHeaders_) {
            return headers;
        }

        std::map<std::string, std::string> sanitized = headers;

        for (const auto& headerName : headersToSanitize) {
            auto it = sanitized.find(headerName);
            if (it != sanitized.end()) {
                it->second = "[REDACTED]";
                spdlog::debug("Sanitized header: {}", headerName);
            }

            for (auto& [key, value] : sanitized) {
                std::string lowerKey = key;
                std::transform(lowerKey.begin(), lowerKey.end(), lowerKey.begin(), ::tolower);

                std::string lowerTarget = headerName;
                std::transform(lowerTarget.begin(), lowerTarget.end(), lowerTarget.begin(), ::tolower);

                if (lowerKey == lowerTarget) {
                    value = "[REDACTED]";
                    spdlog::debug("Sanitized header (case-insensitive): {}", key);
                }
            }
        }

        return sanitized;
    }

    std::string PIISanitizer::sanitizeBody(const std::string& body, const std::string& contentType) const {
        if (!sanitizeBody_ || body.empty()) {
            return body;
        }

        std::string lowerContentType = contentType;
        std::transform(lowerContentType.begin(), lowerContentType.end(),
                      lowerContentType.begin(), ::tolower);

        if (lowerContentType.find("application/json") != std::string::npos) {
            return sanitizeJSON(body);
        }

        return sanitizeText(body);
    }

    std::string PIISanitizer::sanitizeText(const std::string& text) const {
        std::string result = text;

        result = std::regex_replace(result, emailPattern_, "[EMAIL]");
        result = std::regex_replace(result, jwtPattern_, "[JWT_TOKEN]");
        result = std::regex_replace(result, phonePattern_, "[PHONE]");

        return result;
    }

    std::string PIISanitizer::sanitizeJSON(const std::string& json) const {
        std::string result = json;

        std::vector<std::string> sensitiveFields = {
            "password", "pwd", "passwd",
            "token", "access_token", "refresh_token", "api_key", "apiKey",
            "secret", "api_secret",
            "authorization",
            "cookie",
            "email",
            "phone", "phone_number", "phoneNumber", "mobile", "mobile_number"
        };

        for (const auto& field : sensitiveFields) {
            std::regex fieldPattern(
                "\"" + field + "\"\\s*:\\s*\"([^\"]*)\""
            );
            result = std::regex_replace(result, fieldPattern,
                                       "\"" + field + "\": \"[REDACTED]\"");

            std::regex fieldPatternNoQuotes(
                "\"" + field + "\"\\s*:\\s*([^,}\\s]+)"
            );
            result = std::regex_replace(result, fieldPatternNoQuotes,
                                       "\"" + field + "\": \"[REDACTED]\"");
        }

        result = sanitizeText(result);

        return result;
    }

    std::string PIISanitizer::maskEmail(const std::string& email) const {
        size_t atPos = email.find('@');
        if (atPos == std::string::npos || atPos < 2) {
            return "[EMAIL]";
        }

        return email.substr(0, 2) + "***" + email.substr(atPos);
    }

    std::string PIISanitizer::maskGeneric(const std::string& value, size_t visibleChars) const {
        if (value.length() <= visibleChars) {
            return "[REDACTED]";
        }

        return value.substr(0, visibleChars) + std::string(value.length() - visibleChars, '*');
    }
}
