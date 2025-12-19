<svelte:options runes={true} />

<script lang="ts">
	import {
		createQuery,
		createMutation,
		useQueryClient,
	} from '@tanstack/svelte-query';
	import { alertQueries } from '$lib/queries';
	import { client } from '$lib/client';
	import type { AlertSeverity } from '$lib/types';
	import CreateAlertModal from '$lib/components/CreateAlertModal.svelte';

	const queryClient = useQueryClient();

	let isCreateModalOpen = $state(false);

	const alertsQuery = createQuery(() => alertQueries.all());

	const alerts = $derived(alertsQuery.data?.rules ?? []);

	const toggleRuleMutation = createMutation(() => ({
		mutationFn: async (id: string) => {
			const response = await client.api.v1.alerts({ id }).toggle.patch();
			if (response.error) throw new Error('Failed to toggle alert rule');
			return response.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['alerts'] });
		},
	}));

	const deleteRuleMutation = createMutation(() => ({
		mutationFn: async (id: string) => {
			const response = await client.api.v1.alerts({ id }).delete();
			if (response.error) throw new Error('Failed to delete alert rule');
			return response.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['alerts'] });
		},
	}));

	function getSeverityColor(severity: AlertSeverity): string {
		switch (severity) {
			case 'critical':
				return 'bg-red-100 text-red-800 border-red-300';
			case 'error':
				return 'bg-orange-100 text-orange-800 border-orange-300';
			case 'warning':
				return 'bg-yellow-100 text-yellow-800 border-yellow-300';
			case 'info':
				return 'bg-blue-100 text-blue-800 border-blue-300';
			default:
				return 'bg-gray-100 text-gray-800 border-gray-300';
		}
	}

	function formatCondition(cond: any): string {
		const opMap: Record<string, string> = {
			equals: '=',
			not_equals: '≠',
			greater_than: '>',
			less_than: '<',
			contains: 'contains',
			regex: 'matches',
		};

		return `${cond.type} ${opMap[cond.operator] || cond.operator} ${cond.value}`;
	}

	function handleToggle(id: string) {
		toggleRuleMutation.mutate(id);
	}

	function handleDelete(id: string) {
		if (confirm('Are you sure you want to delete this alert rule?')) {
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
					Configure rules to get notified when specific conditions are met
				</p>
			</div>
			<button
				onclick={() => (isCreateModalOpen = true)}
				class="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-all shadow-md font-medium flex items-center gap-2"
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
						d="M12 4v16m8-8H4"
					/>
				</svg>
				Create Alert Rule
			</button>
		</div>
	</div>

	{#if alertsQuery.isLoading}
		<div class="flex items-center justify-center py-12">
			<div
				class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"
			></div>
		</div>
	{:else if alertsQuery.isError}
		<div class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
			<svg
				class="mx-auto h-12 w-12 text-red-400 mb-4"
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
			<h3 class="text-lg font-semibold text-red-900 mb-2">
				Error Loading Alert Rules
			</h3>
			<p class="text-red-700">Failed to fetch alert rules. Please try again.</p>
		</div>
	{:else if alerts.length === 0}
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
				No Alert Rules Yet
			</h3>
			<p class="text-gray-600 mb-6">
				Get started by creating your first alert rule to monitor HTTP traffic
			</p>
			<button
				onclick={() => (isCreateModalOpen = true)}
				class="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-all shadow-md font-medium inline-flex items-center gap-2"
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
						d="M12 4v16m8-8H4"
					/>
				</svg>
				Create Your First Alert Rule
			</button>
		</div>
	{:else}
		<div class="grid gap-4">
			{#each alerts as alert (alert._id)}
				<div
					class="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow"
				>
					<div class="p-6">
						<div class="flex items-start justify-between mb-4">
							<div class="flex-1">
								<div class="flex items-center gap-3 mb-2">
									<h3 class="text-xl font-semibold text-gray-900">
										{alert.name}
									</h3>
									<span
										class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border {getSeverityColor(
											alert.severity
										)}"
									>
										{alert.severity.toUpperCase()}
									</span>
									{#if !alert.enabled}
										<span
											class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-300"
										>
											DISABLED
										</span>
									{/if}
								</div>
								{#if alert.description}
									<p class="text-gray-600 mb-3">
										{alert.description}
									</p>
								{/if}

								<div class="mb-3">
									<div class="text-sm font-medium text-gray-700 mb-2">
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

								<div class="flex items-center gap-4 text-sm text-gray-500">
									<span>Cooldown: {alert.cooldownMinutes} min</span>
									{#if alert.lastTriggered}
										<span>
											Last triggered: {new Date(
												alert.lastTriggered
											).toLocaleString()}
										</span>
									{/if}
								</div>
							</div>

							<div class="flex items-center gap-2 ml-4">
								<button
									onclick={() => handleToggle(alert._id.toString())}
									class="p-2 rounded-lg {alert.enabled
										? 'bg-green-100 text-green-700 hover:bg-green-200'
										: 'bg-gray-100 text-gray-600 hover:bg-gray-200'} transition-colors"
									title={alert.enabled ? 'Disable' : 'Enable'}
								>
									{#if alert.enabled}
										<svg
											class="w-5 h-5"
											fill="currentColor"
											viewBox="0 0 20 20"
										>
											<path
												fill-rule="evenodd"
												d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
												clip-rule="evenodd"
											/>
										</svg>
									{:else}
										<svg
											class="w-5 h-5"
											fill="currentColor"
											viewBox="0 0 20 20"
										>
											<path
												fill-rule="evenodd"
												d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z"
												clip-rule="evenodd"
											/>
										</svg>
									{/if}
								</button>
								<button
									onclick={() => handleDelete(alert._id.toString())}
									class="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
									title="Delete"
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
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<CreateAlertModal
		isOpen={isCreateModalOpen}
		onClose={() => (isCreateModalOpen = false)}
	/>
</div>
