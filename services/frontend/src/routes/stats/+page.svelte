<script lang="ts">
    import LiveMetrics from "$lib/components/LiveMetrics.svelte";
    import type { PageData } from "./$types";

    export let data: PageData;

    $: stats = data.stats;
    $: error = data.error;

    function getPercentage(value: number, total: number): number {
        return total > 0 ? Math.round((value / total) * 100) : 0;
    }

    function sortByValue(obj: Record<string, number>): [string, number][] {
        return Object.entries(obj).sort((a, b) => b[1] - a[1]);
    }

    $: methodEntries = stats ? sortByValue(stats.methodDistribution) : [];
    $: statusEntries = stats ? sortByValue(stats.statusDistribution) : [];

    $: totalRequests = stats?.totalRequests || 0;
</script>

<svelte:head>
    <title>Statistics - Rewind</title>
</svelte:head>

<div class="space-y-6">
    <div>
        <h1 class="text-3xl font-bold text-gray-900">Statistics</h1>
        <p class="mt-1 text-sm text-gray-500">
            Aggregated metrics from captured HTTP traffic
        </p>
    </div>

    <LiveMetrics initialStats={stats} />

    {#if error}
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
            <div class="flex">
                <div class="flex-shrink-0">
                    <svg
                        class="h-5 w-5 text-red-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                    >
                        <path
                            fill-rule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                            clip-rule="evenodd"
                        />
                    </svg>
                </div>
                <div class="ml-3">
                    <h3 class="text-sm font-medium text-red-800">
                        Error loading statistics
                    </h3>
                    <p class="mt-2 text-sm text-red-700">{error}</p>
                </div>
            </div>
        </div>
    {/if}

    {#if stats}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="card">
                <div class="flex items-center">
                    <div
                        class="flex-shrink-0 bg-primary-100 rounded-lg p-3 text-primary-600 w-12 h-12 flex items-center justify-center"
                    >
                        <svg
                            class="w-6 h-6"
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
                    <div class="ml-4">
                        <p class="text-sm font-medium text-gray-500">
                            Total Sessions
                        </p>
                        <p class="text-2xl font-bold text-gray-900">
                            {stats.totalSessions}
                        </p>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="flex items-center">
                    <div
                        class="flex-shrink-0 bg-green-100 rounded-lg p-3 text-green-600 w-12 h-12 flex items-center justify-center"
                    >
                        <svg
                            class="w-6 h-6"
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
                    <div class="ml-4">
                        <p class="text-sm font-medium text-gray-500">
                            Total Requests
                        </p>
                        <p class="text-2xl font-bold text-gray-900">
                            {stats.totalRequests}
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="card">
                <h2 class="text-lg font-semibold text-gray-900 mb-4">
                    HTTP Methods
                </h2>
                <div class="space-y-3">
                    {#each methodEntries as [method, count]}
                        {@const percentage = getPercentage(
                            count,
                            totalRequests,
                        )}
                        <div>
                            <div class="flex justify-between text-sm mb-1">
                                <span class="font-medium text-gray-900"
                                    >{method}</span
                                >
                                <span class="text-gray-500"
                                    >{count} ({percentage}%)</span
                                >
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    class="bg-primary-600 h-2 rounded-full transition-all duration-300"
                                    style="width: {percentage}%"
                                />
                            </div>
                        </div>
                    {/each}
                </div>
            </div>

            <div class="card">
                <h2 class="text-lg font-semibold text-gray-900 mb-4">
                    Status Codes
                </h2>
                <div class="space-y-3">
                    {#each statusEntries as [status, count]}
                        {@const percentage = getPercentage(
                            count,
                            totalRequests,
                        )}
                        {@const statusNum = parseInt(status)}
                        {@const colorClass =
                            statusNum >= 200 && statusNum < 300
                                ? "bg-green-600"
                                : statusNum >= 300 && statusNum < 400
                                  ? "bg-blue-600"
                                  : statusNum >= 400 && statusNum < 500
                                    ? "bg-yellow-600"
                                    : "bg-red-600"}
                        <div>
                            <div class="flex justify-between text-sm mb-1">
                                <span class="font-medium text-gray-900"
                                    >{status}</span
                                >
                                <span class="text-gray-500"
                                    >{count} ({percentage}%)</span
                                >
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    class="{colorClass} h-2 rounded-full transition-all duration-300"
                                    style="width: {percentage}%"
                                />
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="card">
                <h3 class="text-base font-semibold text-gray-900 mb-3">
                    Method Breakdown
                </h3>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr>
                                <th
                                    class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >Method</th
                                >
                                <th
                                    class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >Count</th
                                >
                                <th
                                    class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >Percentage</th
                                >
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200">
                            {#each methodEntries as [method, count]}
                                <tr>
                                    <td
                                        class="px-3 py-2 text-sm font-medium text-gray-900"
                                        >{method}</td
                                    >
                                    <td
                                        class="px-3 py-2 text-sm text-gray-500 text-right"
                                        >{count}</td
                                    >
                                    <td
                                        class="px-3 py-2 text-sm text-gray-500 text-right"
                                        >{getPercentage(
                                            count,
                                            totalRequests,
                                        )}%</td
                                    >
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="card">
                <h3 class="text-base font-semibold text-gray-900 mb-3">
                    Status Code Breakdown
                </h3>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr>
                                <th
                                    class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >Status</th
                                >
                                <th
                                    class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >Count</th
                                >
                                <th
                                    class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >Percentage</th
                                >
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200">
                            {#each statusEntries as [status, count]}
                                <tr>
                                    <td
                                        class="px-3 py-2 text-sm font-medium text-gray-900"
                                        >{status}</td
                                    >
                                    <td
                                        class="px-3 py-2 text-sm text-gray-500 text-right"
                                        >{count}</td
                                    >
                                    <td
                                        class="px-3 py-2 text-sm text-gray-500 text-right"
                                        >{getPercentage(
                                            count,
                                            totalRequests,
                                        )}%</td
                                    >
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    {/if}
</div>
