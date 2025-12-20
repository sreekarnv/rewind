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

    function getSeverityColor(severity: AlertSeverity): string {
        switch (severity) {
            case "critical":
                return "bg-red-100 text-red-800 border-red-200";
            case "error":
                return "bg-orange-100 text-orange-800 border-orange-200";
            case "warning":
                return "bg-yellow-100 text-yellow-800 border-yellow-200";
            case "info":
                return "bg-blue-100 text-blue-800 border-blue-200";
            default:
                return "bg-gray-100 text-gray-800 border-gray-200";
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
                <button
                    onclick={() => markAllAsReadMutation.mutate()}
                    class="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-all shadow-md font-medium"
                >
                    Mark All as Read
                </button>
            {/if}
        </div>

        <div class="flex gap-2">
            <button
                onclick={() => setFilter(undefined)}
                class="px-4 py-2 rounded-lg font-medium transition-all {statusFilter ===
                undefined
                    ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}"
            >
                All ({total})
            </button>
            <button
                onclick={() => setFilter("unread")}
                class="px-4 py-2 rounded-lg font-medium transition-all {statusFilter ===
                'unread'
                    ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}"
            >
                Unread ({unreadCount})
            </button>
            <button
                onclick={() => setFilter("read")}
                class="px-4 py-2 rounded-lg font-medium transition-all {statusFilter ===
                'read'
                    ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}"
            >
                Read
            </button>
            <button
                onclick={() => setFilter("dismissed")}
                class="px-4 py-2 rounded-lg font-medium transition-all {statusFilter ===
                'dismissed'
                    ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}"
            >
                Dismissed
            </button>
        </div>
    </div>

    {#if notificationsQuery.isLoading}
        <div class="flex items-center justify-center py-12">
            <div
                class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"
            ></div>
        </div>
    {:else if notificationsQuery.isError}
        <div class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p class="text-red-700">
                Failed to load notifications. Please try again.
            </p>
        </div>
    {:else if notifications.length === 0}
        <div
            class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-12 border border-gray-100 text-center"
        >
            <svg
                class="mx-auto h-16 w-16 text-gray-400 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
            </svg>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">
                No {statusFilter ? statusFilter : ""} notifications
            </h3>
            <p class="text-gray-600">You're all caught up!</p>
        </div>
    {:else}
        <div class="space-y-3">
            {#each notifications as notification (notification._id)}
                <div
                    class="bg-white/80 backdrop-blur-sm rounded-xl shadow border {notification.status ===
                    'unread'
                        ? 'border-purple-200 bg-purple-50/30'
                        : 'border-gray-200'} overflow-hidden hover:shadow-lg transition-all"
                >
                    <div class="p-5">
                        <div class="flex items-start gap-4">
                            <div class="flex-shrink-0 mt-1">
                                {#if notification.severity === "critical"}
                                    <div
                                        class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center"
                                    >
                                        <svg
                                            class="w-6 h-6 text-red-600"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path
                                                fill-rule="evenodd"
                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                                clip-rule="evenodd"
                                            />
                                        </svg>
                                    </div>
                                {:else if notification.severity === "error"}
                                    <div
                                        class="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center"
                                    >
                                        <svg
                                            class="w-6 h-6 text-orange-600"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path
                                                fill-rule="evenodd"
                                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                                clip-rule="evenodd"
                                            />
                                        </svg>
                                    </div>
                                {:else if notification.severity === "warning"}
                                    <div
                                        class="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center"
                                    >
                                        <svg
                                            class="w-6 h-6 text-yellow-600"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path
                                                fill-rule="evenodd"
                                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                                clip-rule="evenodd"
                                            />
                                        </svg>
                                    </div>
                                {:else}
                                    <div
                                        class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center"
                                    >
                                        <svg
                                            class="w-6 h-6 text-blue-600"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path
                                                fill-rule="evenodd"
                                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                                clip-rule="evenodd"
                                            />
                                        </svg>
                                    </div>
                                {/if}
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
                                            <span
                                                class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {getSeverityColor(
                                                    notification.severity,
                                                )} border"
                                            >
                                                {notification.severity.toUpperCase()}
                                            </span>
                                            {#if notification.status === "unread"}
                                                <span
                                                    class="w-2 h-2 bg-purple-500 rounded-full"
                                                ></span>
                                            {/if}
                                            <!-- Email Status Badge -->
                                            {#if notification.emailSent}
                                                <span
                                                    class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-300"
                                                    title="Email sent at {notification.emailSentAt
                                                        ? new Date(
                                                              notification.emailSentAt,
                                                          ).toLocaleString()
                                                        : 'unknown time'}"
                                                >
                                                    <svg
                                                        class="w-3 h-3"
                                                        fill="currentColor"
                                                        viewBox="0 0 20 20"
                                                    >
                                                        <path
                                                            d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"
                                                        />
                                                        <path
                                                            d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"
                                                        />
                                                    </svg>
                                                    Sent
                                                </span>
                                            {:else if notification.emailAttempts && notification.emailAttempts > 0}
                                                <span
                                                    class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-300"
                                                    title={notification.emailError ||
                                                        "Email delivery failed"}
                                                >
                                                    <svg
                                                        class="w-3 h-3"
                                                        fill="currentColor"
                                                        viewBox="0 0 20 20"
                                                    >
                                                        <path
                                                            d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"
                                                        />
                                                        <path
                                                            d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"
                                                        />
                                                    </svg>
                                                    Failed
                                                </span>
                                            {/if}
                                        </div>
                                        <p class="text-gray-700 mb-2">
                                            {notification.message}
                                        </p>
                                        <div
                                            class="flex items-center gap-3 text-sm text-gray-600"
                                        >
                                            <span
                                                class="font-mono font-semibold"
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

                            <!-- Actions -->
                            <div class="flex flex-col gap-2">
                                <button
                                    onclick={() =>
                                        handleViewSession(
                                            notification.sessionId,
                                            notification._id,
                                            notification.status,
                                        )}
                                    class="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium whitespace-nowrap"
                                >
                                    View Session
                                </button>
                                {#if notification.status === "unread"}
                                    <button
                                        onclick={() =>
                                            markAsReadMutation.mutate(
                                                notification._id,
                                            )}
                                        class="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium whitespace-nowrap"
                                    >
                                        Mark Read
                                    </button>
                                {/if}
                                {#if notification.status !== "dismissed"}
                                    <button
                                        onclick={() =>
                                            markAsDismissedMutation.mutate(
                                                notification._id,
                                            )}
                                        class="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium whitespace-nowrap"
                                    >
                                        Dismiss
                                    </button>
                                {/if}
                            </div>
                        </div>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>
