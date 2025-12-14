<svelte:options runes={true} />

<script lang="ts">
    import { onMount } from "svelte";
    import Prism from "prismjs";
    import "prismjs/components/prism-json";
    import "prismjs/components/prism-markup";
    import "prismjs/components/prism-css";
    import "prismjs/components/prism-javascript";
    import "prismjs/themes/prism-okaidia.css";

    interface Props {
        content?: string;
        contentType?: string;
        title?: string;
    }

    let { content, contentType, title = "Body" }: Props = $props();

    let showFormatted = $state(true);
    let copied = $state(false);
    let formattedContent = $state("");
    let detectedLanguage = $state("plaintext");

    function detectLanguage(contentType: string | undefined): string {
        if (!contentType) return "plaintext";

        const ct = contentType.toLowerCase();
        if (ct.includes("json")) return "json";
        if (ct.includes("html")) return "markup";
        if (ct.includes("xml")) return "markup";
        if (ct.includes("javascript") || ct.includes("js")) return "javascript";
        if (ct.includes("css")) return "css";
        return "plaintext";
    }

    function formatContent(
        content: string | undefined,
        language: string,
    ): string {
        if (!content) return "";

        try {
            if (language === "json") {
                const parsed = JSON.parse(content);
                return JSON.stringify(parsed, null, 2);
            }
            return content;
        } catch {
            return content;
        }
    }

    $effect(() => {
        detectedLanguage = detectLanguage(contentType);
        formattedContent = formatContent(content, detectedLanguage);
    });

    onMount(() => {
        Prism.highlightAll();
    });

    $effect(() => {
        if (showFormatted) {
            setTimeout(() => Prism.highlightAll(), 0);
        }
    });

    async function copyToClipboard() {
        if (!content) return;

        try {
            await navigator.clipboard.writeText(
                showFormatted ? formattedContent : content,
            );
            copied = true;
            setTimeout(() => (copied = false), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    }

    const hasContent = $derived(content && content.trim().length > 0);
    const displayContent = $derived(showFormatted ? formattedContent : content);
</script>

<div
    class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
>
    <div
        class="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100"
    >
        <h3 class="text-lg font-semibold text-gray-900">{title}</h3>
        <div class="flex items-center gap-2">
            {#if hasContent && detectedLanguage === "json"}
                <button
                    onclick={() => (showFormatted = !showFormatted)}
                    class="px-3 py-1.5 text-sm font-medium {showFormatted
                        ? 'bg-purple-100 text-purple-700 border-purple-200'
                        : 'bg-gray-100 text-gray-700 border-gray-200'} border rounded-lg hover:bg-purple-200 transition-colors flex items-center gap-1.5"
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
                            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                    </svg>
                    {showFormatted ? "Formatted" : "Raw"}
                </button>
            {/if}
            {#if hasContent}
                <button
                    onclick={copyToClipboard}
                    class="px-3 py-1.5 text-sm font-medium bg-gray-100 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1.5"
                >
                    {#if copied}
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
                        Copied!
                    {:else}
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
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                        </svg>
                        Copy
                    {/if}
                </button>
            {/if}
        </div>
    </div>

    <div class="relative">
        {#if !hasContent}
            <div class="p-8 text-center">
                <div
                    class="mx-auto w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-3"
                >
                    <svg
                        class="w-6 h-6 text-gray-400"
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
                <p class="text-sm text-gray-500">No content</p>
            </div>
        {:else if showFormatted}
            <div class="max-h-96 overflow-auto bg-gray-900">
                <pre class="!m-0 !p-6 text-sm"><code
                        class="language-{detectedLanguage}"
                        >{displayContent}</code
                    ></pre>
            </div>
        {:else}
            <div class="max-h-96 overflow-auto bg-gray-50">
                <pre
                    class="!m-0 !p-6 text-sm text-gray-800 font-mono whitespace-pre-wrap break-all">{content}</pre>
            </div>
        {/if}
    </div>
</div>

<style>
    :global(pre[class*="language-"]) {
        margin: 0 !important;
        padding: 1.5rem !important;
        border-radius: 0 !important;
        background: #272822 !important;
    }

    :global(code[class*="language-"]) {
        font-family: "Fira Code", "Consolas", "Monaco", monospace;
        font-size: 0.875rem;
        line-height: 1.6;
        text-shadow: none !important;
    }

    :global(.token.property),
    :global(.token.tag),
    :global(.token.constant),
    :global(.token.symbol),
    :global(.token.deleted) {
        color: #f92672 !important;
    }

    :global(.token.boolean),
    :global(.token.number) {
        color: #ae81ff !important;
    }

    :global(.token.selector),
    :global(.token.attr-name),
    :global(.token.string),
    :global(.token.char),
    :global(.token.builtin),
    :global(.token.inserted) {
        color: #a6e22e !important;
    }

    :global(.token.punctuation) {
        color: #f8f8f2 !important;
    }

    :global(.token.operator),
    :global(.token.entity),
    :global(.token.url),
    :global(.language-css .token.string),
    :global(.style .token.string) {
        color: #66d9ef !important;
    }

    div.max-h-96.bg-gray-900 {
        scrollbar-width: thin;
        scrollbar-color: #4b5563 #1f2937;
    }

    div.max-h-96.bg-gray-900::-webkit-scrollbar {
        width: 8px;
        height: 8px;
    }

    div.max-h-96.bg-gray-900::-webkit-scrollbar-track {
        background: #1f2937;
    }

    div.max-h-96.bg-gray-900::-webkit-scrollbar-thumb {
        background: #4b5563;
        border-radius: 4px;
    }

    div.max-h-96.bg-gray-900::-webkit-scrollbar-thumb:hover {
        background: #6b7280;
    }

    div.max-h-96.bg-gray-50 {
        scrollbar-width: thin;
        scrollbar-color: #d1d5db #f3f4f6;
    }

    div.max-h-96.bg-gray-50::-webkit-scrollbar {
        width: 8px;
        height: 8px;
    }

    div.max-h-96.bg-gray-50::-webkit-scrollbar-track {
        background: #f3f4f6;
    }

    div.max-h-96.bg-gray-50::-webkit-scrollbar-thumb {
        background: #d1d5db;
        border-radius: 4px;
    }

    div.max-h-96.bg-gray-50::-webkit-scrollbar-thumb:hover {
        background: #9ca3af;
    }
</style>
