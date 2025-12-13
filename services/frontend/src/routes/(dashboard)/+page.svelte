<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { getRealtimeClient } from "$lib/realtime";
    import CaptureControls from "$lib/components/CaptureControls.svelte";
    import type { PageData } from "./$types";
    import type { SessionSummary } from "$lib/types";

    export let data: PageData;

    let sessions: SessionSummary[] = data.sessions || [];
    let error = data.error;
    let isConnected = false;
    let lastUpdate: number | null = null;

    const realtimeClient = getRealtimeClient();

    onMount(() => {
        (async () => {
            try {
                await realtimeClient.connect();
                isConnected = true;
            } catch (err) {
                console.error("Failed to connect to real-time server:", err);
            }

            const unsubscribe = realtimeClient.subscribe((update) => {
                if (update.type === "init" || update.type === "update") {
                    sessions = update.data.sessions;
                    lastUpdate = update.data.timestamp;
                }
            });

            return () => {
                unsubscribe();
            };
        })();
    });

    onDestroy(() => {
        realtimeClient.disconnect();
    });

    $: totalSessions = sessions.length;
    $: uniqueMethods = [...new Set(sessions.map((s) => s.method))].length;
    $: successfulRequests = sessions.filter(
        (s) => s.statusCode && s.statusCode < 400,
    ).length;
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

        {#if error}
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
                    <div>
                        <h3 class="text-lg font-semibold text-gray-900">
                            Error Loading Sessions
                        </h3>
                        <p class="mt-1 text-gray-600">{error}</p>
                    </div>
                </div>
            </div>
        {/if}

        {#if !error && sessions.length === 0}
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
                    <h3 class="text-xl font-semibold text-gray-900 mb-2">
                        No Sessions Found
                    </h3>
                    <p class="text-gray-600 mb-6">
                        Start the capture agent to begin capturing HTTP traffic.
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
                </div>
            </div>
        {/if}

        {#if !error && sessions.length > 0}
            <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {#each sessions as session}
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
