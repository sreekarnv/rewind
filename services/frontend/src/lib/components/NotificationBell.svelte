<svelte:options runes={true} />

<script lang="ts">
    import { createQuery, createMutation, useQueryClient } from "@tanstack/svelte-query";
    import { notificationQueries } from "$lib/queries";
    import { client } from "$lib/client";
    import type { Notification, AlertSeverity } from "$lib/types";

    let isOpen = $state(false);
    const queryClient = useQueryClient();

    // Fetch unread count
    const unreadCountQuery = createQuery(() => notificationQueries.unreadCount());

    // Fetch recent notifications
    const notificationsQuery = createQuery(() =>
        notificationQueries.all({ limit: 10, status: "unread" })
    );

    const unreadCount = $derived(
        unreadCountQuery.data?.count ?? 0
    );

    const notifications = $derived(
        notificationsQuery.data?.notifications ?? []
    );

    // Mark as read mutation
    const markAsReadMutation = createMutation(() => ({
        mutationFn: async (id: string) => {
            const response = await client.api.v1.notifications({ id }).read.patch();
            if (response.error) throw new Error("Failed to mark notification as read");
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
    }));

    // Mark all as read mutation
    const markAllAsReadMutation = createMutation(() => ({
        mutationFn: async () => {
            const response = await client.api.v1.notifications["read-all"].patch();
            if (response.error) throw new Error("Failed to mark all as read");
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
    }));

    function togglePanel() {
        isOpen = !isOpen;
    }

    function closePanel() {
        isOpen = false;
    }

    function handleNotificationClick(notification: Notification) {
        if (notification.status === "unread") {
            markAsReadMutation.mutate(notification._id);
        }
        // Navigate to session detail
        window.location.href = `/sessions/${notification.sessionId}`;
    }

    function handleMarkAllAsRead() {
        markAllAsReadMutation.mutate();
    }

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
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}d ago`;
    }

    // Close panel when clicking outside
    function handleClickOutside(event: MouseEvent) {
        const target = event.target as HTMLElement;
        if (!target.closest(".notification-panel")) {
            closePanel();
        }
    }

    $effect(() => {
        if (isOpen) {
            document.addEventListener("click", handleClickOutside);
            return () => {
                document.removeEventListener("click", handleClickOutside);
            };
        }
    });
</script>

<div class="relative notification-panel">
    <button
        onclick={togglePanel}
        class="relative p-2 text-gray-700 hover:bg-white/60 rounded-lg transition-colors"
        aria-label="Notifications"
    >
        <svg
            class="w-6 h-6"
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
        {#if unreadCount > 0}
            <span
                class="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
            >
                {unreadCount > 99 ? "99+" : unreadCount}
            </span>
        {/if}
    </button>

    {#if isOpen}
        <div
            class="absolute right-0 mt-2 w-96 bg-white/95 backdrop-blur-lg rounded-xl shadow-2xl border border-gray-200/50 z-50 max-h-[32rem] overflow-hidden flex flex-col"
        >
            <!-- Header -->
            <div class="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 class="text-lg font-semibold text-gray-900">Notifications</h3>
                {#if unreadCount > 0}
                    <button
                        onclick={handleMarkAllAsRead}
                        class="text-sm text-purple-600 hover:text-purple-700 font-medium"
                    >
                        Mark all read
                    </button>
                {/if}
            </div>

            <!-- Notifications List -->
            <div class="flex-1 overflow-y-auto">
                {#if notificationsQuery.isLoading}
                    <div class="p-8 text-center">
                        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                        <p class="mt-2 text-sm text-gray-600">Loading notifications...</p>
                    </div>
                {:else if notifications.length === 0}
                    <div class="p-8 text-center">
                        <svg
                            class="mx-auto h-12 w-12 text-gray-400"
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
                        <p class="mt-2 text-sm font-medium text-gray-900">No notifications</p>
                        <p class="text-sm text-gray-500">You're all caught up!</p>
                    </div>
                {:else}
                    {#each notifications as notification (notification._id)}
                        <button
                            onclick={() => handleNotificationClick(notification)}
                            class="w-full p-4 border-b border-gray-100 hover:bg-gray-50/80 transition-colors text-left"
                        >
                            <div class="flex items-start gap-3">
                                <div class="flex-shrink-0 mt-1">
                                    {#if notification.severity === "critical"}
                                        <svg class="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                                        </svg>
                                    {:else if notification.severity === "error"}
                                        <svg class="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                                        </svg>
                                    {:else if notification.severity === "warning"}
                                        <svg class="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                                        </svg>
                                    {:else}
                                        <svg class="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                                        </svg>
                                    {/if}
                                </div>
                                <div class="flex-1 min-w-0">
                                    <div class="flex items-start justify-between gap-2 mb-1">
                                        <p class="text-sm font-semibold text-gray-900 truncate">
                                            {notification.ruleName}
                                        </p>
                                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {getSeverityColor(notification.severity)} border whitespace-nowrap">
                                            {notification.severity.toUpperCase()}
                                        </span>
                                    </div>
                                    <p class="text-sm text-gray-700 mb-2 line-clamp-2">
                                        {notification.message}
                                    </p>
                                    <div class="flex items-center gap-2 text-xs text-gray-500">
                                        <span class="font-medium">{notification.sessionData.method}</span>
                                        <span>•</span>
                                        <span class="truncate">{notification.sessionData.uri}</span>
                                        <span>•</span>
                                        <span>{formatTimestamp(notification.createdAt)}</span>
                                    </div>
                                </div>
                            </div>
                        </button>
                    {/each}
                {/if}
            </div>

            <!-- Footer -->
            {#if notifications.length > 0}
                <div class="p-3 border-t border-gray-200">
                    <a
                        href="/notifications"
                        class="block text-center text-sm font-medium text-purple-600 hover:text-purple-700"
                    >
                        View all notifications
                    </a>
                </div>
            {/if}
        </div>
    {/if}
</div>

<style>
    .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
</style>
