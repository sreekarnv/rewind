#include "rewind/metrics/MetricsServer.h"
#include <spdlog/spdlog.h>

namespace rwd {

    MetricsServer::MetricsServer(int port, const std::string& endpoint)
        : port_(port)
        , endpoint_(endpoint)
        , exposer_(nullptr)
        , registry_(std::make_shared<prometheus::Registry>())
    {
        packetsFamily_ = &prometheus::BuildCounter()
            .Name("rewind_packets_total")
            .Help("Total number of packets processed")
            .Register(*registry_);

        httpMessagesFamily_ = &prometheus::BuildCounter()
            .Name("rewind_http_messages_total")
            .Help("Total number of HTTP messages")
            .Register(*registry_);

        sessionsFamily_ = &prometheus::BuildCounter()
            .Name("rewind_sessions_total")
            .Help("Total number of sessions")
            .Register(*registry_);

        errorsFamily_ = &prometheus::BuildCounter()
            .Name("rewind_errors_total")
            .Help("Total number of errors")
            .Register(*registry_);

        gaugeFamily_ = &prometheus::BuildGauge()
            .Name("rewind_active_sessions")
            .Help("Number of currently active sessions")
            .Register(*registry_);

        histogramFamily_ = &prometheus::BuildHistogram()
            .Name("rewind_operation_duration_seconds")
            .Help("Operation durations in seconds")
            .Register(*registry_);

        packetsProcessed_ = &packetsFamily_->Add({{"type", "processed"}});
        httpMessages_ = &httpMessagesFamily_->Add({{"type", "all"}});
        httpRequests_ = &httpMessagesFamily_->Add({{"type", "requests"}});
        httpResponses_ = &httpMessagesFamily_->Add({{"type", "responses"}});
        sessionsCreated_ = &sessionsFamily_->Add({{"action", "created"}});
        sessionsClosed_ = &sessionsFamily_->Add({{"action", "closed"}});
        errors_ = &errorsFamily_->Add({{"type", "general"}});
        droppedPackets_ = &errorsFamily_->Add({{"type", "dropped_packets"}});
        activeSessions_ = &gaugeFamily_->Add({{"state", "active"}});
        captureLatency_ = &histogramFamily_->Add(
            {{"operation", "capture"}},
            prometheus::Histogram::BucketBoundaries{0.001, 0.01, 0.1, 1.0, 10.0}
        );
        sessionDuration_ = &histogramFamily_->Add(
            {{"operation", "session"}},
            prometheus::Histogram::BucketBoundaries{0.1, 1.0, 10.0, 60.0, 300.0}
        );
    }

    MetricsServer::~MetricsServer() {
        stop();
    }

    bool MetricsServer::start() {
        try {
            std::string bindAddress = "0.0.0.0:" + std::to_string(port_);
            exposer_ = std::make_unique<prometheus::Exposer>(bindAddress);
            exposer_->RegisterCollectable(registry_);

            spdlog::info("Metrics server started on http://{}{}",
                        bindAddress, endpoint_);
            return true;
        } catch (const std::exception& e) {
            spdlog::error("Failed to start metrics server: {}", e.what());
            return false;
        }
    }

    void MetricsServer::stop() {
        exposer_.reset();
        spdlog::info("Metrics server stopped");
    }

    void MetricsServer::incrementPacketsProcessed() {
        packetsProcessed_->Increment();
    }

    void MetricsServer::incrementHttpMessages() {
        httpMessages_->Increment();
    }

    void MetricsServer::incrementHttpRequests() {
        httpRequests_->Increment();
        incrementHttpMessages();
    }

    void MetricsServer::incrementHttpResponses() {
        httpResponses_->Increment();
        incrementHttpMessages();
    }

    void MetricsServer::incrementSessionsCreated() {
        sessionsCreated_->Increment();
    }

    void MetricsServer::incrementSessionsClosed() {
        sessionsClosed_->Increment();
    }

    void MetricsServer::setActiveSessions(int count) {
        activeSessions_->Set(count);
    }

    void MetricsServer::incrementErrors() {
        errors_->Increment();
    }

    void MetricsServer::incrementDroppedPackets() {
        droppedPackets_->Increment();
    }

    void MetricsServer::recordCaptureLatency(double seconds) {
        captureLatency_->Observe(seconds);
    }

    void MetricsServer::recordSessionDuration(double seconds) {
        sessionDuration_->Observe(seconds);
    }
}
