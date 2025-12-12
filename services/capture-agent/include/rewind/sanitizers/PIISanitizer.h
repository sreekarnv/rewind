#pragma once

#include <string>
#include <vector>
#include <regex>
#include <map>

namespace rwd {

    class PIISanitizer {
    public:
        PIISanitizer(bool sanitizeHeaders = true, bool sanitizeBody = true);

        std::map<std::string, std::string> sanitizeHeaders(
            const std::map<std::string, std::string>& headers,
            const std::vector<std::string>& headersToSanitize) const;

        std::string sanitizeBody(const std::string& body, const std::string& contentType) const;

        std::string sanitizeText(const std::string& text) const;

    private:
        bool sanitizeHeaders_;
        bool sanitizeBody_;

        std::regex emailPattern_;
        std::regex apiKeyPattern_;
        std::regex jwtPattern_;
        std::regex phonePattern_;
        std::regex ipv4Pattern_;

        std::string maskEmail(const std::string& email) const;
        std::string maskGeneric(const std::string& value, size_t visibleChars = 4) const;

        std::string sanitizeJSON(const std::string& json) const;
    };

}
