<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { captureApi, type CaptureState } from "$lib/api-capture";
    import CaptureTerminal from "./CaptureTerminal.svelte";

    let captureState: CaptureState | null = null;
    let isLoading = false;
    let error: string | null = null;
    let statusInterval: ReturnType<typeof setInterval> | null = null;
    let showTerminal = false;

    onMount(async () => {
        await fetchStatus();

        statusInterval = setInterval(fetchStatus, 2000);
    });

    onDestroy(() => {
        if (statusInterval) {
            clearInterval(statusInterval);
        }
    });

    async function fetchStatus() {
        try {
            captureState = await captureApi.getStatus();
            error = null;
        } catch (err) {
            console.error("Failed to fetch capture status:", err);
            error =
                err instanceof Error ? err.message : "Failed to fetch status";
        }
    }

    async function handleStart() {
        isLoading = true;
        error = null;
        showTerminal = true;

        try {
            const response = await captureApi.start();
            captureState = response.state;
        } catch (err) {
            error =
                err instanceof Error ? err.message : "Failed to start capture";
        } finally {
            isLoading = false;
        }
    }

    async function handleStop() {
        isLoading = true;
        error = null;

        try {
            const response = await captureApi.stop();
            captureState = response.state;
        } catch (err) {
            error =
                err instanceof Error ? err.message : "Failed to stop capture";
        } finally {
            isLoading = false;
        }
    }

    async function handleRestart() {
        isLoading = true;
        error = null;

        try {
            const response = await captureApi.restart();
            captureState = response.state;
        } catch (err) {
            error =
                err instanceof Error
                    ? err.message
                    : "Failed to restart capture";
        } finally {
            isLoading = false;
        }
    }

    $: isRunning = captureState?.status === "running";
    $: isStopped = captureState?.status === "stopped";
    $: isTransitioning =
        captureState?.status === "starting" ||
        captureState?.status === "stopping";
    $: hasError = captureState?.status === "error";

    function formatUptime(seconds: number): string {
        if (seconds < 60) return `${seconds}s`;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    }
</script>

<div
    class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-gray-100"
>
    <div
        class="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-200"
    >
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
                <div
                    class="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg"
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
                            d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                        />
                    </svg>
                </div>
                <div>
                    <h3
                        class="text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
                    >
                        Capture Agent
                    </h3>
                    <p class="text-sm text-gray-600">Control packet capture</p>
                </div>
            </div>
            <div class="flex items-center gap-2">
                {#if isRunning}
                    <span
                        class="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md"
                    >
                        <span class="relative flex h-2 w-2 mr-2">
                            <span
                                class="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"
                            ></span>
                            <span
                                class="relative inline-flex rounded-full h-2 w-2 bg-white"
                            ></span>
                        </span>
                        Running
                    </span>
                {:else if isTransitioning}
                    <span
                        class="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-md"
                    >
                        <svg
                            class="animate-spin h-4 w-4 mr-2"
                            xmlns="http://www.w3.org/2000/svg"
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
                        {captureState?.status}
                    </span>
                {:else if hasError}
                    <span
                        class="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md"
                    >
                        <span class="w-2 h-2 bg-white rounded-full mr-2"></span>
                        Error
                    </span>
                {:else}
                    <span
                        class="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-md"
                    >
                        <span class="w-2 h-2 bg-white rounded-full mr-2"></span>
                        Stopped
                    </span>
                {/if}
            </div>
        </div>
    </div>

    <div class="p-6">
        {#if error || captureState?.error}
            <div
                class="mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200/50 rounded-xl p-5 shadow-sm"
            >
                <div class="flex gap-4">
                    <div class="flex-shrink-0">
                        <div class="p-2 bg-yellow-100 rounded-lg">
                            <svg
                                class="h-6 w-6 text-yellow-600"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fill-rule="evenodd"
                                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                    clip-rule="evenodd"
                                />
                            </svg>
                        </div>
                    </div>
                    <div class="flex-1">
                        <h3 class="text-sm font-semibold text-yellow-900 mb-2">
                            Can't start from UI
                        </h3>
                        <div class="text-sm text-yellow-800">
                            <p class="mb-3">{error || captureState?.error}</p>
                            <p
                                class="font-semibold mb-2 flex items-center gap-2"
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
                                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                                    />
                                </svg>
                                Run the capture agent manually instead:
                            </p>
                            <ol
                                class="list-decimal list-inside mt-2 space-y-2 text-xs bg-yellow-100/70 p-4 rounded-xl border border-yellow-200"
                            >
                                <li class="ml-2">
                                    Open a terminal/command prompt <strong
                                        class="text-yellow-900"
                                        >as Administrator</strong
                                    >
                                </li>
                                <li class="ml-2">
                                    Navigate to: <code
                                        class="bg-yellow-200 px-2 py-0.5 rounded font-mono text-yellow-900"
                                        >services/capture-agent/build/Release</code
                                    >
                                </li>
                                <li class="ml-2">
                                    Run: <code
                                        class="bg-yellow-200 px-2 py-0.5 rounded font-mono text-yellow-900"
                                        >./capture-agent.exe --config
                                        ../../config/config.yaml</code
                                    >
                                </li>
                                <li class="ml-2">
                                    Select your network interface when prompted
                                </li>
                            </ol>
                            <p
                                class="mt-3 text-xs text-yellow-700 flex items-center gap-2"
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
                                The UI will automatically show captured sessions once
                                the agent is running.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        {/if}

        {#if captureState}
            <div class="grid grid-cols-2 gap-4 mb-6">
                {#if captureState.pid}
                    <div
                        class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100"
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
                                    d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                                />
                            </svg>
                            Process ID
                        </p>
                        <p class="font-mono text-lg font-bold text-gray-900">
                            {captureState.pid}
                        </p>
                    </div>
                {/if}
                {#if captureState.uptime}
                    <div
                        class="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100"
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
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            Uptime
                        </p>
                        <p class="font-mono text-lg font-bold text-gray-900">
                            {formatUptime(captureState.uptime)}
                        </p>
                    </div>
                {/if}
            </div>
        {/if}

        <div class="flex gap-3">
            {#if isStopped}
                <button
                    on:click={handleStart}
                    disabled={isLoading}
                    class="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                    {#if isLoading}
                        <svg
                            class="animate-spin h-5 w-5"
                            xmlns="http://www.w3.org/2000/svg"
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
                        <span>Starting...</span>
                    {:else}
                        <svg
                            class="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                            />
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        <span>Start Capture</span>
                    {/if}
                </button>
            {:else if isRunning}
                <button
                    on:click={handleStop}
                    disabled={isLoading}
                    class="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                    {#if isLoading}
                        <svg
                            class="animate-spin h-5 w-5"
                            xmlns="http://www.w3.org/2000/svg"
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
                        <span>Stopping...</span>
                    {:else}
                        <svg
                            class="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                            />
                        </svg>
                        <span>Stop Capture</span>
                    {/if}
                </button>
                <button
                    on:click={handleRestart}
                    disabled={isLoading}
                    class="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:from-indigo-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                    <svg
                        class="w-5 h-5"
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
                    <span>Restart</span>
                </button>
            {:else if hasError}
                <button
                    on:click={handleStart}
                    disabled={isLoading}
                    class="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                    <svg
                        class="w-5 h-5"
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
                    <span>Retry Start</span>
                </button>
            {/if}
        </div>

        <div
            class="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100"
        >
            <div class="flex items-start gap-3">
                <svg
                    class="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5"
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
                <div class="text-sm text-gray-700">
                    {#if isRunning}
                        <p class="font-medium text-green-700">
                            Capture agent is actively capturing HTTP traffic.
                            Click "Stop Capture" to end the session.
                        </p>
                    {:else if isStopped}
                        <p class="mb-2">
                            Click "Start Capture" to launch the agent from the
                            UI, or run it manually in a terminal.
                        </p>
                        <p class="text-gray-600 text-xs">
                            <strong class="text-gray-700">Note:</strong> Packet capture
                            requires administrator/root permissions. If the UI button
                            fails, run the agent manually with elevated privileges.
                        </p>
                    {:else if hasError}
                        <p>
                            The agent couldn't start automatically. This is
                            normal - packet capture requires elevated
                            permissions.
                        </p>
                    {/if}
                </div>
            </div>
        </div>

        {#if isRunning || isTransitioning}
            <div class="mt-4">
                <button
                    on:click={() => (showTerminal = !showTerminal)}
                    class="w-full px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:from-gray-200 hover:to-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-all duration-200 font-semibold shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                >
                    <svg
                        class="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        {#if showTerminal}
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        {:else}
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                        {/if}
                    </svg>
                    <span
                        >{showTerminal
                            ? "Hide Agent Output"
                            : "Show Agent Output"}</span
                    >
                </button>
            </div>
        {/if}

        <div class="mt-4">
            <CaptureTerminal show={showTerminal} />
        </div>
    </div>
</div>
