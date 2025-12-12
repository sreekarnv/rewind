#pragma once

#include <string>
#include <vector>
#include <optional>

namespace rwd {

    struct CaptureConfig {
        std::optional<size_t> interfaceIndex;
        std::vector<size_t> interfaceIndexes;  // For multi-interface capture
        int packetLimit = 100;
        int timeoutSeconds = 60;
        std::string outputFile = "captured_sessions.json";
        std::string outputDirectory = "./output";
    };

    struct FilterConfig {
        std::vector<int> ports;
        bool captureBody = true;
        size_t maxBodySize = 1048576; // 1MB
        std::string bpfFilter;
    };

    struct LoggingConfig {
        std::string level = "info";
        std::string file;
    };

    struct MetricsConfig {
        bool enabled = true;
        int port = 9090;
        std::string endpoint = "/metrics";
    };

    struct SanitizationConfig {
        bool enabled = false;
        bool sanitizeHeaders = true;
        bool sanitizeBody = true;
        std::vector<std::string> headersToSanitize = {"Authorization", "Cookie", "Set-Cookie"};
    };

    class Config {
    public:
        Config();

        // Load configuration from YAML file
        bool loadFromFile(const std::string& filename);

        // Getters
        const CaptureConfig& getCapture() const { return capture_; }
        const FilterConfig& getFilter() const { return filter_; }
        const LoggingConfig& getLogging() const { return logging_; }
        const MetricsConfig& getMetrics() const { return metrics_; }
        const SanitizationConfig& getSanitization() const { return sanitization_; }

        // Convenience methods
        std::optional<size_t> getInterfaceIndex() const { return capture_.interfaceIndex; }
        const std::vector<size_t>& getInterfaceIndexes() const { return capture_.interfaceIndexes; }
        bool isMultiInterface() const { return !capture_.interfaceIndexes.empty(); }
        int getPacketLimit() const { return capture_.packetLimit; }
        int getTimeoutSeconds() const { return capture_.timeoutSeconds; }
        std::string getOutputFile() const { return capture_.outputFile; }
        std::string getOutputDirectory() const { return capture_.outputDirectory; }
        std::string getBPFFilter() const;
        bool isSanitizationEnabled() const { return sanitization_.enabled; }
        bool isMetricsEnabled() const { return metrics_.enabled; }

    private:
        CaptureConfig capture_;
        FilterConfig filter_;
        LoggingConfig logging_;
        MetricsConfig metrics_;
        SanitizationConfig sanitization_;

        void setDefaults();
    };

}
