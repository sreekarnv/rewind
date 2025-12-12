<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { getRealtimeClient } from "$lib/realtime";
    import type { Stats } from "$lib/types";

    export let initialStats: Stats | null = null;

    let stats: Stats | null = initialStats;
    let isConnected = false;
    let lastUpdate: number | null = null;

    const realtimeClient = getRealtimeClient();

    onMount(async () => {
        if (!realtimeClient.isConnected()) {
            try {
                await realtimeClient.connect();
                isConnected = true;
            } catch (err) {
                console.error("Failed to connect to real-time server:", err);
            }
        } else {
            isConnected = true;
        }

        const unsubscribe = realtimeClient.subscribe((update) => {
            if (update.type === "init" || update.type === "update") {
                stats = update.data.stats;
                lastUpdate = update.data.timestamp;
                isConnected = true;
            }
        });

        return () => {
            unsubscribe();
        };
    });

    $: totalRequests = stats?.totalRequests || 0;
    $: totalSessions = stats?.totalSessions || 0;
</script>

<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div
        class="bg-white rounded-lg shadow-md p-4 border-l-4 {isConnected
            ? 'border-green-500'
            : 'border-gray-300'}"
    >
        <div class="flex items-center justify-between">
            <div>
                <p class="text-sm font-medium text-gray-500">Connection</p>
                <p class="text-lg font-bold text-gray-900">
                    {isConnected ? "Live" : "Offline"}
                </p>
            </div>
            <div
                class="w-12 h-12 bg-{isConnected
                    ? 'green'
                    : 'gray'}-100 rounded-full flex items-center justify-center"
            >
                <div
                    class="w-6 h-6 bg-{isConnected
                        ? 'green'
                        : 'gray'}-500 rounded-full {isConnected
                        ? 'animate-pulse'
                        : ''}"
                ></div>
            </div>
        </div>
        {#if lastUpdate}
            <p class="text-xs text-gray-400 mt-2">
                Updated: {new Date(lastUpdate).toLocaleTimeString()}
            </p>
        {/if}
    </div>

    <div class="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
        <div class="flex items-center justify-between">
            <div>
                <p class="text-sm font-medium text-gray-500">Total Sessions</p>
                <p class="text-2xl font-bold text-gray-900">{totalSessions}</p>
            </div>
            <div
                class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center"
            >
                <svg
                    class="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                </svg>
            </div>
        </div>
    </div>
    <div class="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
        <div class="flex items-center justify-between">
            <div>
                <p class="text-sm font-medium text-gray-500">Total Requests</p>
                <p class="text-2xl font-bold text-gray-900">{totalRequests}</p>
            </div>
            <div
                class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center"
            >
                <svg
                    class="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                </svg>
            </div>
        </div>
    </div>
</div>
