<svelte:options runes={true} />

<script lang="ts">
    import { createQuery } from "@tanstack/svelte-query";
    import { statsQueries } from "$lib/queries";
    import LiveMetrics from "$lib/components/LiveMetrics.svelte";
    import { LoadingState, ErrorState, Badge } from "$lib/components/ui";

    const query = createQuery(() => statsQueries.all());

    function getPercentage(value: number, total: number): number {
        return total > 0 ? Math.round((value / total) * 100) : 0;
    }

    function sortByValue(obj: Record<string, number>): [string, number][] {
        return Object.entries(obj).sort((a, b) => b[1] - a[1]);
    }

    const isPending = $derived(query.isPending);
    const isError = $derived(query.isError);
    const isSuccess = $derived(query.isSuccess);
    const error = $derived(query.error);
    const stats = $derived(query.data);
    const methodEntries = $derived(
        stats ? sortByValue(stats.methodDistribution) : [],
    );
    const statusEntries = $derived(
        stats ? sortByValue(stats.statusDistribution) : [],
    );
    const totalRequests = $derived(stats?.totalSessions || 0);
</script>

<svelte:head>
    <title>Statistics - Rewind</title>
</svelte:head>

<div
    class="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 px-8 py-12"
>
    <div class="max-w-7xl mx-auto space-y-6">
        <div
            class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-100"
        >
            <h1
                class="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2"
            >
                Statistics
            </h1>
            <p class="text-gray-600">
                Aggregated metrics from captured HTTP traffic
            </p>
        </div>

        {#if isPending}
            <LoadingState
                title="Loading Statistics"
                description="Fetching traffic statistics..."
            />
        {:else if isError}
            <ErrorState
                title="Error Loading Statistics"
                message={error?.message || "Failed to load statistics"}
                onRetry={() => query.refetch()}
            />
        {:else if stats}
            <LiveMetrics initialStats={stats} />
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div
                    class="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-green-100"
                >
                    <div
                        class="absolute inset-0 bg-gradient-to-br from-green-500/5 to-green-600/5"
                    ></div>
                    <div class="relative p-6">
                        <div class="flex items-center justify-between">
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
                                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                    />
                                </svg>
                            </div>
                            <span
                                class="text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full"
                            >
                                Sessions
                            </span>
                        </div>
                        <h3 class="text-sm font-medium text-gray-600 mb-1 mt-4">
                            Total Requests
                        </h3>
                        <p class="text-3xl font-bold text-gray-900">
                            {stats.totalSessions.toLocaleString()}
                        </p>
                    </div>
                </div>

                <div
                    class="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-blue-100"
                >
                    <div
                        class="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/5"
                    ></div>
                    <div class="relative p-6">
                        <div class="flex items-center justify-between">
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
                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            </div>
                            <span
                                class="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full"
                            >
                                HTTP
                            </span>
                        </div>
                        <h3 class="text-sm font-medium text-gray-600 mb-1 mt-4">
                            Unique Methods
                        </h3>
                        <p class="text-3xl font-bold text-gray-900">
                            {Object.keys(stats.methodDistribution || {}).length}
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
                        <div class="flex items-center justify-between">
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
                                        d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                                    />
                                </svg>
                            </div>
                            <span
                                class="text-sm font-medium text-purple-600 bg-purple-50 px-3 py-1 rounded-full"
                            >
                                Responses
                            </span>
                        </div>
                        <h3 class="text-sm font-medium text-gray-600 mb-1 mt-4">
                            Status Codes
                        </h3>
                        <p class="text-3xl font-bold text-gray-900">
                            {Object.keys(stats.statusDistribution || {}).length}
                        </p>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                                    d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                                />
                            </svg>
                        </div>
                        <h2 class="text-xl font-semibold text-gray-900">
                            HTTP Methods
                        </h2>
                    </div>
                    <div class="space-y-4">
                        {#each methodEntries as [method, count]}
                            {@const percentage = getPercentage(
                                count,
                                totalRequests,
                            )}
                            <div>
                                <div class="flex justify-between text-sm mb-2">
                                    <span
                                        class="font-semibold text-gray-900 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent"
                                        >{method}</span
                                    >
                                    <span class="text-gray-600 font-medium"
                                        >{count}
                                        <span class="text-gray-400"
                                            >({percentage}%)</span
                                        ></span
                                    >
                                </div>
                                <div
                                    class="w-full bg-gray-100 rounded-full h-3 overflow-hidden shadow-inner"
                                >
                                    <div
                                        class="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-500 shadow-sm"
                                        style="width: {percentage}%"
                                    ></div>
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>

                <!-- Status Codes -->
                <div
                    class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-100"
                >
                    <div class="flex items-center gap-3 mb-6">
                        <div class="p-2 bg-purple-100 rounded-lg">
                            <svg
                                class="w-5 h-5 text-purple-600"
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
                            Status Codes
                        </h2>
                    </div>
                    <div class="space-y-4">
                        {#each statusEntries as [status, count]}
                            {@const percentage = getPercentage(
                                count,
                                totalRequests,
                            )}
                            {@const statusNum = parseInt(status)}
                            {@const isSuccess =
                                statusNum >= 200 && statusNum < 300}
                            {@const isRedirect =
                                statusNum >= 300 && statusNum < 400}
                            {@const isClientError =
                                statusNum >= 400 && statusNum < 500}
                            {@const isServerError = statusNum >= 500}
                            <div>
                                <div class="flex justify-between text-sm mb-2">
                                    <span class="font-semibold text-gray-900"
                                        >{status}</span
                                    >
                                    <span class="text-gray-600 font-medium"
                                        >{count}
                                        <span class="text-gray-400"
                                            >({percentage}%)</span
                                        ></span
                                    >
                                </div>
                                <div
                                    class="w-full bg-gray-100 rounded-full h-3 overflow-hidden shadow-inner"
                                >
                                    <div
                                        class="h-3 rounded-full transition-all duration-500 shadow-sm {isSuccess
                                            ? 'bg-gradient-to-r from-green-500 to-green-600'
                                            : isRedirect
                                              ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                                              : isClientError
                                                ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                                                : 'bg-gradient-to-r from-red-500 to-red-600'}"
                                        style="width: {percentage}%"
                                    ></div>
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div
                    class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-gray-100"
                >
                    <div
                        class="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200"
                    >
                        <h3 class="text-lg font-semibold text-gray-900">
                            Method Breakdown
                        </h3>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50/50">
                                <tr>
                                    <th
                                        class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                                        >Method</th
                                    >
                                    <th
                                        class="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider"
                                        >Count</th
                                    >
                                    <th
                                        class="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider"
                                        >%</th
                                    >
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-100">
                                {#each methodEntries as [method, count]}
                                    <tr
                                        class="hover:bg-green-50/50 transition-colors"
                                    >
                                        <td
                                            class="px-6 py-4 text-sm font-semibold text-gray-900"
                                            >{method}</td
                                        >
                                        <td
                                            class="px-6 py-4 text-sm text-gray-600 text-right font-medium"
                                            >{count}</td
                                        >
                                        <td
                                            class="px-6 py-4 text-sm text-gray-500 text-right"
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

                <div
                    class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-gray-100"
                >
                    <div
                        class="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-200"
                    >
                        <h3 class="text-lg font-semibold text-gray-900">
                            Status Code Breakdown
                        </h3>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50/50">
                                <tr>
                                    <th
                                        class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                                        >Status</th
                                    >
                                    <th
                                        class="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider"
                                        >Count</th
                                    >
                                    <th
                                        class="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider"
                                        >%</th
                                    >
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-100">
                                {#each statusEntries as [status, count]}
                                    {@const statusNum = parseInt(status)}
                                    {@const isSuccess =
                                        statusNum >= 200 && statusNum < 300}
                                    {@const isRedirect =
                                        statusNum >= 300 && statusNum < 400}
                                    {@const isClientError =
                                        statusNum >= 400 && statusNum < 500}
                                    <tr
                                        class="hover:bg-purple-50/50 transition-colors"
                                    >
                                        <td
                                            class="px-6 py-4 text-sm font-semibold"
                                        >
                                            <Badge
                                                variant={isSuccess
                                                    ? "success"
                                                    : isRedirect
                                                      ? "info"
                                                      : isClientError
                                                        ? "warning"
                                                        : "error"}
                                                size="xs"
                                            >
                                                {status}
                                            </Badge>
                                        </td>
                                        <td
                                            class="px-6 py-4 text-sm text-gray-600 text-right font-medium"
                                            >{count}</td
                                        >
                                        <td
                                            class="px-6 py-4 text-sm text-gray-500 text-right"
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
</div>
