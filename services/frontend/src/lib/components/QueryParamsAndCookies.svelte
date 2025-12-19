<svelte:options runes={true} />

<script lang="ts">
    import type { HttpHeader } from "$lib/types";

    interface Props {
        url: string;
        requestHeaders: HttpHeader[];
        responseHeaders?: HttpHeader[];
    }

    let { url, requestHeaders, responseHeaders = [] }: Props = $props();

    let searchQuery = $state("");
    let copiedItem = $state<string | null>(null);
    let expandedSections = $state<Record<string, boolean>>({
        queryParams: true,
        cookies: true,
    });

    interface ParsedParam {
        key: string;
        value: string;
    }

    const queryParams = $derived.by(() => {
        try {
            const urlObj = new URL(url, "http://dummy.com");
            const params: ParsedParam[] = [];
            urlObj.searchParams.forEach((value, key) => {
                params.push({ key, value });
            });
            return params;
        } catch {
            const queryString = url.split("?")[1];
            if (!queryString) return [];

            return queryString.split("&").map((param) => {
                const [key, ...valueParts] = param.split("=");
                const value = valueParts.join("=");
                return {
                    key: decodeURIComponent(key || ""),
                    value: decodeURIComponent(value || ""),
                };
            });
        }
    });

    const requestCookies = $derived.by(() => {
        const cookieHeader = requestHeaders.find(
            (h) => h.name.toLowerCase() === "cookie",
        );
        if (!cookieHeader) return [];

        return cookieHeader.value.split(";").map((cookie) => {
            const [key, ...valueParts] = cookie.trim().split("=");
            return {
                key: key?.trim() || "",
                value: valueParts.join("=").trim(),
            };
        });
    });

    const responseCookies = $derived.by(() => {
        const setCookieHeaders = responseHeaders.filter(
            (h) => h.name.toLowerCase() === "set-cookie",
        );
        if (setCookieHeaders.length === 0) return [];

        return setCookieHeaders.map((header) => {
            const parts = header.value.split(";");
            const [key, ...valueParts] = (parts[0] || "").split("=");
            const value = valueParts.join("=");

            const attributes = parts.slice(1).map((attr) => attr.trim());

            return {
                key: key?.trim() || "",
                value: value?.trim() || "",
                attributes:
                    attributes.length > 0 ? attributes.join("; ") : undefined,
            };
        });
    });

    function filterItems(items: ParsedParam[]): ParsedParam[] {
        if (!searchQuery.trim()) return items;
        const query = searchQuery.toLowerCase();
        return items.filter(
            (item) =>
                item.key.toLowerCase().includes(query) ||
                item.value.toLowerCase().includes(query),
        );
    }

    async function copyItem(key: string, value: string) {
        try {
            await navigator.clipboard.writeText(`${key}=${value}`);
            copiedItem = `${key}:${value}`;
            setTimeout(() => (copiedItem = null), 2000);
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

    const filteredQueryParams = $derived(filterItems(queryParams));
    const filteredRequestCookies = $derived(filterItems(requestCookies));
    const filteredResponseCookies = $derived(filterItems(responseCookies));
</script>

<div class="space-y-4">
    <div class="relative">
        <input
            type="text"
            bind:value={searchQuery}
            placeholder="Search parameters and cookies..."
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

    {#if queryParams.length > 0}
        <div class="border border-gray-200 rounded-lg overflow-hidden">
            <button
                onclick={() => toggleSection("queryParams")}
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
                            d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                        />
                    </svg>
                    <span class="font-semibold text-gray-900"
                        >Query Parameters</span
                    >
                    <span
                        class="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full"
                        >{filteredQueryParams.length}</span
                    >
                </div>
                <svg
                    class="w-5 h-5 text-gray-500 transition-transform {expandedSections.queryParams
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

            {#if expandedSections.queryParams}
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th
                                    class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-1/3"
                                    >Parameter</th
                                >
                                <th
                                    class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                                    >Value</th
                                >
                                <th class="px-4 py-3 w-16"></th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100">
                            {#each filteredQueryParams as param}
                                <tr
                                    class="hover:bg-gray-50 transition-colors group"
                                >
                                    <td
                                        class="px-4 py-3 font-mono text-sm font-semibold text-blue-600 break-all"
                                        >{param.key}</td
                                    >
                                    <td
                                        class="px-4 py-3 font-mono text-sm text-gray-900 break-all"
                                        >{param.value || "(empty)"}</td
                                    >
                                    <td class="px-4 py-3">
                                        <button
                                            onclick={() =>
                                                copyItem(
                                                    param.key,
                                                    param.value,
                                                )}
                                            class="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded"
                                            title="Copy parameter"
                                        >
                                            {#if copiedItem === `${param.key}:${param.value}`}
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
                                    </td>
                                </tr>
                            {/each}
                            {#if filteredQueryParams.length === 0}
                                <tr>
                                    <td
                                        colspan="3"
                                        class="px-4 py-8 text-center text-gray-500"
                                    >
                                        {searchQuery
                                            ? "No parameters match your search"
                                            : "No query parameters"}
                                    </td>
                                </tr>
                            {/if}
                        </tbody>
                    </table>
                </div>
            {/if}
        </div>
    {/if}

    {#if requestCookies.length > 0}
        <div class="border border-gray-200 rounded-lg overflow-hidden">
            <button
                onclick={() => toggleSection("cookies")}
                class="w-full px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition-colors flex items-center justify-between"
            >
                <div class="flex items-center gap-2">
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
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    <span class="font-semibold text-gray-900"
                        >Request Cookies</span
                    >
                    <span
                        class="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full"
                        >{filteredRequestCookies.length}</span
                    >
                </div>
                <svg
                    class="w-5 h-5 text-gray-500 transition-transform {expandedSections.cookies
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

            {#if expandedSections.cookies}
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th
                                    class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-1/3"
                                    >Name</th
                                >
                                <th
                                    class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                                    >Value</th
                                >
                                <th class="px-4 py-3 w-16"></th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100">
                            {#each filteredRequestCookies as cookie}
                                <tr
                                    class="hover:bg-gray-50 transition-colors group"
                                >
                                    <td
                                        class="px-4 py-3 font-mono text-sm font-semibold text-purple-600 break-all"
                                        >{cookie.key}</td
                                    >
                                    <td
                                        class="px-4 py-3 font-mono text-sm text-gray-900 break-all"
                                        >{cookie.value || "(empty)"}</td
                                    >
                                    <td class="px-4 py-3">
                                        <button
                                            onclick={() =>
                                                copyItem(
                                                    cookie.key,
                                                    cookie.value,
                                                )}
                                            class="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded"
                                            title="Copy cookie"
                                        >
                                            {#if copiedItem === `${cookie.key}:${cookie.value}`}
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
                                    </td>
                                </tr>
                            {/each}
                            {#if filteredRequestCookies.length === 0}
                                <tr>
                                    <td
                                        colspan="3"
                                        class="px-4 py-8 text-center text-gray-500"
                                    >
                                        {searchQuery
                                            ? "No cookies match your search"
                                            : "No request cookies"}
                                    </td>
                                </tr>
                            {/if}
                        </tbody>
                    </table>
                </div>
            {/if}
        </div>
    {/if}

    {#if responseCookies.length > 0}
        <div class="border border-gray-200 rounded-lg overflow-hidden">
            <button
                onclick={() => toggleSection("setCookies")}
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
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    <span class="font-semibold text-gray-900"
                        >Response Set-Cookie</span
                    >
                    <span
                        class="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full"
                        >{filteredResponseCookies.length}</span
                    >
                </div>
                <svg
                    class="w-5 h-5 text-gray-500 transition-transform {expandedSections.setCookies
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

            {#if expandedSections.setCookies}
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th
                                    class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-1/4"
                                    >Name</th
                                >
                                <th
                                    class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-1/3"
                                    >Value</th
                                >
                                <th
                                    class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                                    >Attributes</th
                                >
                                <th class="px-4 py-3 w-16"></th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100">
                            {#each filteredResponseCookies as cookie}
                                <tr
                                    class="hover:bg-gray-50 transition-colors group"
                                >
                                    <td
                                        class="px-4 py-3 font-mono text-sm font-semibold text-green-600 break-all"
                                        >{cookie.key}</td
                                    >
                                    <td
                                        class="px-4 py-3 font-mono text-sm text-gray-900 break-all"
                                        >{cookie.value || "(empty)"}</td
                                    >
                                    <td
                                        class="px-4 py-3 font-mono text-xs text-gray-600"
                                    >
                                        {cookie.attributes || "None"}
                                    </td>
                                    <td class="px-4 py-3">
                                        <button
                                            onclick={() =>
                                                copyItem(
                                                    cookie.key,
                                                    cookie.value,
                                                )}
                                            class="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded"
                                            title="Copy cookie"
                                        >
                                            {#if copiedItem === `${cookie.key}:${cookie.value}`}
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
                                    </td>
                                </tr>
                            {/each}
                            {#if filteredResponseCookies.length === 0}
                                <tr>
                                    <td
                                        colspan="4"
                                        class="px-4 py-8 text-center text-gray-500"
                                    >
                                        {searchQuery
                                            ? "No Set-Cookie headers match your search"
                                            : "No Set-Cookie headers"}
                                    </td>
                                </tr>
                            {/if}
                        </tbody>
                    </table>
                </div>
            {/if}
        </div>
    {/if}

    {#if queryParams.length === 0 && requestCookies.length === 0 && responseCookies.length === 0}
        <div
            class="border border-gray-200 rounded-lg p-8 text-center bg-gradient-to-br from-gray-50 to-gray-100"
        >
            <div class="inline-flex p-3 bg-gray-200 rounded-full mb-4">
                <svg
                    class="w-8 h-8 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">
                No Parameters or Cookies
            </h3>
            <p class="text-gray-600">
                This request has no query parameters or cookies to display.
            </p>
        </div>
    {/if}
</div>
