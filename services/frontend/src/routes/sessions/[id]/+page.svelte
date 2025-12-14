<svelte:options runes={true} />

<script lang="ts">
    import { page } from "$app/state";
    import { createQuery } from "@tanstack/svelte-query";
    import { sessionsQueries } from "$lib/queries";
    import FormattedBody from "$lib/components/FormattedBody.svelte";

    const query = createQuery(() => sessionsQueries.detail(page.params.id!));
    const session = $derived(query.data?.session);

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
        <a
            href="/"
            class="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl shadow-md hover:shadow-lg transition-all duration-300 text-gray-700 hover:text-indigo-600 border border-gray-100 hover:border-indigo-200"
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
                    d="M15 19l-7-7 7-7"
                />
            </svg>
            <span class="font-medium">Back to Sessions</span>
        </a>

        {#if query.isPending}
            <div
                class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-12 border border-gray-100"
            >
                <div class="text-center">
                    <div
                        class="mx-auto w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mb-4"
                    >
                        <svg
                            class="w-8 h-8 text-indigo-600 animate-spin"
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
                        Loading Session
                    </h3>
                    <p class="text-gray-600">Fetching session details...</p>
                </div>
            </div>
        {:else if query.isError}
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
                            Session Not Found
                        </h3>
                        <p class="text-gray-600 mb-4">
                            {query.error?.message ||
                                "The requested session could not be found."}
                        </p>
                        <button
                            onclick={() => query.refetch()}
                            class="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all font-semibold shadow-md flex items-center gap-2"
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
        {:else if query.isSuccess && session}
            <div
                class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-100"
            >
                <div class="flex items-start justify-between mb-4">
                    <div class="flex items-center gap-3 flex-wrap">
                        <span
                            class="inline-flex items-center px-4 py-2 rounded-xl text-base font-semibold bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md"
                        >
                            {session.request.method}
                        </span>
                        {#if session.response}
                            {@const status = session.response.statusCode}
                            {@const isSuccess = status >= 200 && status < 300}
                            {@const isRedirect = status >= 300 && status < 400}
                            {@const isClientError =
                                status >= 400 && status < 500}
                            <span
                                class="inline-flex items-center px-4 py-2 rounded-xl text-base font-semibold {isSuccess
                                    ? 'bg-gradient-to-r from-green-500 to-green-600'
                                    : isRedirect
                                      ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                                      : isClientError
                                        ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                                        : 'bg-gradient-to-r from-red-500 to-red-600'} text-white shadow-md"
                            >
                                {session.response.statusCode}
                                {session.response.statusMessage}
                            </span>
                        {:else}
                            <span
                                class="inline-flex items-center px-4 py-2 rounded-xl text-base font-semibold bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-md"
                            >
                                No Response
                            </span>
                        {/if}
                    </div>
                    <span
                        class="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-lg font-mono"
                    >
                        Session ID: {session.sessionId.split("-")[0]}...
                    </span>
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
                                    d="M7 16l-4-4m0 0l4-4m-4 4h18"
                                />
                            </svg>
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
                                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                                />
                            </svg>
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
                            Timestamp
                        </p>
                        <p class="text-sm text-gray-900 font-semibold">
                            {new Date(session.timestamp).toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>

            <div
                class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-gray-100"
            >
                <div
                    class="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200 flex items-center gap-3"
                >
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
                                d="M7 16l-4-4m0 0l4-4m-4 4h18"
                            />
                        </svg>
                    </div>
                    <h2 class="text-lg font-semibold text-gray-900">
                        Request Headers
                    </h2>
                </div>
                <div class="p-6">
                    <div class="font-mono text-sm space-y-2">
                        {#each session.request.headers as header}
                            <div
                                class="flex gap-2 bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors"
                            >
                                <span
                                    class="text-green-600 font-bold min-w-[200px]"
                                    >{header.name}:</span
                                >
                                <span class="text-gray-900 break-all"
                                    >{header.value}</span
                                >
                            </div>
                        {/each}
                    </div>
                </div>
            </div>

            {#if session.request.body}
                <FormattedBody
                    content={session.request.body}
                    contentType={requestContentType}
                    title="Request Body"
                />
            {/if}

            {#if session.response}
                <div
                    class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-gray-100"
                >
                    <div
                        class="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-200 flex items-center gap-3"
                    >
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
                                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                                />
                            </svg>
                        </div>
                        <h2 class="text-lg font-semibold text-gray-900">
                            Response Headers
                        </h2>
                    </div>
                    <div class="p-6">
                        <div class="font-mono text-sm space-y-2">
                            {#each session.response.headers as header}
                                <div
                                    class="flex gap-2 bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors"
                                >
                                    <span
                                        class="text-purple-600 font-bold min-w-[200px]"
                                        >{header.name}:</span
                                    >
                                    <span class="text-gray-900 break-all"
                                        >{header.value}</span
                                    >
                                </div>
                            {/each}
                        </div>
                    </div>
                </div>

                {#if session.response.body}
                    <FormattedBody
                        content={session.response.body}
                        contentType={responseContentType}
                        title="Response Body"
                    />
                {/if}
            {:else}
                <div
                    class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-yellow-200"
                >
                    <div class="flex items-start gap-4">
                        <div class="flex-shrink-0">
                            <div class="p-2 bg-yellow-100 rounded-lg">
                                <svg
                                    class="w-6 h-6 text-yellow-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                    />
                                </svg>
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
                </div>
            {/if}
        {/if}
    </div>
</div>
