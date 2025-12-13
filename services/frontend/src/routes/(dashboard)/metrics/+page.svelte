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
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 4,
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
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 4,
            },
            {
                label: "Responses/sec",
                data: responsesHistory,
                borderColor: "rgb(168, 85, 247)",
                backgroundColor: "rgba(168, 85, 247, 0.1)",
                fill: true,
                tension: 0.4,
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 4,
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
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 4,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "top" as const,
                labels: {
                    usePointStyle: true,
                    padding: 15,
                    font: {
                        size: 12,
                        weight: "500",
                    },
                },
            },
            tooltip: {
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                padding: 12,
                borderColor: "rgba(255, 255, 255, 0.1)",
                borderWidth: 1,
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    precision: 0,
                },
                grid: {
                    color: "rgba(0, 0, 0, 0.05)",
                },
            },
            x: {
                grid: {
                    display: false,
                },
            },
        },
        animation: {
            duration: 300,
        },
        interaction: {
            intersect: false,
            mode: "index" as const,
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

            if (metricsData) {
                const timeDiff =
                    (data.timestamp - metricsData.timestamp) / 1000;
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

<div
    class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-8 py-12"
>
    <div class="max-w-7xl mx-auto">
        <div class="flex items-center justify-between mb-8">
            <div>
                <h1
                    class="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
                >
                    Real-time Metrics
                </h1>
                <p class="text-gray-600 mt-2 flex items-center gap-2">
                    <span class="relative flex h-3 w-3">
                        <span
                            class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"
                        ></span>
                        <span
                            class="relative inline-flex rounded-full h-3 w-3 bg-green-500"
                        ></span>
                    </span>
                    Live performance monitoring from Prometheus
                </p>
            </div>
        </div>

        {#if loading}
            <div class="flex items-center justify-center h-96">
                <div class="text-center">
                    <span
                        class="loading loading-spinner loading-lg text-primary"
                    ></span>
                    <p class="mt-4 text-gray-600">Loading metrics...</p>
                </div>
            </div>
        {:else if error}
            <div
                class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-yellow-200 p-6"
            >
                <div class="flex items-start gap-4">
                    <div class="flex-shrink-0">
                        <svg
                            class="w-6 h-6 text-yellow-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold text-gray-900">
                            Service Unavailable
                        </h3>
                        <p class="mt-1 text-gray-600">{error}</p>
                    </div>
                </div>
            </div>
        {:else if metricsData}
            <div
                class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
            >
                <div
                    class="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-blue-100"
                >
                    <div
                        class="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/5"
                    ></div>
                    <div class="relative p-6">
                        <div class="flex items-center justify-between mb-4">
                            <div class="p-3 bg-blue-500 rounded-xl shadow-lg">
                                <svg
                                    class="w-6 h-6 text-white"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M13 10V3L4 14h7v7l9-11h-7z"
                                    />
                                </svg>
                            </div>
                            <span
                                class="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full"
                            >
                                {packetsPerSecond}/s
                            </span>
                        </div>
                        <h3 class="text-sm font-medium text-gray-600 mb-1">
                            Packets Processed
                        </h3>
                        <p class="text-3xl font-bold text-gray-900">
                            {metricsData.packets.processed.toLocaleString()}
                        </p>
                    </div>
                </div>

                <div
                    class="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-green-100"
                >
                    <div
                        class="absolute inset-0 bg-gradient-to-br from-green-500/5 to-green-600/5"
                    ></div>
                    <div class="relative p-6">
                        <div class="flex items-center justify-between mb-4">
                            <div class="p-3 bg-green-500 rounded-xl shadow-lg">
                                <svg
                                    class="w-6 h-6 text-white"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M7 16l-4-4m0 0l4-4m-4 4h18"
                                    />
                                </svg>
                            </div>
                            <span
                                class="text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full"
                            >
                                {requestsPerSecond}/s
                            </span>
                        </div>
                        <h3 class="text-sm font-medium text-gray-600 mb-1">
                            HTTP Requests
                        </h3>
                        <p class="text-3xl font-bold text-gray-900">
                            {metricsData.http.requests.toLocaleString()}
                        </p>
                    </div>
                </div>

                <div
                    class="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-purple-100"
                >
                    <div
                        class="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-purple-600/5"
                    ></div>
                    <div class="relative p-6">
                        <div class="flex items-center justify-between mb-4">
                            <div class="p-3 bg-purple-500 rounded-xl shadow-lg">
                                <svg
                                    class="w-6 h-6 text-white"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                                    />
                                </svg>
                            </div>
                            <span
                                class="text-sm font-medium text-purple-600 bg-purple-50 px-3 py-1 rounded-full"
                            >
                                {responsesPerSecond}/s
                            </span>
                        </div>
                        <h3 class="text-sm font-medium text-gray-600 mb-1">
                            HTTP Responses
                        </h3>
                        <p class="text-3xl font-bold text-gray-900">
                            {metricsData.http.responses.toLocaleString()}
                        </p>
                    </div>
                </div>

                <div
                    class="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-orange-100"
                >
                    <div
                        class="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-orange-600/5"
                    ></div>
                    <div class="relative p-6">
                        <div class="flex items-center justify-between mb-4">
                            <div class="p-3 bg-orange-500 rounded-xl shadow-lg">
                                <svg
                                    class="w-6 h-6 text-white"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                    />
                                </svg>
                            </div>
                            <span
                                class="text-sm font-medium text-orange-600 bg-orange-50 px-3 py-1 rounded-full"
                            >
                                Active
                            </span>
                        </div>
                        <h3 class="text-sm font-medium text-gray-600 mb-1">
                            Active Sessions
                        </h3>
                        <p class="text-3xl font-bold text-gray-900">
                            {metricsData.sessions.active}
                        </p>
                    </div>
                </div>
            </div>

            <!-- Charts -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <!-- Packets Chart -->
                <div
                    class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-100"
                >
                    <div class="flex items-center gap-3 mb-6">
                        <div class="p-2 bg-blue-100 rounded-lg">
                            <svg
                                class="w-5 h-5 text-blue-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                />
                            </svg>
                        </div>
                        <h2 class="text-xl font-semibold text-gray-900">
                            Packet Processing Rate
                        </h2>
                    </div>
                    <div class="h-64">
                        <Line data={packetsChartData} options={chartOptions} />
                    </div>
                </div>

                <!-- HTTP Traffic Chart -->
                <div
                    class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-100"
                >
                    <div class="flex items-center gap-3 mb-6">
                        <div class="p-2 bg-green-100 rounded-lg">
                            <svg
                                class="w-5 h-5 text-green-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                                />
                            </svg>
                        </div>
                        <h2 class="text-xl font-semibold text-gray-900">
                            HTTP Traffic Rate
                        </h2>
                    </div>
                    <div class="h-64">
                        <Line data={httpChartData} options={chartOptions} />
                    </div>
                </div>
            </div>

            <!-- Active Sessions Chart (Full Width) -->
            <div
                class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-100 mb-6"
            >
                <div class="flex items-center gap-3 mb-6">
                    <div class="p-2 bg-orange-100 rounded-lg">
                        <svg
                            class="w-5 h-5 text-orange-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                            />
                        </svg>
                    </div>
                    <h2 class="text-xl font-semibold text-gray-900">
                        Active Sessions Over Time
                    </h2>
                </div>
                <div class="h-64">
                    <Line data={sessionsChartData} options={chartOptions} />
                </div>
            </div>

            <!-- Bottom Stats Grid -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Sessions Stats -->
                <div
                    class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-100"
                >
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">
                        Session Statistics
                    </h3>
                    <div class="space-y-4">
                        <div
                            class="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-xl"
                        >
                            <span class="text-gray-700 font-medium"
                                >Sessions Created</span
                            >
                            <span class="text-2xl font-bold text-blue-600"
                                >{metricsData.sessions.created}</span
                            >
                        </div>
                        <div
                            class="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100/50 rounded-xl"
                        >
                            <span class="text-gray-700 font-medium"
                                >Sessions Closed</span
                            >
                            <span class="text-2xl font-bold text-purple-600"
                                >{metricsData.sessions.closed}</span
                            >
                        </div>
                        <div
                            class="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100/50 rounded-xl"
                        >
                            <span class="text-gray-700 font-medium"
                                >Currently Active</span
                            >
                            <span class="text-2xl font-bold text-green-600"
                                >{metricsData.sessions.active}</span
                            >
                        </div>
                    </div>
                </div>

                <!-- Error Stats -->
                <div
                    class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-100"
                >
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">
                        Error Statistics
                    </h3>
                    <div class="space-y-4">
                        <div
                            class="p-4 bg-gradient-to-r from-{metricsData.errors
                                .total === 0
                                ? 'green'
                                : 'red'}-50 to-{metricsData.errors.total === 0
                                ? 'green'
                                : 'red'}-100/50 rounded-xl"
                        >
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-gray-700 font-medium"
                                    >Total Errors</span
                                >
                                <span
                                    class="text-2xl font-bold text-{metricsData
                                        .errors.total === 0
                                        ? 'green'
                                        : 'red'}-600"
                                >
                                    {metricsData.errors.total}
                                </span>
                            </div>
                            <p class="text-sm text-gray-600">
                                {metricsData.errors.total === 0
                                    ? "✓ No errors detected"
                                    : "⚠ Check logs for details"}
                            </p>
                        </div>
                        <div
                            class="p-4 bg-gradient-to-r from-{metricsData.errors
                                .droppedPackets === 0
                                ? 'green'
                                : 'red'}-50 to-{metricsData.errors
                                .droppedPackets === 0
                                ? 'green'
                                : 'red'}-100/50 rounded-xl"
                        >
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-gray-700 font-medium"
                                    >Dropped Packets</span
                                >
                                <span
                                    class="text-2xl font-bold text-{metricsData
                                        .errors.droppedPackets === 0
                                        ? 'green'
                                        : 'red'}-600"
                                >
                                    {metricsData.errors.droppedPackets}
                                </span>
                            </div>
                            <p class="text-sm text-gray-600">
                                {metricsData.errors.droppedPackets === 0
                                    ? "✓ All packets captured"
                                    : "⚠ Packet loss detected"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Info Footer -->
            <div
                class="mt-6 bg-blue-50/80 backdrop-blur-sm rounded-2xl p-4 border border-blue-100"
            >
                <div class="flex items-center gap-3">
                    <svg
                        class="w-5 h-5 text-blue-500 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    <p class="text-sm text-gray-700">
                        Metrics update every second. Data is sourced from the
                        capture agent's Prometheus endpoint on port 9090.
                    </p>
                </div>
            </div>
        {/if}
    </div>
</div>
