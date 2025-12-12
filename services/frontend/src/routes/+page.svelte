<script lang="ts">
	import { formatTimestamp, formatDuration } from '$lib/utils';
	import type { PageData } from './$types';

	export let data: PageData;

	$: sessions = data.sessions || [];
	$: error = data.error;
</script>

<svelte:head>
	<title>Sessions - Rewind</title>
</svelte:head>

<div class="space-y-6">
	<!-- Page Header -->
	<div class="flex justify-between items-center">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">HTTP Sessions</h1>
			<p class="mt-1 text-sm text-gray-500">
				Captured HTTP traffic sessions from the packet capture agent
			</p>
		</div>
		<div class="text-right">
			<p class="text-sm text-gray-500">Total Sessions</p>
			<p class="text-3xl font-bold text-primary-600">{data.total}</p>
		</div>
	</div>

	<!-- Error Message -->
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
					<h3 class="text-sm font-medium text-red-800">Error loading sessions</h3>
					<p class="mt-2 text-sm text-red-700">{error}</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- Empty State -->
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
			<h3 class="mt-2 text-sm font-semibold text-gray-900">No sessions found</h3>
			<p class="mt-1 text-sm text-gray-500">
				Start the capture agent to begin capturing HTTP traffic.
			</p>
		</div>
	{/if}

	<!-- Sessions Grid -->
	{#if !error && sessions.length > 0}
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
			{#each sessions as session}
				<a href="/sessions/{encodeURIComponent(session.sessionId)}" class="card group">
					<div class="space-y-3">
						<!-- Session ID -->
						<div class="flex items-start justify-between">
							<h3 class="text-lg font-semibold text-gray-900 group-hover:text-primary-600">
								{session.sessionId}
							</h3>
							<span class="badge badge-info">{session.transactionCount} requests</span>
						</div>

						<!-- Connection Info -->
						<div class="grid grid-cols-2 gap-4 text-sm">
							<div>
								<p class="text-gray-500">Client</p>
								<p class="font-medium text-gray-900">
									{session.clientIp}:{session.clientPort}
								</p>
							</div>
							<div>
								<p class="text-gray-500">Server</p>
								<p class="font-medium text-gray-900">
									{session.serverIp}:{session.serverPort}
								</p>
							</div>
						</div>

						<!-- Timing Info -->
						<div class="grid grid-cols-2 gap-4 text-sm border-t pt-3">
							<div>
								<p class="text-gray-500">Started</p>
								<p class="font-medium text-gray-900">{formatTimestamp(session.startTime)}</p>
							</div>
							<div>
								<p class="text-gray-500">Duration</p>
								<p class="font-medium text-gray-900">{formatDuration(session.duration)}</p>
							</div>
						</div>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>
