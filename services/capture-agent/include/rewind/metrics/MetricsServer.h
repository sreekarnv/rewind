#pragma once

#include <memory>
#include <string>
#include <prometheus/exposer.h>
#include <prometheus/registry.h>
#include <prometheus/counter.h>
#include <prometheus/gauge.h>
#include <prometheus/histogram.h>

namespace rwd {

    class MetricsServer {
    public:
        MetricsServer(int port = 9090, const std::string& endpoint = "/metrics");
        ~MetricsServer();

        bool start();

        void stop();

        void incrementPacketsProcessed();
        void incrementHttpMessages();
        void incrementHttpRequests();
        void incrementHttpResponses();

        void incrementSessionsCreated();
        void incrementSessionsClosed();
        void setActiveSessions(int count);

        void incrementErrors();
        void incrementDroppedPackets();

        void recordCaptureLatency(double seconds);
        void recordSessionDuration(double seconds);

    private:
        int port_;
        std::string endpoint_;
        std::unique_ptr<prometheus::Exposer> exposer_;
        std::shared_ptr<prometheus::Registry> registry_;

        prometheus::Family<prometheus::Counter>* packetsFamily_;
        prometheus::Family<prometheus::Counter>* httpMessagesFamily_;
        prometheus::Family<prometheus::Counter>* sessionsFamily_;
        prometheus::Family<prometheus::Counter>* errorsFamily_;
        prometheus::Family<prometheus::Gauge>* gaugeFamily_;
        prometheus::Family<prometheus::Histogram>* histogramFamily_;

        prometheus::Counter* packetsProcessed_;
        prometheus::Counter* httpMessages_;
        prometheus::Counter* httpRequests_;
        prometheus::Counter* httpResponses_;
        prometheus::Counter* sessionsCreated_;
        prometheus::Counter* sessionsClosed_;
        prometheus::Counter* errors_;
        prometheus::Counter* droppedPackets_;
        prometheus::Gauge* activeSessions_;
        prometheus::Histogram* captureLatency_;
        prometheus::Histogram* sessionDuration_;
    };
}
