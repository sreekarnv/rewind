<svelte:options runes={true} />

<script lang="ts">
    import { page } from "$app/state";
    import { createQuery } from "@tanstack/svelte-query";
    import { sessionsQueries } from "$lib/queries";
    import FormattedBody from "$lib/components/FormattedBody.svelte";
    import RequestReplay from "$lib/components/RequestReplay.svelte";
    import EnhancedHeadersViewer from "$lib/components/EnhancedHeadersViewer.svelte";
    import QueryParamsAndCookies from "$lib/components/QueryParamsAndCookies.svelte";
    import {
        Button,
        Badge,
        Card,
        LoadingState,
        ErrorState,
    } from "$lib/components/ui";
    import {
        ArrowLeft,
        RefreshCw,
        FileText,
        Tag,
        ArrowRight,
        Clock,
        TriangleAlert,
    } from "lucide-svelte";

    const query = createQuery(() => sessionsQueries.detail(page.params.id!));
    const session = $derived(query.data?.session);

    let showReplayModal = $state(false);

    const requestContentType = $derived.by(() => {
        if (!session?.request.headers) return undefined;
        const header = session.request.headers.find(
            (h) => h.name.toLowerCase() === "content-type",
        );
        return header?.value;
    });

    const responseContentType = $derived.by(() => {
        if (!session?.response?.headers) return undefined;
        const header = session.response.headers.find(
            (h) => h.name.toLowerCase() === "content-type",
        );
        return header?.value;
    });
</script>

<svelte:head>
    <title
        >{session
            ? `${session.request.method} ${session.request.uri}`
            : "Session Details"} - Rewind</title
    >
</svelte:head>

<div
    class="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 px-8 py-16"
>
    <div class="max-w-7xl mx-auto space-y-6">
        <div class="flex items-center justify-between">
            <Button variant="secondary" href="/">
                <ArrowLeft class="w-5 h-5" />
                Back to Sessions
            </Button>

            {#if query.isSuccess && session}
                <Button onclick={() => (showReplayModal = true)}>
                    <RefreshCw class="w-5 h-5" />
                    Replay Request
                </Button>
            {/if}
        </div>

        {#if query.isPending}
            <LoadingState
                title="Loading Session"
                description="Fetching session details..."
            />
        {:else if query.isError}
            <ErrorState
                title="Session Not Found"
                message={query.error?.message ||
                    "The requested session could not be found."}
                onRetry={() => query.refetch()}
            />
        {:else if query.isSuccess && session}
            <Card class="p-6">
                <div class="flex items-start justify-between mb-4">
                    <div class="flex items-center gap-3 flex-wrap">
                        <Badge variant="purple" size="lg" class="font-semibold">
                            {session.request.method}
                        </Badge>
                        {#if session.response}
                            {@const status = session.response.statusCode}
                            {@const isSuccess = status >= 200 && status < 300}
                            {@const isRedirect = status >= 300 && status < 400}
                            {@const isClientError =
                                status >= 400 && status < 500}
                            <Badge
                                variant={isSuccess
                                    ? "success"
                                    : isRedirect
                                      ? "info"
                                      : isClientError
                                        ? "warning"
                                        : "error"}
                                size="lg"
                                class="font-semibold"
                            >
                                {session.response.statusCode}
                                {session.response.statusMessage}
                            </Badge>
                        {:else}
                            <Badge
                                variant="default"
                                size="lg"
                                class="font-semibold"
                            >
                                No Response
                            </Badge>
                        {/if}
                    </div>
                    <Badge variant="default" size="sm" class="font-mono">
                        Session ID: {session.sessionId.split("-")[0]}...
                    </Badge>
                </div>

                <h1
                    class="text-2xl font-mono font-semibold text-gray-900 mb-6 break-all bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
                >
                    {session.request.uri}
                </h1>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div
                        class="bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-xl p-4 border border-blue-100"
                    >
                        <p
                            class="text-sm text-blue-600 font-medium mb-1 flex items-center gap-1"
                        >
                            <ArrowLeft class="w-4 h-4" />
                            Source
                        </p>
                        <p
                            class="font-mono text-sm text-gray-900 font-semibold"
                        >
                            {session.sourceIp}:{session.sourcePort}
                        </p>
                    </div>
                    <div
                        class="bg-gradient-to-r from-purple-50 to-purple-100/50 rounded-xl p-4 border border-purple-100"
                    >
                        <p
                            class="text-sm text-purple-600 font-medium mb-1 flex items-center gap-1"
                        >
                            <ArrowRight class="w-4 h-4" />
                            Destination
                        </p>
                        <p
                            class="font-mono text-sm text-gray-900 font-semibold"
                        >
                            {session.destIp}:{session.destPort}
                        </p>
                    </div>
                    <div
                        class="bg-gradient-to-r from-indigo-50 to-indigo-100/50 rounded-xl p-4 border border-indigo-100"
                    >
                        <p
                            class="text-sm text-indigo-600 font-medium mb-1 flex items-center gap-1"
                        >
                            <Clock class="w-4 h-4" />
                            Timestamp
                        </p>
                        <p class="text-sm text-gray-900 font-semibold">
                            {new Date(session.timestamp).toLocaleString()}
                        </p>
                    </div>
                </div>
            </Card>

            <Card class="p-6">
                <div class="flex items-center gap-3 mb-6">
                    <div class="p-2 bg-indigo-100 rounded-lg">
                        <FileText class="w-6 h-6 text-indigo-600" />
                    </div>
                    <h2 class="text-2xl font-semibold text-gray-900">
                        HTTP Headers
                    </h2>
                </div>
                <EnhancedHeadersViewer
                    requestHeaders={session.request.headers}
                    responseHeaders={session.response?.headers}
                    method={session.request.method}
                    url={session.request.uri}
                    statusCode={session.response?.statusCode}
                />
            </Card>

            <Card class="p-6">
                <div class="flex items-center gap-3 mb-6">
                    <div class="p-2 bg-cyan-100 rounded-lg">
                        <Tag class="w-6 h-6 text-cyan-600" />
                    </div>
                    <h2 class="text-2xl font-semibold text-gray-900">
                        Parameters & Cookies
                    </h2>
                </div>
                <QueryParamsAndCookies
                    url={session.request.uri}
                    requestHeaders={session.request.headers}
                    responseHeaders={session.response?.headers}
                />
            </Card>

            {#if session.request.body}
                <FormattedBody
                    content={session.request.body}
                    contentType={requestContentType}
                    title="Request Body"
                />
            {/if}

            {#if session.response}
                {#if session.response.body}
                    <FormattedBody
                        content={session.response.body}
                        contentType={responseContentType}
                        title="Response Body"
                    />
                {/if}
            {:else}
                <Card variant="warning" class="p-6">
                    <div class="flex items-start gap-4">
                        <div class="flex-shrink-0">
                            <div class="p-2 bg-yellow-100 rounded-lg">
                                <TriangleAlert
                                    class="w-6 h-6 text-yellow-600"
                                />
                            </div>
                        </div>
                        <div>
                            <h3 class="text-lg font-semibold text-gray-900">
                                No Response Captured
                            </h3>
                            <p class="mt-1 text-gray-600">
                                This request did not receive a response or the
                                response was not captured.
                            </p>
                        </div>
                    </div>
                </Card>
            {/if}
        {/if}
    </div>

    {#if showReplayModal && session}
        <RequestReplay {session} onClose={() => (showReplayModal = false)} />
    {/if}
</div>
