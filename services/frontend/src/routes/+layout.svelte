<svelte:options runes={true} />

<script lang="ts">
    import "../app.css";
    import { QueryClient, QueryClientProvider } from "@tanstack/svelte-query";
    import { SvelteQueryDevtools } from "@tanstack/svelte-query-devtools";
    import type { Snippet } from "svelte";

    interface Props {
        children?: Snippet;
    }

    let { children }: Props = $props();

    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 1000 * 60,
                retry: 1,
            },
        },
    });
</script>

<QueryClientProvider client={queryClient}>
    {@render children?.()}
    <SvelteQueryDevtools />
</QueryClientProvider>
