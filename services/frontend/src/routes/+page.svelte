<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { formatTimestamp, formatDuration } from '$lib/utils';
	import { getRealtimeClient } from '$lib/realtime';
	import CaptureControls from '$lib/components/CaptureControls.svelte';
	import type { PageData } from './$types';
	import type { SessionSummary } from '$lib/types';

	export let data: PageData;

	let sessions: SessionSummary[] = data.sessions || [];
	let error = data.error;
	let isConnected = false;
	let lastUpdate: number | null = null;

	const realtimeClient = getRealtimeClient();

	onMount(() => {
		(async () => {
			try {
				await realtimeClient.connect();
				isConnected = true;
			} catch (err) {
				console.error('Failed to connect to real-time server:', err);
			}

			const unsubscribe = realtimeClient.subscribe((update) => {
				if (update.type === 'init' || update.type === 'update') {
					sessions = update.data.sessions;
					lastUpdate = update.data.timestamp;
				}
			});

			return () => {
				unsubscribe();
			};
		})();
	});

	onDestroy(() => {
		realtimeClient.disconnect();
	});

	$: totalSessions = sessions.length;
</script>

<svelte:head>
	<title>Sessions - Rewind</title>
</svelte:head>

<div class="space-y-6">
	<CaptureControls />

	<div class="flex justify-between items-center">
		<div>
			<div class="flex items-center gap-3">
				<h1 class="text-3xl font-bold text-gray-900">HTTP Sessions</h1>
				{#if isConnected}
					<span
						class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
					>
						<span class="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse"
						></span>
						Live
					</span>
				{:else}
					<span
						class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
					>
						<span class="w-2 h-2 bg-gray-500 rounded-full mr-1.5"></span>
						Offline
					</span>
				{/if}
			</div>
			<p class="mt-1 text-sm text-gray-500">
				Captured HTTP traffic sessions from the packet capture agent
			</p>
			{#if lastUpdate}
				<p class="mt-1 text-xs text-gray-400">
					Last update: {new Date(lastUpdate).toLocaleTimeString()}
				</p>
			{/if}
		</div>
		<div class="text-right">
			<p class="text-sm text-gray-500">Total Sessions</p>
			<p class="text-3xl font-bold text-primary-600">{totalSessions}</p>
		</div>
	</div>

	{#if error}
		<div class="bg-red-50 border border-red-200 rounded-lg p-4">
			<div class="flex">
				<div class="flex-shrink-0">
					<svg
						class="h-5 w-5 text-red-400"
						viewBox="0 0 20 20"
						fill="currentColor"
						aria-hidden="true"
					>
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
							clip-rule="evenodd"
						/>
					</svg>
				</div>
				<div class="ml-3">
					<h3 class="text-sm font-medium text-red-800">
						Error loading sessions
					</h3>
					<p class="mt-2 text-sm text-red-700">{error}</p>
				</div>
			</div>
		</div>
	{/if}

	{#if !error && sessions.length === 0}
		<div class="text-center py-12">
			<svg
				class="mx-auto h-12 w-12 text-gray-400"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				aria-hidden="true"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
				/>
			</svg>
			<h3 class="mt-2 text-sm font-semibold text-gray-900">
				No sessions found
			</h3>
			<p class="mt-1 text-sm text-gray-500">
				Start the capture agent to begin capturing HTTP traffic.
			</p>
		</div>
	{/if}

	{#if !error && sessions.length > 0}
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
			{#each sessions as session}
				<a
					href="/sessions/{encodeURIComponent(session.sessionId)}"
					class="card group"
				>
					<div class="space-y-3">
						<div class="flex items-start justify-between">
							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-2 mb-1">
									<span class="badge badge-primary">{session.method}</span>
									{#if session.statusCode}
										<span
											class="badge {session.statusCode < 300 ? 'badge-success' : session.statusCode < 400 ? 'badge-warning' : 'badge-error'}"
										>
											{session.statusCode}
										</span>
									{:else}
										<span class="badge badge-warning">
											No Response
										</span>
									{/if}
								</div>
								<p class="text-sm font-mono text-gray-600 truncate">
									{session.uri}
								</p>
							</div>
						</div>

						<div class="grid grid-cols-2 gap-4 text-sm">
							<div>
								<p class="text-gray-500">Source</p>
								<p class="font-medium text-gray-900 font-mono text-xs">
									{session.sourceIp}:{session.sourcePort}
								</p>
							</div>
							<div>
								<p class="text-gray-500">Destination</p>
								<p class="font-medium text-gray-900 font-mono text-xs">
									{session.destIp}:{session.destPort}
								</p>
							</div>
						</div>

						<div class="text-sm border-t pt-3">
							<p class="text-gray-500">Timestamp</p>
							<p class="font-medium text-gray-900 text-xs">
								{new Date(session.timestamp).toLocaleString()}
							</p>
						</div>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>
