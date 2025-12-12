#include "rewind/config/Config.h"
#include <yaml-cpp/yaml.h>
#include <spdlog/spdlog.h>
#include <fstream>
#include <sstream>

namespace rwd {

    Config::Config() {
        setDefaults();
    }

    void Config::setDefaults() {}

    bool Config::loadFromFile(const std::string& filename) {
        try {
            YAML::Node config = YAML::LoadFile(filename);

            if (config["capture"]) {
                auto captureNode = config["capture"];

                if (captureNode["interface_index"]) {
                    capture_.interfaceIndex = captureNode["interface_index"].as<size_t>();
                }

                if (captureNode["interface_indexes"]) {
                    capture_.interfaceIndexes = captureNode["interface_indexes"].as<std::vector<size_t>>();
                }

                if (captureNode["packet_limit"]) {
                    capture_.packetLimit = captureNode["packet_limit"].as<int>();
                }

                if (captureNode["timeout_seconds"]) {
                    capture_.timeoutSeconds = captureNode["timeout_seconds"].as<int>();
                }

                if (captureNode["output_file"]) {
                    capture_.outputFile = captureNode["output_file"].as<std::string>();
                }

                if (captureNode["output_directory"]) {
                    capture_.outputDirectory = captureNode["output_directory"].as<std::string>();
                }
            }

            if (config["filters"]) {
                auto filtersNode = config["filters"];

                if (filtersNode["ports"]) {
                    filter_.ports = filtersNode["ports"].as<std::vector<int>>();
                }

                if (filtersNode["capture_body"]) {
                    filter_.captureBody = filtersNode["capture_body"].as<bool>();
                }

                if (filtersNode["max_body_size"]) {
                    filter_.maxBodySize = filtersNode["max_body_size"].as<size_t>();
                }

                if (filtersNode["bpf_filter"]) {
                    filter_.bpfFilter = filtersNode["bpf_filter"].as<std::string>();
                }
            }

            if (config["logging"]) {
                auto loggingNode = config["logging"];

                if (loggingNode["level"]) {
                    logging_.level = loggingNode["level"].as<std::string>();
                }

                if (loggingNode["file"]) {
                    logging_.file = loggingNode["file"].as<std::string>();
                }
            }

            if (config["metrics"]) {
                auto metricsNode = config["metrics"];

                if (metricsNode["enabled"]) {
                    metrics_.enabled = metricsNode["enabled"].as<bool>();
                }

                if (metricsNode["port"]) {
                    metrics_.port = metricsNode["port"].as<int>();
                }

                if (metricsNode["endpoint"]) {
                    metrics_.endpoint = metricsNode["endpoint"].as<std::string>();
                }
            }

            if (config["sanitization"]) {
                auto sanitizationNode = config["sanitization"];

                if (sanitizationNode["enabled"]) {
                    sanitization_.enabled = sanitizationNode["enabled"].as<bool>();
                }

                if (sanitizationNode["sanitize_headers"]) {
                    sanitization_.sanitizeHeaders = sanitizationNode["sanitize_headers"].as<bool>();
                }

                if (sanitizationNode["sanitize_body"]) {
                    sanitization_.sanitizeBody = sanitizationNode["sanitize_body"].as<bool>();
                }

                if (sanitizationNode["headers_to_sanitize"]) {
                    sanitization_.headersToSanitize =
                        sanitizationNode["headers_to_sanitize"].as<std::vector<std::string>>();
                }
            }

            spdlog::info("Configuration loaded successfully from: {}", filename);
            return true;

        } catch (const YAML::Exception& e) {
            spdlog::error("Failed to parse YAML config: {}", e.what());
            return false;
        } catch (const std::exception& e) {
            spdlog::error("Failed to load config file: {}", e.what());
            return false;
        }
    }

    std::string Config::getBPFFilter() const {
        if (!filter_.bpfFilter.empty()) {
            return filter_.bpfFilter;
        }

        if (!filter_.ports.empty()) {
            std::ostringstream oss;
            oss << "tcp and (";
            for (size_t i = 0; i < filter_.ports.size(); ++i) {
                if (i > 0) oss << " or ";
                oss << "port " << filter_.ports[i];
            }
            oss << ")";
            return oss.str();
        }

        return "tcp";
    }
}
