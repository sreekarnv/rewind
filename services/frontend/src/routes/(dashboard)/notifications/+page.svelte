<svelte:options runes={true} />

<script lang="ts">
    import {
        createQuery,
        createMutation,
        useQueryClient,
    } from "@tanstack/svelte-query";
    import { notificationQueries } from "$lib/queries";
    import { client } from "$lib/client";
    import type { AlertSeverity, NotificationStatus } from "$lib/types";
    import {
        Button,
        Badge,
        Card,
        LoadingState,
        ErrorState,
        EmptyState,
    } from "$lib/components/ui";
    import {
        CircleAlert,
        TriangleAlert,
        Info,
        Mail,
        CircleCheck,
        Eye,
        X as CloseX,
        Bell,
    } from "lucide-svelte";

    const queryClient = useQueryClient();

    let statusFilter = $state<NotificationStatus | undefined>(undefined);
    let limit = $state(50);

    const notificationsQuery = createQuery(() =>
        notificationQueries.all({ limit, status: statusFilter }),
    );

    const notifications = $derived(
        notificationsQuery.data?.notifications ?? [],
    );
    const total = $derived(notificationsQuery.data?.total ?? 0);
    const unreadCount = $derived(notificationsQuery.data?.unreadCount ?? 0);

    const markAsReadMutation = createMutation(() => ({
        mutationFn: async (id: string) => {
            const response = await client.api.v1
                .notifications({ id })
                .read.patch();
            if (response.error) throw new Error("Failed to mark as read");
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
    }));

    const markAsDismissedMutation = createMutation(() => ({
        mutationFn: async (id: string) => {
            const response = await client.api.v1
                .notifications({ id })
                .dismiss.patch();
            if (response.error) throw new Error("Failed to dismiss");
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
    }));

    const markAllAsReadMutation = createMutation(() => ({
        mutationFn: async () => {
            const response =
                await client.api.v1.notifications["read-all"].patch();
            if (response.error) throw new Error("Failed to mark all as read");
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
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

    function getSeverityIcon(severity: AlertSeverity) {
        switch (severity) {
            case "critical":
            case "error":
                return CircleAlert;
            case "warning":
                return TriangleAlert;
            case "info":
            default:
                return Info;
        }
    }

    function formatTimestamp(timestamp: string): string {
        const date = new Date(timestamp);
        return date.toLocaleString();
    }

    function handleViewSession(
        sessionId: string,
        notificationId: string,
        status: NotificationStatus,
    ) {
        if (status === "unread") {
            markAsReadMutation.mutate(notificationId);
        }
        window.location.href = `/sessions/${sessionId}`;
    }

    function setFilter(status: NotificationStatus | undefined) {
        statusFilter = status;
    }
</script>

<div class="max-w-7xl mx-auto p-4 md:p-8">
    <div class="mb-8">
        <div class="flex items-center justify-between mb-4">
            <div>
                <h1
                    class="text-4xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent mb-2"
                >
                    Notifications
                </h1>
                <p class="text-gray-600">
                    {#if total > 0}
                        {total} total notification{total !== 1 ? "s" : ""}
                        {#if unreadCount > 0}
                            <span class="text-purple-600 font-medium">
                                ({unreadCount} unread)
                            </span>
                        {/if}
                    {:else}
                        No notifications
                    {/if}
                </p>
            </div>
            {#if unreadCount > 0}
                <Button onclick={() => markAllAsReadMutation.mutate()}>
                    <CheckCircle2 class="w-5 h-5" />
                    Mark All as Read
                </Button>
            {/if}
        </div>

        <div class="flex gap-2">
            <Button
                variant={statusFilter === undefined ? "primary" : "secondary"}
                onclick={() => setFilter(undefined)}
            >
                All ({total})
            </Button>
            <Button
                variant={statusFilter === "unread" ? "primary" : "secondary"}
                onclick={() => setFilter("unread")}
            >
                Unread ({unreadCount})
            </Button>
            <Button
                variant={statusFilter === "read" ? "primary" : "secondary"}
                onclick={() => setFilter("read")}
            >
                Read
            </Button>
            <Button
                variant={statusFilter === "dismissed" ? "primary" : "secondary"}
                onclick={() => setFilter("dismissed")}
            >
                Dismissed
            </Button>
        </div>
    </div>

    {#if notificationsQuery.isLoading}
        <LoadingState
            title="Loading Notifications"
            description="Fetching your alerts and updates..."
        />
    {:else if notificationsQuery.isError}
        <ErrorState
            title="Error Loading Notifications"
            message="Failed to load notifications. Please try again."
        />
    {:else if notifications.length === 0}
        <EmptyState
            title="No {statusFilter ? statusFilter : ''} notifications"
            description="You're all caught up!"
            icon={Bell}
        />
    {:else}
        <div class="space-y-3">
            {#each notifications as notification (notification._id)}
                {@const SeverityIcon = getSeverityIcon(notification.severity)}
                <Card
                    hoverable
                    class="p-5 {notification.status === 'unread'
                        ? 'border-purple-200 bg-purple-50/30'
                        : ''}"
                >
                    <div class="flex items-start gap-4">
                        <div class="flex-shrink-0 mt-1">
                            <div
                                class="w-10 h-10 rounded-full flex items-center justify-center {notification.severity ===
                                    'critical' ||
                                notification.severity === 'error'
                                    ? 'bg-red-100'
                                    : notification.severity === 'warning'
                                      ? 'bg-yellow-100'
                                      : 'bg-blue-100'}"
                            >
                                <SeverityIcon
                                    class="w-6 h-6 {notification.severity ===
                                        'critical' ||
                                    notification.severity === 'error'
                                        ? 'text-red-600'
                                        : notification.severity === 'warning'
                                          ? 'text-yellow-600'
                                          : 'text-blue-600'}"
                                />
                            </div>
                        </div>

                        <div class="flex-1 min-w-0">
                            <div
                                class="flex items-start justify-between gap-3 mb-2"
                            >
                                <div class="flex-1">
                                    <div
                                        class="flex items-center gap-2 mb-1 flex-wrap"
                                    >
                                        <h3
                                            class="text-lg font-semibold text-gray-900"
                                        >
                                            {notification.ruleName}
                                        </h3>
                                        <Badge
                                            variant={getSeverityVariant(
                                                notification.severity,
                                            )}
                                            size="xs"
                                        >
                                            {notification.severity.toUpperCase()}
                                        </Badge>
                                        {#if notification.status === "unread"}
                                            <span
                                                class="w-2 h-2 bg-purple-500 rounded-full"
                                            ></span>
                                        {/if}
                                        {#if notification.emailSent}
                                            <Badge
                                                variant="success"
                                                size="xs"
                                                class="inline-flex items-center gap-1"
                                            >
                                                <Mail class="w-3 h-3" />
                                                Sent
                                            </Badge>
                                        {:else if notification.emailAttempts && notification.emailAttempts > 0}
                                            <Badge
                                                variant="error"
                                                size="xs"
                                                class="inline-flex items-center gap-1"
                                            >
                                                <Mail class="w-3 h-3" />
                                                Failed
                                            </Badge>
                                        {/if}
                                    </div>
                                    <p class="text-gray-700 mb-2">
                                        {notification.message}
                                    </p>
                                    <div
                                        class="flex items-center gap-3 text-sm text-gray-600"
                                    >
                                        <span class="font-mono font-semibold"
                                            >{notification.sessionData
                                                .method}</span
                                        >
                                        <span>•</span>
                                        <span class="truncate max-w-md"
                                            >{notification.sessionData
                                                .uri}</span
                                        >
                                        {#if notification.sessionData.statusCode}
                                            <span>•</span>
                                            <span
                                                >Status: {notification
                                                    .sessionData
                                                    .statusCode}</span
                                            >
                                        {/if}
                                    </div>
                                    <p class="text-xs text-gray-500 mt-1">
                                        {formatTimestamp(
                                            notification.createdAt,
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div class="flex flex-col gap-2">
                            <Button
                                variant="primary"
                                size="sm"
                                onclick={() =>
                                    handleViewSession(
                                        notification.sessionId,
                                        notification._id,
                                        notification.status,
                                    )}
                            >
                                <Eye class="w-4 h-4" />
                                View
                            </Button>
                            {#if notification.status === "unread"}
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onclick={() =>
                                        markAsReadMutation.mutate(
                                            notification._id,
                                        )}
                                >
                                    <CircleCheck class="w-4 h-4" />
                                    Read
                                </Button>
                            {/if}
                            {#if notification.status !== "dismissed"}
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onclick={() =>
                                        markAsDismissedMutation.mutate(
                                            notification._id,
                                        )}
                                >
                                    <CloseX class="w-4 h-4" />
                                    Dismiss
                                </Button>
                            {/if}
                        </div>
                    </div>
                </Card>
            {/each}
        </div>
    {/if}
</div>
