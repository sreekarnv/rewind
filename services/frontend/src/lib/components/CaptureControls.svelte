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
    class="bg-white rounded-lg shadow-md p-6 border-l-4 {isRunning
        ? 'border-green-500'
        : hasError
          ? 'border-red-500'
          : 'border-gray-300'}"
>
    <div class="flex items-center justify-between mb-4">
        <div>
            <h3 class="text-lg font-semibold text-gray-900">Capture Agent</h3>
            <p class="text-sm text-gray-500">Control packet capture</p>
        </div>
        <div class="flex items-center gap-2">
            {#if isRunning}
                <span
                    class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                >
                    <span
                        class="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"
                    ></span>
                    Running
                </span>
            {:else if isTransitioning}
                <span
                    class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800"
                >
                    <svg
                        class="animate-spin h-4 w-4 mr-2 text-yellow-600"
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
                    class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800"
                >
                    <span class="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                    Error
                </span>
            {:else}
                <span
                    class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800"
                >
                    <span class="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
                    Stopped
                </span>
            {/if}
        </div>
    </div>

    {#if error || captureState?.error}
        <div class="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <div class="flex">
                <div class="flex-shrink-0">
                    <svg
                        class="h-5 w-5 text-yellow-400"
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
                <div class="ml-3">
                    <h3 class="text-sm font-medium text-yellow-800">
                        Can't start from UI
                    </h3>
                    <div class="mt-2 text-sm text-yellow-700">
                        <p class="mb-2">{error || captureState?.error}</p>
                        <p class="font-medium">
                            💡 Run the capture agent manually instead:
                        </p>
                        <ol
                            class="list-decimal list-inside mt-2 space-y-1 text-xs bg-yellow-100 p-2 rounded"
                        >
                            <li>
                                Open a terminal/command prompt <strong
                                    >as Administrator</strong
                                >
                            </li>
                            <li>
                                Navigate to: <code class="bg-yellow-200 px-1"
                                    >services/capture-agent/build/Release</code
                                >
                            </li>
                            <li>
                                Run: <code class="bg-yellow-200 px-1"
                                    >./capture-agent.exe --config
                                    ../../config/config.yaml</code
                                >
                            </li>
                            <li>Select your network interface when prompted</li>
                        </ol>
                        <p class="mt-2 text-xs">
                            The UI will automatically show captured sessions
                            once the agent is running.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    {/if}

    {#if captureState}
        <div class="grid grid-cols-2 gap-4 mb-4 text-sm">
            {#if captureState.pid}
                <div>
                    <p class="text-gray-500">Process ID</p>
                    <p class="font-medium text-gray-900">{captureState.pid}</p>
                </div>
            {/if}
            {#if captureState.uptime}
                <div>
                    <p class="text-gray-500">Uptime</p>
                    <p class="font-medium text-gray-900">
                        {formatUptime(captureState.uptime)}
                    </p>
                </div>
            {/if}
        </div>
    {/if}

    <div class="flex gap-2">
        {#if isStopped}
            <button
                on:click={handleStart}
                disabled={isLoading}
                class="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
                {#if isLoading}
                    <svg
                        class="animate-spin h-5 w-5 mx-auto"
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
                {:else}
                    ▶️ Start Capture
                {/if}
            </button>
        {:else if isRunning}
            <button
                on:click={handleStop}
                disabled={isLoading}
                class="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
                {#if isLoading}
                    <svg
                        class="animate-spin h-5 w-5 mx-auto"
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
                {:else}
                    ⏹️ Stop Capture
                {/if}
            </button>
            <button
                on:click={handleRestart}
                disabled={isLoading}
                class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
                🔄 Restart
            </button>
        {:else if hasError}
            <button
                on:click={handleStart}
                disabled={isLoading}
                class="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
                🔄 Retry Start
            </button>
        {/if}
    </div>

    <div class="mt-4 text-xs text-gray-600 bg-gray-50 p-3 rounded">
        {#if isRunning}
            <p>
                ✅ Capture agent is actively capturing HTTP traffic. Click "Stop
                Capture" to end the session.
            </p>
        {:else if isStopped}
            <p class="mb-2">
                Click "Start Capture" to launch the agent from the UI, or run it
                manually in a terminal.
            </p>
            <p class="text-gray-500">
                <strong>Note:</strong> Packet capture requires administrator/root
                permissions. If the UI button fails, run the agent manually with elevated
                privileges.
            </p>
        {:else if hasError}
            <p>
                The agent couldn't start automatically. This is normal - packet
                capture requires elevated permissions.
            </p>
        {/if}
    </div>

    {#if isRunning || isTransitioning}
        <div class="mt-4">
            <button
                on:click={() => (showTerminal = !showTerminal)}
                class="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors font-medium text-sm flex items-center justify-center gap-2"
            >
                {#if showTerminal}
                    📊 Hide Agent Output
                {:else}
                    📊 Show Agent Output
                {/if}
            </button>
        </div>
    {/if}

    <div class="mt-4">
        <CaptureTerminal show={showTerminal} />
    </div>
</div>
