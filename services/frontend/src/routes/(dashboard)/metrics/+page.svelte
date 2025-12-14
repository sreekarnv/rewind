<svelte:options runes={true} />

<script lang="ts">
    // @ts-nocheck
    import { createQuery } from "@tanstack/svelte-query";
    import { onDestroy } from "svelte";

    import {
        Chart as ChartJS,
        Title,
        Tooltip,
        Legend,
        LineElement,
        LineController,
        LinearScale,
        PointElement,
        CategoryScale,
        Filler,
        type ChartConfiguration,
        type Chart,
    } from "chart.js";

    ChartJS.register(
        Title,
        Tooltip,
        Legend,
        LineElement,
        LineController,
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

    const mockMetricsQueries = {
        dashboard: () => ({
            queryKey: ["dashboardMetrics"],
            queryFn: async () => {
                const response = await fetch(
                    "http://localhost:8000/api/v1/metrics/dashboard",
                );
                if (!response.ok)
                    throw new Error("Network response was not ok");
                const data: MetricsData = await response.json();
                return data;
            },
        }),
    };

    const query = createQuery(() => ({
        ...mockMetricsQueries.dashboard(),
        refetchInterval: 1000,
    }));

    const data = $derived(query.data as MetricsData | undefined);
    const isPending = $derived(query.isPending);
    const isError = $derived(query.isError);

    const MAX_POINTS = 60;

    const timestamps = $state.raw<string[]>([]);
    const packetsHistory = $state.raw<number[]>([]);
    const requestsHistory = $state.raw<number[]>([]);
    const responsesHistory = $state.raw<number[]>([]);
    const activeSessionsHistory = $state.raw<number[]>([]);

    let packetsPerSecond = $state(0);
    let requestsPerSecond = $state(0);
    let responsesPerSecond = $state(0);

    let packetsChartInstance: Chart | null = null;
    let httpChartInstance: Chart | null = null;
    let sessionsChartInstance: Chart | null = null;

    let lastPackets = $state(0);
    let lastRequests = $state(0);
    let lastResponses = $state(0);
    let lastTimestamp: number | null = $state(null);

    $effect(() => {
        if (!data) return;

        const now = new Date();
        const label = now.toLocaleTimeString();
        let currentPacketsRate = 0;
        let currentRequestsRate = 0;
        let currentResponsesRate = 0;

        if (lastTimestamp !== null) {
            const diff = (data.timestamp - lastTimestamp) / 1000;

            if (diff > 0) {
                currentPacketsRate = Math.round(
                    (data.packets.processed - lastPackets) / diff,
                );
                currentRequestsRate = Math.round(
                    (data.http.requests - lastRequests) / diff,
                );
                currentResponsesRate = Math.round(
                    (data.http.responses - lastResponses) / diff,
                );
            }
        }

        packetsPerSecond = currentPacketsRate;
        requestsPerSecond = currentRequestsRate;
        responsesPerSecond = currentResponsesRate;

        timestamps.push(label);
        packetsHistory.push(currentPacketsRate);
        requestsHistory.push(currentRequestsRate);
        responsesHistory.push(currentResponsesRate);
        activeSessionsHistory.push(data.sessions.active);

        if (timestamps.length > MAX_POINTS) {
            timestamps.shift();
            packetsHistory.shift();
            requestsHistory.shift();
            responsesHistory.shift();
            activeSessionsHistory.shift();
        }

        lastPackets = data.packets.processed;
        lastRequests = data.http.requests;
        lastResponses = data.http.responses;
        lastTimestamp = data.timestamp;

        const updateChart = (chart: Chart | null) => {
            if (chart) {
                chart.update("none");
            }
        };

        updateChart(packetsChartInstance);
        updateChart(httpChartInstance);
        updateChart(sessionsChartInstance);
    });

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "top" as const,
                labels: {
                    usePointStyle: true,
                    padding: 15,
                    font: { size: 12, weight: "500" as const },
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
                ticks: { precision: 0 },
                grid: { color: "rgba(0, 0, 0, 0.05)" },
            },
            x: {
                grid: { display: false },
            },
        },
        animation: { duration: 300 },
        interaction: { intersect: false, mode: "index" as const },
    };

    const packetsChartConfig = $derived<ChartConfiguration<"line">>({
        type: "line",
        data: {
            labels: timestamps,
            datasets: [
                {
                    label: "Packets/sec",
                    data: packetsHistory,
                    borderColor: "rgb(59, 130, 246)",
                    backgroundColor: "rgba(59, 130, 246, 0.1)",
                    fill: "origin",
                    tension: 0.4,
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                },
            ],
        },
        options: chartOptions,
    });

    const httpChartConfig = $derived<ChartConfiguration<"line">>({
        type: "line",
        data: {
            labels: timestamps,
            datasets: [
                {
                    label: "Requests/sec",
                    data: requestsHistory,
                    borderColor: "rgb(34, 197, 94)",
                    backgroundColor: "rgba(34, 197, 94, 0.1)",
                    tension: 0.4,
                    borderWidth: 2,
                    fill: "origin",
                    pointRadius: 0,
                    pointHoverRadius: 4,
                },
                {
                    label: "Responses/sec",
                    data: responsesHistory,
                    borderColor: "rgb(168, 85, 247)",
                    backgroundColor: "rgba(168, 85, 247, 0.1)",
                    borderDash: [5, 5],
                    fill: "origin",
                    tension: 0.4,
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                },
            ],
        },
        options: chartOptions,
    });

    const sessionsChartConfig = $derived<ChartConfiguration<"line">>({
        type: "line",
        data: {
            labels: timestamps,
            datasets: [
                {
                    label: "Active Sessions",
                    data: activeSessionsHistory,
                    borderColor: "rgb(251, 146, 60)",
                    backgroundColor: "rgba(251, 146, 60, 0.1)",
                    fill: "origin",
                    tension: 0.4,
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                },
            ],
        },
        options: chartOptions,
    });

    const chartAction = (node: HTMLCanvasElement, { config, chartRef }) => {
        const chart = new ChartJS(node, config);
        chartRef(chart);

        onDestroy(() => {
            chart.destroy();
            chartRef(null);
        });

        setTimeout(() => {
            if (chart) chart.resize();
        }, 0);

        return {
            destroy() {},
        };
    };

    const displayError = $derived(() => {
        if (isError) {
            return "Failed to fetch metrics. Please ensure the backend API is running and accessible at http://localhost:8000.";
        }
        return "Make sure you have started the Capture Agent";
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

        {#if isPending && !data}
            <div class="flex items-center justify-center h-96">
                <div class="text-center">
                    <span
                        class="loading loading-spinner loading-lg text-primary"
                    ></span>
                    <p class="mt-4 text-gray-600">Loading metrics...</p>
                </div>
            </div>
        {:else if isError || (data && (data as any).error)}
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
                        <p class="mt-1 text-gray-600">{displayError()}</p>
                    </div>
                </div>
            </div>
        {:else if data}
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
                                    ><path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M13 10V3L4 14h7v7l9-11h-7z"
                                    /></svg
                                >
                            </div>
                            <span
                                class="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full"
                            >
                                {packetsPerSecond.toLocaleString()}/s
                            </span>
                        </div>
                        <h3 class="text-sm font-medium text-gray-600 mb-1">
                            Packets Processed
                        </h3>
                        <p class="text-3xl font-bold text-gray-900">
                            {data.packets.processed.toLocaleString()}
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
                                    ><path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M7 16l-4-4m0 0l4-4m-4 4h18"
                                    /></svg
                                >
                            </div>
                            <span
                                class="text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full"
                            >
                                {requestsPerSecond.toLocaleString()}/s
                            </span>
                        </div>
                        <h3 class="text-sm font-medium text-gray-600 mb-1">
                            HTTP Requests
                        </h3>
                        <p class="text-3xl font-bold text-gray-900">
                            {data.http.requests.toLocaleString()}
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
                                    ><path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                                    /></svg
                                >
                            </div>
                            <span
                                class="text-sm font-medium text-purple-600 bg-purple-50 px-3 py-1 rounded-full"
                            >
                                {responsesPerSecond.toLocaleString()}/s
                            </span>
                        </div>
                        <h3 class="text-sm font-medium text-gray-600 mb-1">
                            HTTP Responses
                        </h3>
                        <p class="text-3xl font-bold text-gray-900">
                            {data.http.responses.toLocaleString()}
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
                                    ><path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                    /></svg
                                >
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
                            {data.sessions.active.toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
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
                                ><path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                /></svg
                            >
                        </div>
                        <h2 class="text-xl font-semibold text-gray-900">
                            Packet Processing Rate
                        </h2>
                    </div>
                    <div class="h-64">
                        <canvas
                            use:chartAction={{
                                config: packetsChartConfig,
                                chartRef: (c) => (packetsChartInstance = c),
                            }}
                        ></canvas>
                    </div>
                </div>

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
                                ><path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                                /></svg
                            >
                        </div>
                        <h2 class="text-xl font-semibold text-gray-900">
                            HTTP Traffic Rate
                        </h2>
                    </div>
                    <div class="h-64">
                        <canvas
                            use:chartAction={{
                                config: httpChartConfig,
                                chartRef: (c) => (httpChartInstance = c),
                            }}
                        ></canvas>
                    </div>
                </div>
            </div>

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
                            ><path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                            /></svg
                        >
                    </div>
                    <h2 class="text-xl font-semibold text-gray-900">
                        Active Sessions Over Time
                    </h2>
                </div>
                <div class="h-64">
                    <canvas
                        use:chartAction={{
                            config: sessionsChartConfig,
                            chartRef: (c) => (sessionsChartInstance = c),
                        }}
                    ></canvas>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                                >{data.sessions.created.toLocaleString()}</span
                            >
                        </div>
                        <div
                            class="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100/50 rounded-xl"
                        >
                            <span class="text-gray-700 font-medium"
                                >Sessions Closed</span
                            >
                            <span class="text-2xl font-bold text-purple-600"
                                >{data.sessions.closed.toLocaleString()}</span
                            >
                        </div>
                        <div
                            class="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100/50 rounded-xl"
                        >
                            <span class="text-gray-700 font-medium"
                                >Currently Active</span
                            >
                            <span class="text-2xl font-bold text-green-600"
                                >{data.sessions.active.toLocaleString()}</span
                            >
                        </div>
                    </div>
                </div>

                <div
                    class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-100"
                >
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">
                        Error Statistics
                    </h3>
                    <div class="space-y-4">
                        <div
                            class="p-4 rounded-xl {data.errors.total === 0
                                ? 'bg-gradient-to-r from-green-50 to-green-100/50'
                                : 'bg-gradient-to-r from-red-50 to-red-100/50'}"
                        >
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-gray-700 font-medium"
                                    >Total Errors</span
                                >
                                <span
                                    class="text-2xl font-bold"
                                    class:text-green-600={data.errors.total ===
                                        0}
                                    class:text-red-600={data.errors.total > 0}
                                >
                                    {data.errors.total.toLocaleString()}
                                </span>
                            </div>
                            <p class="text-sm text-gray-600">
                                {data.errors.total === 0
                                    ? "✓ No errors detected"
                                    : "⚠ Check logs for details"}
                            </p>
                        </div>
                        <div
                            class="p-4 rounded-xl {data.errors
                                .droppedPackets === 0
                                ? 'bg-gradient-to-r from-green-50 to-green-100/50'
                                : 'bg-gradient-to-r from-red-50 to-red-100/50'}"
                        >
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-gray-700 font-medium"
                                    >Dropped Packets</span
                                >
                                <span
                                    class="text-2xl font-bold"
                                    class:text-green-600={data.errors
                                        .droppedPackets === 0}
                                    class:text-red-600={data.errors
                                        .droppedPackets > 0}
                                >
                                    {data.errors.droppedPackets.toLocaleString()}
                                </span>
                            </div>
                            <p class="text-sm text-gray-600">
                                {data.errors.droppedPackets === 0
                                    ? "✓ All packets captured"
                                    : "⚠ Packet loss detected"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        {/if}
    </div>
</div>
