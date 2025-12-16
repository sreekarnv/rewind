<svelte:options runes={true} />

<script lang="ts">
    import type { HttpHeader } from "$lib/types";

    interface Props {
        requestHeaders: HttpHeader[];
        responseHeaders?: HttpHeader[];
        method: string;
        url: string;
        statusCode?: number;
    }

    let {
        requestHeaders,
        responseHeaders = [],
        method,
        url,
        statusCode,
    }: Props = $props();

    let searchQuery = $state("");
    let copiedHeader = $state<string | null>(null);
    let expandedSections = $state<Record<string, boolean>>({
        general: true,
        request: true,
        response: true,
        security: true,
    });

    const importantHeaders = new Set([
        "authorization",
        "content-type",
        "content-length",
        "cookie",
        "set-cookie",
        "user-agent",
        "host",
        "accept",
        "accept-encoding",
        "cache-control",
    ]);

    const securityHeaders = new Set([
        "access-control-allow-origin",
        "access-control-allow-methods",
        "access-control-allow-headers",
        "access-control-allow-credentials",
        "access-control-expose-headers",
        "access-control-max-age",
        "x-frame-options",
        "x-content-type-options",
        "x-xss-protection",
        "strict-transport-security",
        "content-security-policy",
        "referrer-policy",
        "permissions-policy",
    ]);

    function filterHeaders(headers: HttpHeader[]): HttpHeader[] {
        if (!searchQuery.trim()) return headers;
        const query = searchQuery.toLowerCase();
        return headers.filter(
            (h) =>
                h.name.toLowerCase().includes(query) ||
                h.value.toLowerCase().includes(query),
        );
    }

    const categorizedHeaders = $derived(() => {
        const security: HttpHeader[] = [];
        const request: HttpHeader[] = [];
        const response: HttpHeader[] = [];

        requestHeaders.forEach((h) => {
            if (securityHeaders.has(h.name.toLowerCase())) {
                security.push({ ...h, source: "request" });
            } else {
                request.push(h);
            }
        });

        responseHeaders.forEach((h) => {
            if (securityHeaders.has(h.name.toLowerCase())) {
                security.push({ ...h, source: "response" });
            } else {
                response.push(h);
            }
        });

        return {
            request: filterHeaders(request),
            response: filterHeaders(response),
            security: filterHeaders(security),
        };
    });

    async function copyHeader(name: string, value: string) {
        try {
            await navigator.clipboard.writeText(`${name}: ${value}`);
            copiedHeader = `${name}:${value}`;
            setTimeout(() => (copiedHeader = null), 2000);
        } catch (error) {
            console.error("Failed to copy:", error);
        }
    }

    function toggleSection(section: string) {
        expandedSections = {
            ...expandedSections,
            [section]: !expandedSections[section],
        };
    }

    function isImportant(name: string): boolean {
        return importantHeaders.has(name.toLowerCase());
    }

    function getStatusColor(status?: number): string {
        if (!status) return "text-gray-600";
        if (status >= 200 && status < 300) return "text-green-600";
        if (status >= 300 && status < 400) return "text-blue-600";
        if (status >= 400 && status < 500) return "text-orange-600";
        return "text-red-600";
    }
</script>

<div class="space-y-4">
    <div class="relative">
        <input
            type="text"
            bind:value={searchQuery}
            placeholder="Search headers..."
            class="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <svg
            class="w-5 h-5 text-gray-400 absolute left-3 top-2.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
        >
            <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
        </svg>
    </div>

    <div class="border border-gray-200 rounded-lg overflow-hidden">
        <button
            onclick={() => toggleSection("general")}
            class="w-full px-4 py-3 bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 transition-colors flex items-center justify-between"
        >
            <div class="flex items-center gap-2">
                <svg
                    class="w-5 h-5 text-blue-600"
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
                <span class="font-semibold text-gray-900">General</span>
                <span
                    class="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full"
                    >3</span
                >
            </div>
            <svg
                class="w-5 h-5 text-gray-500 transition-transform {expandedSections.general
                    ? 'rotate-180'
                    : ''}"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                />
            </svg>
        </button>

        {#if expandedSections.general}
            <div class="divide-y divide-gray-100">
                <div
                    class="px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-4"
                >
                    <span class="text-sm font-medium text-gray-500 w-24"
                        >Method</span
                    >
                    <span
                        class="flex-1 font-mono text-sm font-semibold text-indigo-600"
                        >{method}</span
                    >
                </div>
                <div
                    class="px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-4"
                >
                    <span class="text-sm font-medium text-gray-500 w-24"
                        >URL</span
                    >
                    <span
                        class="flex-1 font-mono text-sm text-gray-900 break-all"
                        >{url}</span
                    >
                </div>
                {#if statusCode}
                    <div
                        class="px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-4"
                    >
                        <span class="text-sm font-medium text-gray-500 w-24"
                            >Status</span
                        >
                        <span
                            class="flex-1 font-mono text-sm font-semibold {getStatusColor(
                                statusCode,
                            )}">{statusCode}</span
                        >
                    </div>
                {/if}
            </div>
        {/if}
    </div>

    <div class="border border-gray-200 rounded-lg overflow-hidden">
        <button
            onclick={() => toggleSection("request")}
            class="w-full px-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 transition-colors flex items-center justify-between"
        >
            <div class="flex items-center gap-2">
                <svg
                    class="w-5 h-5 text-indigo-600"
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
                <span class="font-semibold text-gray-900">Request Headers</span>
                <span
                    class="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full"
                    >{categorizedHeaders().request.length}</span
                >
            </div>
            <svg
                class="w-5 h-5 text-gray-500 transition-transform {expandedSections.request
                    ? 'rotate-180'
                    : ''}"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                />
            </svg>
        </button>

        {#if expandedSections.request}
            <div class="divide-y divide-gray-100">
                {#each categorizedHeaders().request as header}
                    <div
                        class="px-4 py-3 hover:bg-gray-50 transition-colors flex items-start gap-4 group"
                    >
                        <span
                            class="text-sm font-medium w-48 flex-shrink-0 {isImportant(
                                header.name,
                            )
                                ? 'text-indigo-600 font-semibold'
                                : 'text-gray-600'}"
                        >
                            {header.name}
                            {#if isImportant(header.name)}
                                <span
                                    class="inline-block w-1.5 h-1.5 bg-indigo-500 rounded-full ml-1"
                                ></span>
                            {/if}
                        </span>
                        <span
                            class="flex-1 font-mono text-sm text-gray-900 break-all"
                            >{header.value}</span
                        >
                        <button
                            onclick={() =>
                                copyHeader(header.name, header.value)}
                            class="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded"
                            title="Copy header"
                        >
                            {#if copiedHeader === `${header.name}:${header.value}`}
                                <svg
                                    class="w-4 h-4 text-green-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                            {:else}
                                <svg
                                    class="w-4 h-4 text-gray-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                    />
                                </svg>
                            {/if}
                        </button>
                    </div>
                {/each}
                {#if categorizedHeaders().request.length === 0}
                    <div class="px-4 py-8 text-center text-gray-500">
                        {searchQuery
                            ? "No headers match your search"
                            : "No request headers"}
                    </div>
                {/if}
            </div>
        {/if}
    </div>

    {#if responseHeaders.length > 0}
        <div class="border border-gray-200 rounded-lg overflow-hidden">
            <button
                onclick={() => toggleSection("response")}
                class="w-full px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 transition-colors flex items-center justify-between"
            >
                <div class="flex items-center gap-2">
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
                            d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z"
                        />
                    </svg>
                    <span class="font-semibold text-gray-900"
                        >Response Headers</span
                    >
                    <span
                        class="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full"
                        >{categorizedHeaders().response.length}</span
                    >
                </div>
                <svg
                    class="w-5 h-5 text-gray-500 transition-transform {expandedSections.response
                        ? 'rotate-180'
                        : ''}"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 9l-7 7-7-7"
                    />
                </svg>
            </button>

            {#if expandedSections.response}
                <div class="divide-y divide-gray-100">
                    {#each categorizedHeaders().response as header}
                        <div
                            class="px-4 py-3 hover:bg-gray-50 transition-colors flex items-start gap-4 group"
                        >
                            <span
                                class="text-sm font-medium w-48 flex-shrink-0 {isImportant(
                                    header.name,
                                )
                                    ? 'text-green-600 font-semibold'
                                    : 'text-gray-600'}"
                            >
                                {header.name}
                                {#if isImportant(header.name)}
                                    <span
                                        class="inline-block w-1.5 h-1.5 bg-green-500 rounded-full ml-1"
                                    ></span>
                                {/if}
                            </span>
                            <span
                                class="flex-1 font-mono text-sm text-gray-900 break-all"
                                >{header.value}</span
                            >
                            <button
                                onclick={() =>
                                    copyHeader(header.name, header.value)}
                                class="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded"
                                title="Copy header"
                            >
                                {#if copiedHeader === `${header.name}:${header.value}`}
                                    <svg
                                        class="w-4 h-4 text-green-600"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                {:else}
                                    <svg
                                        class="w-4 h-4 text-gray-600"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                        />
                                    </svg>
                                {/if}
                            </button>
                        </div>
                    {/each}
                    {#if categorizedHeaders().response.length === 0}
                        <div class="px-4 py-8 text-center text-gray-500">
                            {searchQuery
                                ? "No headers match your search"
                                : "No response headers"}
                        </div>
                    {/if}
                </div>
            {/if}
        </div>
    {/if}

    {#if categorizedHeaders().security.length > 0 || !searchQuery}
        <div class="border border-gray-200 rounded-lg overflow-hidden">
            <button
                onclick={() => toggleSection("security")}
                class="w-full px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 transition-colors flex items-center justify-between"
            >
                <div class="flex items-center gap-2">
                    <svg
                        class="w-5 h-5 text-amber-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                    </svg>
                    <span class="font-semibold text-gray-900"
                        >Security Headers</span
                    >
                    <span
                        class="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full"
                        >{categorizedHeaders().security.length}</span
                    >
                </div>
                <svg
                    class="w-5 h-5 text-gray-500 transition-transform {expandedSections.security
                        ? 'rotate-180'
                        : ''}"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 9l-7 7-7-7"
                    />
                </svg>
            </button>

            {#if expandedSections.security}
                <div class="divide-y divide-gray-100">
                    {#each categorizedHeaders().security as header}
                        <div
                            class="px-4 py-3 hover:bg-gray-50 transition-colors flex items-start gap-4 group"
                        >
                            <span
                                class="text-sm font-medium text-amber-600 w-48 flex-shrink-0"
                            >
                                {header.name}
                                <span class="text-xs text-gray-500 ml-1">
                                    ({header.source || "request"})
                                </span>
                            </span>
                            <span
                                class="flex-1 font-mono text-sm text-gray-900 break-all"
                                >{header.value}</span
                            >
                            <button
                                onclick={() =>
                                    copyHeader(header.name, header.value)}
                                class="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded"
                                title="Copy header"
                            >
                                {#if copiedHeader === `${header.name}:${header.value}`}
                                    <svg
                                        class="w-4 h-4 text-green-600"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                {:else}
                                    <svg
                                        class="w-4 h-4 text-gray-600"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                        />
                                    </svg>
                                {/if}
                            </button>
                        </div>
                    {/each}
                    {#if categorizedHeaders().security.length === 0}
                        <div class="px-4 py-8 text-center text-gray-500">
                            {searchQuery
                                ? "No security headers match your search"
                                : "No security headers found"}
                        </div>
                    {/if}
                </div>
            {/if}
        </div>
    {/if}
</div>
