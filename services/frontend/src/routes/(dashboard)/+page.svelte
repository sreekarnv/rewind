<svelte:options runes={true} />

<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { createQuery } from "@tanstack/svelte-query";
    import { getRealtimeClient } from "$lib/realtime";
    import { sessionsQueries } from "$lib/queries";
    import CaptureControls from "$lib/components/CaptureControls.svelte";
    import type { SessionSummary, Session } from "$lib/types";
    import { exportFullSessions } from "$lib/export";
    import { client } from "$lib/client";
    import {
        Button,
        Badge,
        Card,
        Input,
        Select,
        LoadingState,
        EmptyState,
        ErrorState,
        Modal,
    } from "$lib/components/ui";
    import {
        Search,
        X as CloseX,
        Download,
        ChevronDown,
        ChevronRight,
        ArrowRight,
        ArrowLeft,
        Clock,
        FileText,
    } from "lucide-svelte";

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

    let showExportMenu = $state(false);
    let isExporting = $state(false);
    let exportProgress = $state({ current: 0, total: 0 });

    async function handleExport(format: "har" | "json" | "csv") {
        isExporting = true;
        showExportMenu = false;

        try {
            const fullSessions: Session[] = [];
            exportProgress = { current: 0, total: filteredSessions.length };

            for (let i = 0; i < filteredSessions.length; i++) {
                const sessionSummary = filteredSessions[i];
                try {
                    const response =
                        await client.api.v1.sessions[
                            sessionSummary.sessionId
                        ].get();
                    if (response.data) {
                        fullSessions.push(response.data.session);
                    }
                } catch (err) {
                    console.error(
                        `Failed to fetch session ${sessionSummary.sessionId}:`,
                        err,
                    );
                }
                exportProgress = {
                    current: i + 1,
                    total: filteredSessions.length,
                };
            }

            exportFullSessions(fullSessions, format);
        } catch (error) {
            console.error("Export failed:", error);
            alert("Export failed. Please try again.");
        } finally {
            isExporting = false;
            exportProgress = { current: 0, total: 0 };
        }
    }

    $effect(() => {
        if (!showExportMenu) return;

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest(".export-menu-container")) {
                showExportMenu = false;
            }
        };

        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    });

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

    const statusOptions = [
        { value: "", label: "All Status Codes" },
        { value: "2xx", label: "2xx - Success" },
        { value: "3xx", label: "3xx - Redirect" },
        { value: "4xx", label: "4xx - Client Error" },
        { value: "5xx", label: "5xx - Server Error" },
        { value: "no-response", label: "No Response" },
    ];

    const methodOptions = $derived([
        { value: "", label: "All Methods" },
        ...availableMethods.map((m) => ({ value: m, label: m })),
    ]);

    function getStatusVariant(
        statusCode: number | undefined,
    ): "success" | "warning" | "error" | "default" {
        if (!statusCode) return "default";
        if (statusCode < 300) return "success";
        if (statusCode < 400) return "warning";
        return "error";
    }

    function getStatusLabel(range: string): string {
        switch (range) {
            case "2xx":
                return "2xx - Success";
            case "3xx":
                return "3xx - Redirect";
            case "4xx":
                return "4xx - Client Error";
            case "5xx":
                return "5xx - Server Error";
            case "no-response":
                return "No Response";
            default:
                return "";
        }
    }
</script>

<svelte:head>
    <title>Sessions - Rewind</title>
</svelte:head>

<div
    class="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 px-8 py-12"
>
    <div class="max-w-7xl mx-auto space-y-6">
        <CaptureControls />

        <Card>
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                        <h1
                            class="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
                        >
                            HTTP Sessions
                        </h1>
                        {#if isConnected}
                            <Badge variant="success" pulse>Live Updates</Badge>
                        {:else}
                            <Badge variant="default">Offline</Badge>
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
                            <Clock class="w-4 h-4" />
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
        </Card>

        {#if !isPending && filteredSessions.length > 0}
            <div class="flex justify-end">
                <div class="relative export-menu-container">
                    <Button onclick={() => (showExportMenu = !showExportMenu)}>
                        <Download class="w-5 h-5" />
                        Export Sessions
                        <ChevronDown
                            class="w-4 h-4 transition-transform {showExportMenu
                                ? 'rotate-180'
                                : ''}"
                        />
                    </Button>

                    {#if showExportMenu}
                        <div
                            class="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-10"
                        >
                            <div class="p-2">
                                <div
                                    class="px-3 py-2 text-xs font-semibold text-gray-500 uppercase"
                                >
                                    Export {filteredSessions.length}
                                    {filteredSessions.length === 1
                                        ? "session"
                                        : "sessions"}
                                </div>
                                <button
                                    onclick={() => handleExport("har")}
                                    class="w-full text-left px-3 py-2 rounded-lg hover:bg-purple-50 transition-colors flex items-start gap-3 group"
                                >
                                    <FileText
                                        class="w-5 h-5 text-purple-600 mt-0.5"
                                    />
                                    <div>
                                        <div
                                            class="font-semibold text-gray-900 group-hover:text-purple-700"
                                        >
                                            HAR Format
                                        </div>
                                        <div class="text-xs text-gray-500">
                                            HTTP Archive (Chrome, Postman)
                                        </div>
                                    </div>
                                </button>
                                <button
                                    onclick={() => handleExport("json")}
                                    class="w-full text-left px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors flex items-start gap-3 group"
                                >
                                    <FileText
                                        class="w-5 h-5 text-blue-600 mt-0.5"
                                    />
                                    <div>
                                        <div
                                            class="font-semibold text-gray-900 group-hover:text-blue-700"
                                        >
                                            JSON Format
                                        </div>
                                        <div class="text-xs text-gray-500">
                                            Raw session data (developers)
                                        </div>
                                    </div>
                                </button>
                                <button
                                    onclick={() => handleExport("csv")}
                                    class="w-full text-left px-3 py-2 rounded-lg hover:bg-green-50 transition-colors flex items-start gap-3 group"
                                >
                                    <FileText
                                        class="w-5 h-5 text-green-600 mt-0.5"
                                    />
                                    <div>
                                        <div
                                            class="font-semibold text-gray-900 group-hover:text-green-700"
                                        >
                                            CSV Format
                                        </div>
                                        <div class="text-xs text-gray-500">
                                            Spreadsheet (Excel, Google Sheets)
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    {/if}
                </div>
            </div>
        {/if}

        <Card class="space-y-4">
            <div class="flex items-center gap-2">
                <Input
                    bind:value={searchQuery}
                    placeholder="Search by URL, method, status code, or IP address..."
                    icon={Search}
                    class="flex-1"
                />
                {#if hasActiveFilters}
                    <Button variant="secondary" onclick={clearFilters}>
                        <CloseX class="w-4 h-4" />
                        Clear Filters
                    </Button>
                {/if}
            </div>

            <div class="flex flex-wrap items-center gap-3">
                <span class="text-sm font-medium text-gray-700">Filters:</span>
                <Select
                    bind:value={selectedMethod}
                    options={methodOptions}
                    class="w-48"
                />
                <Select
                    bind:value={selectedStatusRange}
                    options={statusOptions}
                    class="w-56"
                />

                {#if searchQuery}
                    <Badge variant="purple">
                        <Search class="w-4 h-4" />
                        Search: "{searchQuery}"
                    </Badge>
                {/if}
                {#if selectedMethod}
                    <Badge variant="info">Method: {selectedMethod}</Badge>
                {/if}
                {#if selectedStatusRange}
                    <Badge variant="success"
                        >Status: {getStatusLabel(selectedStatusRange)}</Badge
                    >
                {/if}
            </div>

            {#if hasActiveFilters && !isPending}
                <div class="text-sm text-gray-600">
                    Showing {filteredSessions.length} of {sessions.length} sessions
                </div>
            {/if}
        </Card>

        {#if isPending}
            <LoadingState
                title="Loading Sessions"
                description="Fetching captured HTTP traffic sessions..."
            />
        {:else if isError}
            <ErrorState
                title="Error Loading Sessions"
                message={error?.message || "Failed to load sessions"}
                onRetry={() => query.refetch()}
            />
        {:else if filteredSessions.length === 0}
            {#if hasActiveFilters}
                <EmptyState
                    icon={Search}
                    title="No Matching Sessions"
                    description="No sessions match your current filters. Try adjusting your search criteria."
                    actionLabel="Clear All Filters"
                    onAction={clearFilters}
                />
            {:else}
                <Card class="p-12">
                    <div class="text-center">
                        <div
                            class="mx-auto w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mb-4"
                        >
                            <FileText class="w-8 h-8 text-purple-600" />
                        </div>
                        <h3 class="text-xl font-semibold text-gray-900 mb-2">
                            No Sessions Found
                        </h3>
                        <p class="text-gray-600 mb-6">
                            Start the capture agent to begin capturing HTTP
                            traffic.
                        </p>
                        <Badge variant="info">
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
                        </Badge>
                    </div>
                </Card>
            {/if}
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
                                        <Badge variant="method" size="sm"
                                            >{session.method}</Badge
                                        >
                                        {#if session.statusCode}
                                            <Badge
                                                variant={getStatusVariant(
                                                    session.statusCode,
                                                )}
                                                size="sm"
                                            >
                                                {session.statusCode}
                                            </Badge>
                                        {:else}
                                            <Badge variant="default" size="sm"
                                                >No Response</Badge
                                            >
                                        {/if}
                                    </div>
                                    <p
                                        class="text-sm font-mono text-gray-700 truncate group-hover:text-purple-600 transition-colors"
                                    >
                                        {session.uri}
                                    </p>
                                </div>
                                <ChevronRight
                                    class="w-5 h-5 text-gray-400 group-hover:text-purple-500 transition-colors flex-shrink-0 ml-2"
                                />
                            </div>

                            <div class="grid grid-cols-2 gap-4">
                                <div
                                    class="bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-xl p-3 border border-blue-100"
                                >
                                    <p
                                        class="text-xs text-blue-600 font-medium mb-1 flex items-center gap-1"
                                    >
                                        <ArrowLeft class="w-3 h-3" />
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
                                        <ArrowRight class="w-3 h-3" />
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
                                <Clock class="w-4 h-4 text-gray-400" />
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

    <Modal open={isExporting} onClose={() => {}} showCloseButton={false}>
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
                Preparing Export
            </h3>
            <p class="text-gray-600 mb-4">
                Fetching complete session data with headers and bodies...
            </p>
            <div class="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                <div
                    class="bg-gradient-to-r from-purple-500 to-pink-500 h-2.5 rounded-full transition-all duration-300"
                    style="width: {exportProgress.total > 0
                        ? (exportProgress.current / exportProgress.total) * 100
                        : 0}%"
                ></div>
            </div>
            <p class="text-sm text-gray-500">
                {exportProgress.current} of {exportProgress.total} sessions
            </p>
        </div>
    </Modal>
</div>
