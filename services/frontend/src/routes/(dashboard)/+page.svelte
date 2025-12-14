<svelte:options runes={true} />

<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { createQuery } from "@tanstack/svelte-query";
    import { getRealtimeClient } from "$lib/realtime";
    import { sessionsQueries } from "$lib/queries";
    import CaptureControls from "$lib/components/CaptureControls.svelte";
    import type { SessionSummary } from "$lib/types";

    const query = createQuery(() => sessionsQueries.all());

    let isConnected = $state(false);
    let lastUpdate: number | null = $state(null);

    const realtimeClient = getRealtimeClient();

    const isPending = $derived(query.isPending);
    const isError = $derived(query.isError);
    const queryData = $derived(query.data);
    const error = $derived(query.error);
    const sessions: SessionSummary[] = $derived(queryData?.sessions ?? []);

    let searchQuery = $state("");
    let selectedMethod = $state("");
    let selectedStatusRange = $state("");

    onMount(() => {
        const urlParams = new URLSearchParams(window.location.search);
        searchQuery = urlParams.get("search") || "";
        selectedMethod = urlParams.get("method") || "";
        selectedStatusRange = urlParams.get("status") || "";
    });

    $effect(() => {
        const params = new URLSearchParams();
        if (searchQuery) params.set("search", searchQuery);
        if (selectedMethod) params.set("method", selectedMethod);
        if (selectedStatusRange) params.set("status", selectedStatusRange);

        const newUrl = params.toString()
            ? `?${params.toString()}`
            : window.location.pathname;

        if (window.location.search !== `?${params.toString()}`) {
            window.history.replaceState({}, "", newUrl);
        }
    });

    const filteredSessions = $derived.by(() => {
        let result = sessions;

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (s) =>
                    s.uri.toLowerCase().includes(query) ||
                    s.method.toLowerCase().includes(query) ||
                    (s.statusCode && s.statusCode.toString().includes(query)) ||
                    s.sourceIp.includes(query) ||
                    s.destIp.includes(query),
            );
        }

        if (selectedMethod) {
            result = result.filter((s) => s.method === selectedMethod);
        }

        if (selectedStatusRange) {
            result = result.filter((s) => {
                if (!s.statusCode) return selectedStatusRange === "no-response";
                const code = s.statusCode;
                switch (selectedStatusRange) {
                    case "2xx":
                        return code >= 200 && code < 300;
                    case "3xx":
                        return code >= 300 && code < 400;
                    case "4xx":
                        return code >= 400 && code < 500;
                    case "5xx":
                        return code >= 500 && code < 600;
                    case "no-response":
                        return false;
                    default:
                        return true;
                }
            });
        }

        return result;
    });

    const availableMethods = $derived(
        [...new Set(sessions.map((s) => s.method))].sort(),
    );

    const hasActiveFilters = $derived(
        searchQuery || selectedMethod || selectedStatusRange,
    );

    function clearFilters() {
        searchQuery = "";
        selectedMethod = "";
        selectedStatusRange = "";
    }

    onMount(async () => {
        let unsubscribe: (() => void) | undefined;

        try {
            await realtimeClient.connect();
            isConnected = true;
        } catch (err) {
            console.error("Failed to connect to real-time server:", err);
        }

        unsubscribe = realtimeClient.subscribe((update) => {
            if (update.type === "init" || update.type === "update") {
                lastUpdate = update.data.timestamp;
            }
        });

        return () => {
            unsubscribe?.();
        };
    });

    onDestroy(() => {
        realtimeClient.disconnect();
    });

    const totalSessions = $derived(filteredSessions.length);
    const uniqueMethods = $derived(
        [...new Set(filteredSessions.map((s) => s.method))].length,
    );
    const successfulRequests = $derived(
        filteredSessions.filter((s) => s.statusCode && s.statusCode < 400)
            .length,
    );
</script>

<svelte:head>
    <title>Sessions - Rewind</title>
</svelte:head>

<div
    class="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 px-8 py-12"
>
    <div class="max-w-7xl mx-auto space-y-6">
        <CaptureControls />

        <div
            class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-100"
        >
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                        <h1
                            class="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
                        >
                            HTTP Sessions
                        </h1>
                        {#if isConnected}
                            <span
                                class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200"
                            >
                                <span class="relative flex h-3 w-3 mr-2">
                                    <span
                                        class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"
                                    ></span>
                                    <span
                                        class="relative inline-flex rounded-full h-3 w-3 bg-green-500"
                                    ></span>
                                </span>
                                Live Updates
                            </span>
                        {:else}
                            <span
                                class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600 border border-gray-200"
                            >
                                <span
                                    class="w-2 h-2 bg-gray-400 rounded-full mr-2"
                                ></span>
                                Offline
                            </span>
                        {/if}
                    </div>
                    <p class="text-gray-600">
                        Captured HTTP traffic sessions from the packet capture
                        agent
                    </p>
                    {#if lastUpdate}
                        <p
                            class="mt-2 text-sm text-gray-500 flex items-center gap-2"
                        >
                            <svg
                                class="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            Last update: {new Date(
                                lastUpdate,
                            ).toLocaleTimeString()}
                        </p>
                    {/if}
                </div>

                <div class="flex gap-4">
                    <div
                        class="text-center px-6 py-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200"
                    >
                        <p class="text-sm text-purple-600 font-medium mb-1">
                            Total
                        </p>
                        <p class="text-3xl font-bold text-purple-700">
                            {totalSessions}
                        </p>
                    </div>
                    <div
                        class="text-center px-6 py-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200"
                    >
                        <p class="text-sm text-blue-600 font-medium mb-1">
                            Methods
                        </p>
                        <p class="text-3xl font-bold text-blue-700">
                            {uniqueMethods}
                        </p>
                    </div>
                    <div
                        class="text-center px-6 py-3 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200"
                    >
                        <p class="text-sm text-green-600 font-medium mb-1">
                            Success
                        </p>
                        <p class="text-3xl font-bold text-green-700">
                            {successfulRequests}
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <div
            class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-100 space-y-4"
        >
            <div class="flex items-center gap-2">
                <div class="flex-1 relative">
                    <div
                        class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"
                    >
                        <svg
                            class="w-5 h-5 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                    </div>
                    <input
                        type="text"
                        bind:value={searchQuery}
                        placeholder="Search by URL, method, status code, or IP address..."
                        class="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all bg-white"
                    />
                </div>
                {#if hasActiveFilters}
                    <button
                        onclick={clearFilters}
                        class="px-4 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all font-semibold shadow-md flex items-center gap-2 whitespace-nowrap"
                    >
                        <svg
                            class="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                        Clear Filters
                    </button>
                {/if}
            </div>

            <div class="flex flex-wrap items-center gap-3">
                <span class="text-sm font-medium text-gray-700">Filters:</span>
                <div class="relative">
                    <select
                        bind:value={selectedMethod}
                        class="appearance-none pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all bg-white text-sm font-medium cursor-pointer"
                    >
                        <option value="">All Methods</option>
                        {#each availableMethods as method}
                            <option value={method}>{method}</option>
                        {/each}
                    </select>
                    <div
                        class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"
                    >
                        <svg
                            class="w-4 h-4 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M19 9l-7 7-7-7"
                            />
                        </svg>
                    </div>
                </div>

                <div class="relative">
                    <select
                        bind:value={selectedStatusRange}
                        class="appearance-none pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all bg-white text-sm font-medium cursor-pointer"
                    >
                        <option value="">All Status Codes</option>
                        <option value="2xx">2xx - Success</option>
                        <option value="3xx">3xx - Redirect</option>
                        <option value="4xx">4xx - Client Error</option>
                        <option value="5xx">5xx - Server Error</option>
                        <option value="no-response">No Response</option>
                    </select>
                    <div
                        class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"
                    >
                        <svg
                            class="w-4 h-4 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M19 9l-7 7-7-7"
                            />
                        </svg>
                    </div>
                </div>

                {#if searchQuery}
                    <span
                        class="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-purple-100 text-purple-700 border border-purple-200 text-sm font-medium"
                    >
                        <svg
                            class="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                        Search: "{searchQuery}"
                    </span>
                {/if}
                {#if selectedMethod}
                    <span
                        class="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-100 text-blue-700 border border-blue-200 text-sm font-medium"
                    >
                        Method: {selectedMethod}
                    </span>
                {/if}
                {#if selectedStatusRange}
                    <span
                        class="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-green-100 text-green-700 border border-green-200 text-sm font-medium"
                    >
                        Status: {selectedStatusRange === "2xx"
                            ? "2xx - Success"
                            : selectedStatusRange === "3xx"
                              ? "3xx - Redirect"
                              : selectedStatusRange === "4xx"
                                ? "4xx - Client Error"
                                : selectedStatusRange === "5xx"
                                  ? "5xx - Server Error"
                                  : "No Response"}
                    </span>
                {/if}
            </div>
            {#if hasActiveFilters && !isPending}
                <div class="text-sm text-gray-600">
                    Showing {filteredSessions.length} of {sessions.length} sessions
                </div>
            {/if}
        </div>

        {#if isPending}
            <div
                class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-12 border border-gray-100"
            >
                <div class="text-center">
                    <div
                        class="mx-auto w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mb-4"
                    >
                        <svg
                            class="w-8 h-8 text-purple-600 animate-spin"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                class="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                stroke-width="4"
                            ></circle>
                            <path
                                class="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                        </svg>
                    </div>
                    <h3 class="text-xl font-semibold text-gray-900 mb-2">
                        Loading Sessions
                    </h3>
                    <p class="text-gray-600">
                        Fetching captured HTTP traffic sessions...
                    </p>
                </div>
            </div>
        {:else if isError}
            <div
                class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-red-200 p-6"
            >
                <div class="flex items-start gap-4">
                    <div class="flex-shrink-0">
                        <div class="p-2 bg-red-100 rounded-lg">
                            <svg
                                class="w-6 h-6 text-red-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </div>
                    </div>
                    <div class="flex-1">
                        <h3 class="text-lg font-semibold text-gray-900 mb-2">
                            Error Loading Sessions
                        </h3>
                        <p class="text-gray-600 mb-4">
                            {error?.message || "Failed to load sessions"}
                        </p>
                        <button
                            onclick={() => query.refetch()}
                            class="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-all font-semibold shadow-md flex items-center gap-2"
                        >
                            <svg
                                class="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                            </svg>
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        {:else if filteredSessions.length === 0}
            <div
                class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-12 border border-gray-100"
            >
                <div class="text-center">
                    <div
                        class="mx-auto w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mb-4"
                    >
                        <svg
                            class="w-8 h-8 text-purple-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                    </div>
                    {#if hasActiveFilters}
                        <h3 class="text-xl font-semibold text-gray-900 mb-2">
                            No Matching Sessions
                        </h3>
                        <p class="text-gray-600 mb-6">
                            No sessions match your current filters. Try
                            adjusting your search criteria.
                        </p>
                        <button
                            onclick={clearFilters}
                            class="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-all font-semibold shadow-md"
                        >
                            Clear All Filters
                        </button>
                    {:else}
                        <h3 class="text-xl font-semibold text-gray-900 mb-2">
                            No Sessions Found
                        </h3>
                        <p class="text-gray-600 mb-6">
                            Start the capture agent to begin capturing HTTP
                            traffic.
                        </p>
                        <div
                            class="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-lg text-sm text-purple-700"
                        >
                            <svg
                                class="w-4 h-4"
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
                            Use the controls above to start capturing
                        </div>
                    {/if}
                </div>
            </div>
        {:else}
            <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {#each filteredSessions as session}
                    <a
                        href="/sessions/{encodeURIComponent(session.sessionId)}"
                        class="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 hover:border-purple-200 hover:scale-[1.02]"
                    >
                        <div class="space-y-4">
                            <div class="flex items-start justify-between">
                                <div class="flex-1 min-w-0">
                                    <div class="flex items-center gap-2 mb-2">
                                        <span
                                            class="inline-flex items-center px-3 py-1 rounded-lg text-sm font-semibold bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-sm"
                                        >
                                            {session.method}
                                        </span>
                                        {#if session.statusCode}
                                            <span
                                                class="inline-flex items-center px-3 py-1 rounded-lg text-sm font-semibold {session.statusCode <
                                                300
                                                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                                                    : session.statusCode < 400
                                                      ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white'
                                                      : 'bg-gradient-to-r from-red-500 to-red-600 text-white'} shadow-sm"
                                            >
                                                {session.statusCode}
                                            </span>
                                        {:else}
                                            <span
                                                class="inline-flex items-center px-3 py-1 rounded-lg text-sm font-semibold bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-sm"
                                            >
                                                No Response
                                            </span>
                                        {/if}
                                    </div>
                                    <p
                                        class="text-sm font-mono text-gray-700 truncate group-hover:text-purple-600 transition-colors"
                                    >
                                        {session.uri}
                                    </p>
                                </div>
                                <svg
                                    class="w-5 h-5 text-gray-400 group-hover:text-purple-500 transition-colors flex-shrink-0 ml-2"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M9 5l7 7-7 7"
                                    />
                                </svg>
                            </div>

                            <div class="grid grid-cols-2 gap-4">
                                <div
                                    class="bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-xl p-3 border border-blue-100"
                                >
                                    <p
                                        class="text-xs text-blue-600 font-medium mb-1 flex items-center gap-1"
                                    >
                                        <svg
                                            class="w-3 h-3"
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
                                        Source
                                    </p>
                                    <p
                                        class="font-mono text-xs text-gray-900 font-semibold"
                                    >
                                        {session.sourceIp}:{session.sourcePort}
                                    </p>
                                </div>
                                <div
                                    class="bg-gradient-to-r from-purple-50 to-purple-100/50 rounded-xl p-3 border border-purple-100"
                                >
                                    <p
                                        class="text-xs text-purple-600 font-medium mb-1 flex items-center gap-1"
                                    >
                                        <svg
                                            class="w-3 h-3"
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
                                        Destination
                                    </p>
                                    <p
                                        class="font-mono text-xs text-gray-900 font-semibold"
                                    >
                                        {session.destIp}:{session.destPort}
                                    </p>
                                </div>
                            </div>

                            <div
                                class="flex items-center gap-2 pt-3 border-t border-gray-200"
                            >
                                <svg
                                    class="w-4 h-4 text-gray-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                <p class="text-xs text-gray-600">
                                    {new Date(
                                        session.timestamp,
                                    ).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </a>
                {/each}
            </div>
        {/if}
    </div>
</div>
