<svelte:options runes={true} />

<script lang="ts">
    import { sendRequest } from "$lib/httpClient";
    import type { Session, HttpHeader } from "$lib/types";
    import type { ReplayResponse } from "$lib/httpClient";
    import FormattedBody from "./FormattedBody.svelte";

    interface Props {
        session: Session;
        onClose: () => void;
    }

    let { session, onClose }: Props = $props();

    // svelte-ignore state_referenced_locally
    const initialData = {
        method: session.request.method,
        protocol: session.destPort === 443 ? "https" : "http",
        ip: session.destIp,
        port: session.destPort,
        uri: session.request.uri,
        headers: session.request.headers.map((h) => ({ ...h })),
        body: session.request.body || "",
    };

    const formattedIp = initialData.ip.includes(":")
        ? `[${initialData.ip}]`
        : initialData.ip;

    let editedMethod = $state(initialData.method);
    let editedUrl = $state(
        `${initialData.protocol}://${formattedIp}:${initialData.port}${initialData.uri}`,
    );
    let editedHeaders = $state<HttpHeader[]>(initialData.headers);
    let editedBody = $state(initialData.body);

    let isReplaying = $state(false);
    let replayResponse = $state<ReplayResponse | null>(null);
    let showingOriginal = $state(true);

    function addHeader() {
        editedHeaders = [...editedHeaders, { name: "", value: "" }];
    }

    function removeHeader(index: number) {
        editedHeaders = editedHeaders.filter((_, i) => i !== index);
    }

    function updateHeader(
        index: number,
        field: "name" | "value",
        value: string,
    ) {
        editedHeaders = editedHeaders.map((h, i) =>
            i === index ? { ...h, [field]: value } : h,
        );
    }

    async function handleReplay() {
        isReplaying = true;
        replayResponse = null;

        try {
            const response = await sendRequest({
                method: editedMethod,
                url: editedUrl,
                headers: editedHeaders.filter((h) => h.name.trim() !== ""),
                body: editedBody || undefined,
            });

            replayResponse = response;
            showingOriginal = false;
        } catch (error) {
            console.error("Replay failed:", error);
        } finally {
            isReplaying = false;
        }
    }

    function resetToOriginal() {
        editedMethod = initialData.method;
        editedUrl = `${initialData.protocol}://${formattedIp}:${initialData.port}${initialData.uri}`;
        editedHeaders = initialData.headers.map((h) => ({ ...h }));
        editedBody = initialData.body;
        replayResponse = null;
    }

    function getContentType(headers: HttpHeader[]): string | undefined {
        const header = headers.find(
            (h) => h.name.toLowerCase() === "content-type",
        );
        return header?.value;
    }

    const originalContentType = $derived(
        getContentType(session.response?.headers || []),
    );
    const replayContentType = $derived(
        replayResponse ? getContentType(replayResponse.headers) : undefined,
    );
</script>

<div
    class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
>
    <div
        class="bg-white rounded-2xl shadow-2xl w-full max-w-6xl my-8 max-h-[90vh] overflow-hidden flex flex-col"
    >
        <div
            class="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50"
        >
            <div class="flex items-center gap-3">
                <div class="p-2 bg-indigo-100 rounded-lg">
                    <svg
                        class="w-6 h-6 text-indigo-600"
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
                </div>
                <h2 class="text-xl font-semibold text-gray-900">
                    Replay Request
                </h2>
            </div>
            <button
                onclick={onClose}
                class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close"
            >
                <svg
                    class="w-6 h-6 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M6 18L18 6M6 6l12 12"
                    />
                </svg>
            </button>
        </div>

        <div class="flex-1 overflow-y-auto p-6 space-y-6">
            <div
                class="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100"
            >
                <h3 class="text-lg font-semibold text-gray-900 mb-4">
                    Edit Request
                </h3>

                <div class="space-y-4">
                    <div class="flex gap-3">
                        <div class="w-32">
                            <label
                                for="method"
                                class="block text-sm font-medium text-gray-700 mb-2"
                                >Method</label
                            >
                            <select
                                bind:value={editedMethod}
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            >
                                <option value="GET">GET</option>
                                <option value="POST">POST</option>
                                <option value="PUT">PUT</option>
                                <option value="PATCH">PATCH</option>
                                <option value="DELETE">DELETE</option>
                                <option value="HEAD">HEAD</option>
                                <option value="OPTIONS">OPTIONS</option>
                            </select>
                        </div>
                        <div class="flex-1">
                            <label
                                for="url"
                                class="block text-sm font-medium text-gray-700 mb-2"
                                >URL</label
                            >
                            <input
                                type="text"
                                bind:value={editedUrl}
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
                                placeholder="https://api.example.com/endpoint"
                            />
                        </div>
                    </div>

                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <label
                                for="headers"
                                class="block text-sm font-medium text-gray-700"
                                >Headers</label
                            >
                            <button
                                onclick={addHeader}
                                class="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
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
                                        d="M12 4v16m8-8H4"
                                    />
                                </svg>
                                Add Header
                            </button>
                        </div>
                        <div class="space-y-2 max-h-48 overflow-y-auto">
                            {#each editedHeaders as header, index}
                                <div class="flex gap-2">
                                    <input
                                        type="text"
                                        value={header.name}
                                        oninput={(e) =>
                                            updateHeader(
                                                index,
                                                "name",
                                                e.currentTarget.value,
                                            )}
                                        placeholder="Header name"
                                        class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
                                    />
                                    <input
                                        type="text"
                                        value={header.value}
                                        oninput={(e) =>
                                            updateHeader(
                                                index,
                                                "value",
                                                e.currentTarget.value,
                                            )}
                                        placeholder="Header value"
                                        class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
                                    />
                                    <button
                                        aria-label="Close"
                                        onclick={() => removeHeader(index)}
                                        class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                            />
                                        </svg>
                                    </button>
                                </div>
                            {/each}
                        </div>
                    </div>

                    {#if ["POST", "PUT", "PATCH"].includes(editedMethod)}
                        <div>
                            <label
                                for="request-body"
                                class="block text-sm font-medium text-gray-700 mb-2"
                                >Request Body</label
                            >
                            <textarea
                                bind:value={editedBody}
                                rows="8"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
                                placeholder="Request body (JSON, XML, etc.)"
                            ></textarea>
                        </div>
                    {/if}
                </div>

                <div class="flex gap-3 mt-6">
                    <button
                        onclick={handleReplay}
                        disabled={isReplaying || !editedUrl.trim()}
                        class="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all font-semibold shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {#if isReplaying}
                            <svg
                                class="w-5 h-5 animate-spin"
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
                            Sending...
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
                                    d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            Send Request
                        {/if}
                    </button>
                    <button
                        onclick={resetToOriginal}
                        class="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-semibold"
                    >
                        Reset to Original
                    </button>
                </div>
            </div>

            {#if replayResponse}
                <div class="space-y-4">
                    <div class="flex items-center justify-center gap-2">
                        <button
                            onclick={() => (showingOriginal = true)}
                            class="px-4 py-2 rounded-lg font-medium transition-all {showingOriginal
                                ? 'bg-indigo-100 text-indigo-700 shadow-sm'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
                        >
                            Original Response
                        </button>
                        <button
                            onclick={() => (showingOriginal = false)}
                            class="px-4 py-2 rounded-lg font-medium transition-all {!showingOriginal
                                ? 'bg-purple-100 text-purple-700 shadow-sm'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
                        >
                            Replayed Response
                        </button>
                    </div>

                    <div class="grid grid-cols-3 gap-4">
                        <div
                            class="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4 border border-indigo-200"
                        >
                            <p class="text-sm text-indigo-600 font-medium mb-1">
                                Original Status
                            </p>
                            <p class="text-2xl font-bold text-indigo-700">
                                {session.response?.statusCode || "N/A"}
                            </p>
                        </div>
                        <div
                            class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200"
                        >
                            <p class="text-sm text-purple-600 font-medium mb-1">
                                Replayed Status
                            </p>
                            <p
                                class="text-2xl font-bold {replayResponse.status >=
                                    200 && replayResponse.status < 300
                                    ? 'text-green-600'
                                    : replayResponse.status >= 400
                                      ? 'text-red-600'
                                      : 'text-purple-700'}"
                            >
                                {replayResponse.error
                                    ? "Error"
                                    : replayResponse.status}
                            </p>
                        </div>
                        <div
                            class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200"
                        >
                            <p class="text-sm text-blue-600 font-medium mb-1">
                                Duration
                            </p>
                            <p class="text-2xl font-bold text-blue-700">
                                {replayResponse.duration}ms
                            </p>
                        </div>
                    </div>

                    {#if replayResponse.error}
                        <div
                            class="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3"
                        >
                            <svg
                                class="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5"
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
                            <div>
                                <h4 class="font-semibold text-red-900 mb-1">
                                    Request Failed
                                </h4>
                                <p class="text-sm text-red-700">
                                    {replayResponse.error}
                                </p>
                            </div>
                        </div>
                    {/if}

                    {#if showingOriginal}
                        {#if session.response?.body}
                            <FormattedBody
                                content={session.response.body}
                                contentType={originalContentType}
                                title="Original Response Body"
                            />
                        {:else}
                            <div class="text-center text-gray-500 py-8">
                                No original response available
                            </div>
                        {/if}
                    {:else if replayResponse && !replayResponse.error}
                        <FormattedBody
                            content={replayResponse.body}
                            contentType={replayContentType}
                            title="Replayed Response Body"
                        />
                    {/if}
                </div>
            {/if}
        </div>
    </div>
</div>
