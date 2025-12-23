<svelte:options runes={true} />

<script lang="ts">
    import {
        createQuery,
        createMutation,
        useQueryClient,
    } from "@tanstack/svelte-query";
    import { alertQueries } from "$lib/queries";
    import { client } from "$lib/client";
    import type { AlertSeverity } from "$lib/types";
    import CreateAlertModal from "$lib/components/CreateAlertModal.svelte";
    import {
        Button,
        Badge,
        Card,
        LoadingState,
        ErrorState,
        EmptyState,
    } from "$lib/components/ui";
    import { Plus, Bell, CircleCheckBig, CircleX, Trash2 } from "lucide-svelte";

    const queryClient = useQueryClient();

    let isCreateModalOpen = $state(false);

    const alertsQuery = createQuery(() => alertQueries.all());

    const alerts = $derived(alertsQuery.data?.rules ?? []);

    const toggleRuleMutation = createMutation(() => ({
        mutationFn: async (id: string) => {
            const response = await client.api.v1.alerts({ id }).toggle.patch();
            if (response.error) throw new Error("Failed to toggle alert rule");
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["alerts"] });
        },
    }));

    const deleteRuleMutation = createMutation(() => ({
        mutationFn: async (id: string) => {
            const response = await client.api.v1.alerts({ id }).delete();
            if (response.error) throw new Error("Failed to delete alert rule");
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["alerts"] });
        },
    }));

    function getSeverityVariant(
        severity: AlertSeverity,
    ): "error" | "warning" | "info" | "default" {
        switch (severity) {
            case "critical":
            case "error":
                return "error";
            case "warning":
                return "warning";
            case "info":
                return "info";
            default:
                return "default";
        }
    }

    function formatCondition(cond: any): string {
        const opMap: Record<string, string> = {
            equals: "=",
            not_equals: "≠",
            greater_than: ">",
            less_than: "<",
            contains: "contains",
            regex: "matches",
        };

        return `${cond.type} ${opMap[cond.operator] || cond.operator} ${cond.value}`;
    }

    function handleToggle(id: string) {
        toggleRuleMutation.mutate(id);
    }

    function handleDelete(id: string) {
        if (confirm("Are you sure you want to delete this alert rule?")) {
            deleteRuleMutation.mutate(id);
        }
    }
</script>

<div class="max-w-7xl mx-auto p-4 md:p-8">
    <div class="mb-8">
        <div class="flex items-center justify-between">
            <div>
                <h1
                    class="text-4xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent mb-2"
                >
                    Alert Rules
                </h1>
                <p class="text-gray-600">
                    Configure rules to get notified when specific conditions are
                    met
                </p>
            </div>
            <Button onclick={() => (isCreateModalOpen = true)}>
                <Plus class="w-5 h-5" />
                Create Alert Rule
            </Button>
        </div>
    </div>

    {#if alertsQuery.isLoading}
        <LoadingState
            title="Loading Alert Rules"
            description="Fetching your alert configurations..."
        />
    {:else if alertsQuery.isError}
        <ErrorState
            title="Error Loading Alert Rules"
            message="Failed to fetch alert rules. Please try again."
        />
    {:else if alerts.length === 0}
        <EmptyState
            title="No Alert Rules Yet"
            description="Get started by creating your first alert rule to monitor HTTP traffic"
            icon={Bell}
            actionLabel="Create Your First Alert Rule"
            onAction={() => (isCreateModalOpen = true)}
        />
    {:else}
        <div class="grid gap-4">
            {#each alerts as alert (alert._id)}
                <Card hoverable class="p-6">
                    <div class="flex items-start justify-between mb-4">
                        <div class="flex-1">
                            <div class="flex items-center gap-3 mb-2">
                                <h3 class="text-xl font-semibold text-gray-900">
                                    {alert.name}
                                </h3>
                                <Badge
                                    variant={getSeverityVariant(alert.severity)}
                                    size="sm"
                                >
                                    {alert.severity.toUpperCase()}
                                </Badge>
                                {#if !alert.enabled}
                                    <Badge variant="default" size="sm">
                                        DISABLED
                                    </Badge>
                                {/if}
                            </div>
                            {#if alert.description}
                                <p class="text-gray-600 mb-3">
                                    {alert.description}
                                </p>
                            {/if}

                            <div class="mb-3">
                                <div
                                    class="text-sm font-medium text-gray-700 mb-2"
                                >
                                    Conditions:
                                </div>
                                <div class="flex flex-wrap gap-2">
                                    {#each alert.conditions as condition}
                                        <span
                                            class="inline-flex items-center px-3 py-1 rounded-lg text-sm bg-purple-50 text-purple-700 border border-purple-200 font-mono"
                                        >
                                            {formatCondition(condition)}
                                        </span>
                                    {/each}
                                </div>
                            </div>

                            <div
                                class="flex items-center gap-4 text-sm text-gray-500"
                            >
                                <span
                                    >Cooldown: {alert.cooldownMinutes} min</span
                                >
                                {#if alert.lastTriggered}
                                    <span>
                                        Last triggered: {new Date(
                                            alert.lastTriggered,
                                        ).toLocaleString()}
                                    </span>
                                {/if}
                            </div>
                        </div>

                        <div class="flex items-center gap-2 ml-4">
                            <Button
                                variant={alert.enabled
                                    ? "success"
                                    : "secondary"}
                                size="sm"
                                onclick={() =>
                                    handleToggle(alert._id.toString())}
                            >
                                {#if alert.enabled}
                                    <CircleCheckBig class="w-5 h-5" />
                                {:else}
                                    <CircleX class="w-5 h-5" />
                                {/if}
                            </Button>
                            <Button
                                variant="danger"
                                size="sm"
                                onclick={() =>
                                    handleDelete(alert._id.toString())}
                            >
                                <Trash2 class="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </Card>
            {/each}
        </div>
    {/if}

    <CreateAlertModal
        isOpen={isCreateModalOpen}
        onClose={() => (isCreateModalOpen = false)}
    />
</div>
