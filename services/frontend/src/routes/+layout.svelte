<svelte:options runes={true} />

<script lang="ts">
    import "../app.css";
    import { QueryClient, QueryClientProvider } from "@tanstack/svelte-query";
    import { SvelteQueryDevtools } from "@tanstack/svelte-query-devtools";

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
    <slot />
    <SvelteQueryDevtools />
</QueryClientProvider>
