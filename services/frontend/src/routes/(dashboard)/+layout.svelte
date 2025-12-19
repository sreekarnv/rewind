<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { page } from "$app/stores";
    import NotificationBell from "$lib/components/NotificationBell.svelte";

    $: currentPath = $page.url.pathname;

    let apiConnected = false;
    let checkInterval: ReturnType<typeof setInterval> | null = null;

    async function checkApiHealth() {
        try {
            const response = await fetch(
                "http://localhost:8000/api/v1/sessions",
                {
                    method: "HEAD",
                    signal: AbortSignal.timeout(3000),
                },
            );
            apiConnected = response.ok;
        } catch (error) {
            apiConnected = false;
        }
    }

    onMount(() => {
        checkApiHealth();
        checkInterval = setInterval(checkApiHealth, 5000);
    });

    onDestroy(() => {
        if (checkInterval) {
            clearInterval(checkInterval);
        }
    });
</script>

<div
    class="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50"
>
    <header
        class="sticky top-0 z-50 bg-white/70 backdrop-blur-lg shadow-sm border-b border-white/20"
    >
        <nav class="max-w-7xl mx-auto px-4 md:px-0">
            <div class="flex justify-between items-center h-16">
                <div class="flex-shrink-0 flex items-center">
                    <a href="/" class="flex items-center gap-2 group">
                        <div
                            class="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center group-hover:from-purple-600 group-hover:to-indigo-600 transition-all"
                        >
                            <svg
                                class="w-5 h-5 text-white"
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
                            class="text-2xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent group-hover:from-purple-700 group-hover:via-indigo-700 group-hover:to-blue-700 transition-all"
                        >
                            Rewind
                        </span>
                    </a>
                </div>

                <div
                    class="hidden sm:flex sm:space-x-2 absolute left-1/2 transform -translate-x-1/2"
                >
                    <a
                        href="/"
                        class="inline-flex items-center px-4 py-1 rounded-lg text-sm font-semibold transition-all duration-200 {currentPath ===
                            '/' || currentPath.startsWith('/sessions')
                            ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md'
                            : 'text-gray-700 hover:bg-white/60 hover:text-purple-600'}"
                    >
                        <svg
                            class="w-4 h-4 mr-2"
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
                        Sessions
                    </a>
                    <a
                        href="/stats"
                        class="inline-flex items-center px-4 py-1 rounded-lg text-sm font-semibold transition-all duration-200 {currentPath ===
                        '/stats'
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md'
                            : 'text-gray-700 hover:bg-white/60 hover:text-green-600'}"
                    >
                        <svg
                            class="w-4 h-4 mr-2"
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
                        Statistics
                    </a>
                    <a
                        href="/metrics"
                        class="inline-flex items-center px-4 py-1 rounded-lg text-sm font-semibold transition-all duration-200 {currentPath ===
                        '/metrics'
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md'
                            : 'text-gray-700 hover:bg-white/60 hover:text-blue-600'}"
                    >
                        <svg
                            class="w-4 h-4 mr-2"
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
                        Metrics
                    </a>
                    <a
                        href="/alerts"
                        class="inline-flex items-center px-4 py-1 rounded-lg text-sm font-semibold transition-all duration-200 {currentPath ===
                        '/alerts'
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                            : 'text-gray-700 hover:bg-white/60 hover:text-amber-600'}"
                    >
                        <svg
                            class="w-4 h-4 mr-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                            />
                        </svg>
                        Alerts
                    </a>
                </div>

                <div class="flex items-center gap-3">
                    <NotificationBell />
                    {#if apiConnected}
                        <div
                            class="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-green-200/50 shadow-sm"
                        >
                            <span class="relative flex h-2 w-2">
                                <span
                                    class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"
                                ></span>
                                <span
                                    class="relative inline-flex rounded-full h-2 w-2 bg-green-500"
                                ></span>
                            </span>
                            <span class="text-sm font-medium text-gray-700"
                                >API Connected</span
                            >
                        </div>
                    {:else}
                        <div
                            class="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-red-200/50 shadow-sm"
                        >
                            <span class="relative flex h-2 w-2">
                                <span
                                    class="relative inline-flex rounded-full h-2 w-2 bg-red-500"
                                ></span>
                            </span>
                            <span class="text-sm font-medium text-gray-700"
                                >API Disconnected</span
                            >
                        </div>
                    {/if}
                </div>
            </div>
        </nav>
    </header>

    <main class="flex-1 w-full">
        <slot />
    </main>

    <footer
        class="bg-white/70 backdrop-blur-lg border-t border-white/20 mt-auto"
    >
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div class="flex items-center justify-center gap-2">
                <div
                    class="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center"
                >
                    <svg
                        class="w-5 h-5 text-white"
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
                <p
                    class="text-sm font-medium bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent"
                >
                    Rewind - HTTP Traffic Capture & Analysis Platform
                </p>
            </div>
        </div>
    </footer>
</div>
