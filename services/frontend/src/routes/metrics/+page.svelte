<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { Line } from "svelte-chartjs";
    import {
        Chart as ChartJS,
        Title,
        Tooltip,
        Legend,
        LineElement,
        LinearScale,
        PointElement,
        CategoryScale,
        Filler,
    } from "chart.js";

    ChartJS.register(
        Title,
        Tooltip,
        Legend,
        LineElement,
        LinearScale,
        PointElement,
        CategoryScale,
        Filler,
    );

    interface MetricsData {
        packets: { processed: number };
        http: { requests: number; responses: number; total: number };
        sessions: { active: number; created: number; closed: number };
        errors: { total: number; droppedPackets: number };
        timestamp: number;
    }

    let metricsData: MetricsData | null = null;
    let loading = true;
    let error = "";
    let pollInterval: ReturnType<typeof setInterval> | null = null;

    const maxDataPoints = 60;
    let timestamps: string[] = [];
    let packetsHistory: number[] = [];
    let requestsHistory: number[] = [];
    let responsesHistory: number[] = [];
    let activeSessionsHistory: number[] = [];

    let lastPackets = 0;
    let lastRequests = 0;
    let lastResponses = 0;

    let packetsPerSecond = 0;
    let requestsPerSecond = 0;
    let responsesPerSecond = 0;

    $: packetsChartData = {
        labels: timestamps,
        datasets: [
            {
                label: "Packets/sec",
                data: packetsHistory,
                borderColor: "rgb(59, 130, 246)",
                backgroundColor: "rgba(59, 130, 246, 0.1)",
                fill: true,
                tension: 0.4,
            },
        ],
    };

    $: httpChartData = {
        labels: timestamps,
        datasets: [
            {
                label: "Requests/sec",
                data: requestsHistory,
                borderColor: "rgb(34, 197, 94)",
                backgroundColor: "rgba(34, 197, 94, 0.1)",
                fill: true,
                tension: 0.4,
            },
            {
                label: "Responses/sec",
                data: responsesHistory,
                borderColor: "rgb(168, 85, 247)",
                backgroundColor: "rgba(168, 85, 247, 0.1)",
                fill: true,
                tension: 0.4,
            },
        ],
    };

    $: sessionsChartData = {
        labels: timestamps,
        datasets: [
            {
                label: "Active Sessions",
                data: activeSessionsHistory,
                borderColor: "rgb(251, 146, 60)",
                backgroundColor: "rgba(251, 146, 60, 0.1)",
                fill: true,
                tension: 0.4,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "top" as const,
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    precision: 0,
                },
            },
        },
        animation: {
            duration: 300,
        },
    };

    async function fetchMetrics() {
        try {
            const response = await fetch(
                "http://localhost:8000/api/v1/metrics/dashboard",
            );
            const data: MetricsData = await response.json();

            if (data.error) {
                error =
                    "Metrics service unavailable. Make sure the capture agent is running.";
                loading = false;
                return;
            }

            // Calculate rates
            if (metricsData) {
                const timeDiff =
                    (data.timestamp - metricsData.timestamp) / 1000; // seconds
                packetsPerSecond = Math.round(
                    (data.packets.processed - lastPackets) / timeDiff,
                );
                requestsPerSecond = Math.round(
                    (data.http.requests - lastRequests) / timeDiff,
                );
                responsesPerSecond = Math.round(
                    (data.http.responses - lastResponses) / timeDiff,
                );
            }

            lastPackets = data.packets.processed;
            lastRequests = data.http.requests;
            lastResponses = data.http.responses;

            metricsData = data;
            error = "";
            loading = false;

            const now = new Date();
            const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;

            timestamps.push(timeStr);
            packetsHistory.push(packetsPerSecond);
            requestsHistory.push(requestsPerSecond);
            responsesHistory.push(responsesPerSecond);
            activeSessionsHistory.push(data.sessions.active);

            if (timestamps.length > maxDataPoints) {
                timestamps.shift();
                packetsHistory.shift();
                requestsHistory.shift();
                responsesHistory.shift();
                activeSessionsHistory.shift();
            }

            timestamps = timestamps;
            packetsHistory = packetsHistory;
            requestsHistory = requestsHistory;
            responsesHistory = responsesHistory;
            activeSessionsHistory = activeSessionsHistory;
        } catch (err) {
            error =
                "Failed to fetch metrics. Make sure the backend API is running.";
            loading = false;
            console.error("Failed to fetch metrics:", err);
        }
    }

    onMount(() => {
        fetchMetrics();
        pollInterval = setInterval(fetchMetrics, 1000);
    });

    onDestroy(() => {
        if (pollInterval) {
            clearInterval(pollInterval);
        }
    });
</script>

<svelte:head>
    <title>Real-time Metrics - Rewind</title>
</svelte:head>

<div class="container mx-auto p-6">
    <div class="flex items-center justify-between mb-6">
        <div>
            <h1 class="text-3xl font-bold">Real-time Metrics</h1>
            <p class="text-gray-500 mt-1">
                Live performance monitoring from Prometheus
            </p>
        </div>
        <a href="/" class="btn btn-outline">Back to Sessions</a>
    </div>

    {#if loading}
        <div class="flex items-center justify-center h-64">
            <span class="loading loading-spinner loading-lg"></span>
        </div>
    {:else if error}
        <div class="alert alert-warning">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                class="stroke-current shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
            </svg>
            <span>{error}</span>
        </div>
    {:else if metricsData}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div class="stats shadow">
                <div class="stat">
                    <div class="stat-figure text-primary">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            class="inline-block w-8 h-8 stroke-current"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M13 10V3L4 14h7v7l9-11h-7z"
                            />
                        </svg>
                    </div>
                    <div class="stat-title">Packets Processed</div>
                    <div class="stat-value text-primary">
                        {metricsData.packets.processed}
                    </div>
                    <div class="stat-desc">{packetsPerSecond}/sec</div>
                </div>
            </div>

            <div class="stats shadow">
                <div class="stat">
                    <div class="stat-figure text-secondary">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            class="inline-block w-8 h-8 stroke-current"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                            />
                        </svg>
                    </div>
                    <div class="stat-title">HTTP Requests</div>
                    <div class="stat-value text-secondary">
                        {metricsData.http.requests}
                    </div>
                    <div class="stat-desc">{requestsPerSecond}/sec</div>
                </div>
            </div>

            <div class="stats shadow">
                <div class="stat">
                    <div class="stat-figure text-accent">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            class="inline-block w-8 h-8 stroke-current"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                            />
                        </svg>
                    </div>
                    <div class="stat-title">HTTP Responses</div>
                    <div class="stat-value text-accent">
                        {metricsData.http.responses}
                    </div>
                    <div class="stat-desc">{responsesPerSecond}/sec</div>
                </div>
            </div>

            <div class="stats shadow">
                <div class="stat">
                    <div class="stat-figure text-info">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            class="inline-block w-8 h-8 stroke-current"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                        </svg>
                    </div>
                    <div class="stat-title">Active Sessions</div>
                    <div class="stat-value text-info">
                        {metricsData.sessions.active}
                    </div>
                    <div class="stat-desc">
                        {metricsData.sessions.created} total created
                    </div>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="card bg-base-100 shadow-xl">
                <div class="card-body">
                    <h2 class="card-title">Packet Processing Rate</h2>
                    <div class="h-64">
                        <Line data={packetsChartData} options={chartOptions} />
                    </div>
                </div>
            </div>

            <div class="card bg-base-100 shadow-xl">
                <div class="card-body">
                    <h2 class="card-title">HTTP Traffic Rate</h2>
                    <div class="h-64">
                        <Line data={httpChartData} options={chartOptions} />
                    </div>
                </div>
            </div>

            <div class="card bg-base-100 shadow-xl lg:col-span-2">
                <div class="card-body">
                    <h2 class="card-title">Active Sessions Over Time</h2>
                    <div class="h-64">
                        <Line data={sessionsChartData} options={chartOptions} />
                    </div>
                </div>
            </div>
        </div>

        <!-- Additional Stats -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <!-- Sessions Stats -->
            <div class="card bg-base-100 shadow-xl">
                <div class="card-body">
                    <h2 class="card-title">Session Statistics</h2>
                    <div class="stats stats-vertical shadow">
                        <div class="stat">
                            <div class="stat-title">Sessions Created</div>
                            <div class="stat-value text-sm">
                                {metricsData.sessions.created}
                            </div>
                        </div>
                        <div class="stat">
                            <div class="stat-title">Sessions Closed</div>
                            <div class="stat-value text-sm">
                                {metricsData.sessions.closed}
                            </div>
                        </div>
                        <div class="stat">
                            <div class="stat-title">Currently Active</div>
                            <div class="stat-value text-sm">
                                {metricsData.sessions.active}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Error Stats -->
            <div class="card bg-base-100 shadow-xl">
                <div class="card-body">
                    <h2 class="card-title">Error Statistics</h2>
                    <div class="stats stats-vertical shadow">
                        <div class="stat">
                            <div class="stat-title">Total Errors</div>
                            <div
                                class="stat-value text-sm {metricsData.errors
                                    .total > 0
                                    ? 'text-error'
                                    : 'text-success'}"
                            >
                                {metricsData.errors.total}
                            </div>
                            <div class="stat-desc">
                                {metricsData.errors.total === 0
                                    ? "No errors detected"
                                    : "Check logs for details"}
                            </div>
                        </div>
                        <div class="stat">
                            <div class="stat-title">Dropped Packets</div>
                            <div
                                class="stat-value text-sm {metricsData.errors
                                    .droppedPackets > 0
                                    ? 'text-error'
                                    : 'text-success'}"
                            >
                                {metricsData.errors.droppedPackets}
                            </div>
                            <div class="stat-desc">
                                {metricsData.errors.droppedPackets === 0
                                    ? "All packets captured"
                                    : "Packet loss detected"}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Info Banner -->
        <div class="alert alert-info mt-6">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                class="stroke-current shrink-0 w-6 h-6"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
            </svg>
            <span
                >Metrics update every second. Data is sourced from the capture
                agent's Prometheus endpoint on port 9090.</span
            >
        </div>
    {/if}
</div>
