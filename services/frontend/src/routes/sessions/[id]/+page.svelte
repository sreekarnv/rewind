<script lang="ts">
	import {
		formatTimestamp,
		formatDuration,
		getStatusBadgeClass,
		getMethodBadgeClass,
		formatBytes
	} from '$lib/utils';
	import HttpViewer from '$lib/components/HttpViewer.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	$: session = data.session;
	$: transactions = session.transactions || [];

	let selectedTransaction = 0;
	$: currentTransaction = transactions[selectedTransaction];
</script>

<svelte:head>
	<title>{session.sessionId} - Session Details - Rewind</title>
</svelte:head>

<div class="space-y-6">
	<!-- Back Button -->
	<div>
		<a href="/" class="inline-flex items-center text-sm text-primary-600 hover:text-primary-700">
			<svg
				class="w-4 h-4 mr-1"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M15 19l-7-7 7-7"
				/>
			</svg>
			Back to Sessions
		</a>
	</div>

	<!-- Session Header -->
	<div class="card">
		<h1 class="text-2xl font-bold text-gray-900 mb-4">{session.sessionId}</h1>

		<div class="grid grid-cols-2 md:grid-cols-4 gap-6">
			<div>
				<p class="text-sm text-gray-500">Client</p>
				<p class="font-medium text-gray-900">{session.clientIp}:{session.clientPort}</p>
			</div>
			<div>
				<p class="text-sm text-gray-500">Server</p>
				<p class="font-medium text-gray-900">{session.serverIp}:{session.serverPort}</p>
			</div>
			<div>
				<p class="text-sm text-gray-500">Duration</p>
				<p class="font-medium text-gray-900">{formatDuration(session.duration)}</p>
			</div>
			<div>
				<p class="text-sm text-gray-500">Transactions</p>
				<p class="font-medium text-gray-900">{session.transactionCount}</p>
			</div>
		</div>

		<div class="mt-4 pt-4 border-t">
			<p class="text-sm text-gray-500">
				Started: <span class="font-medium text-gray-900">{formatTimestamp(session.startTime)}</span
				>
			</p>
			<p class="text-sm text-gray-500">
				Ended: <span class="font-medium text-gray-900">{formatTimestamp(session.endTime)}</span>
			</p>
		</div>
	</div>

	<!-- Transactions List and Detail -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Transaction List -->
		<div class="lg:col-span-1">
			<div class="card">
				<h2 class="text-lg font-semibold text-gray-900 mb-4">Transactions</h2>
				<div class="space-y-2 max-h-[600px] overflow-y-auto">
					{#each transactions as transaction, index}
						<button
							on:click={() => (selectedTransaction = index)}
							class="w-full text-left p-3 rounded-md transition-colors {selectedTransaction === index
								? 'bg-primary-50 border border-primary-200'
								: 'bg-gray-50 hover:bg-gray-100 border border-transparent'}"
						>
							<div class="flex items-center justify-between mb-1">
								<div class="flex items-center space-x-2">
									<span class="badge {getMethodBadgeClass(transaction.request?.method || 'GET')}">
										{transaction.request?.method || 'GET'}
									</span>
									{#if transaction.response}
										<span
											class="badge {getStatusBadgeClass(transaction.response.statusCode || 0)}"
										>
											{transaction.response.statusCode || '???'}
										</span>
									{:else}
										<span class="badge badge-warning">Pending</span>
									{/if}
								</div>
								<span class="text-xs text-gray-500">{formatDuration(transaction.duration || 0)}</span
								>
							</div>
							<p class="text-sm font-medium text-gray-900 truncate">
								{transaction.request?.uri || '/'}
							</p>
							{#if transaction.requestTime}
								<p class="text-xs text-gray-500 mt-1">
									{formatTimestamp(transaction.requestTime)}
								</p>
							{/if}
						</button>
					{/each}
				</div>
			</div>
		</div>

		<!-- Transaction Detail -->
		<div class="lg:col-span-2">
			{#if currentTransaction}
				<div class="space-y-4">
					<!-- Transaction Summary -->
					<div class="card">
						<h3 class="text-lg font-semibold text-gray-900 mb-3">Transaction Details</h3>
						<div class="grid grid-cols-2 gap-4 text-sm">
							{#if currentTransaction.requestTime}
								<div>
									<p class="text-gray-500">Request Time</p>
									<p class="font-medium text-gray-900">
										{formatTimestamp(currentTransaction.requestTime)}
									</p>
								</div>
							{/if}
							{#if currentTransaction.responseTime}
								<div>
									<p class="text-gray-500">Response Time</p>
									<p class="font-medium text-gray-900">
										{formatTimestamp(currentTransaction.responseTime)}
									</p>
								</div>
							{/if}
							{#if currentTransaction.duration !== undefined}
								<div>
									<p class="text-gray-500">Duration</p>
									<p class="font-medium text-gray-900">
										{formatDuration(currentTransaction.duration)}
									</p>
								</div>
							{/if}
							{#if currentTransaction.response?.length}
								<div>
									<p class="text-gray-500">Response Size</p>
									<p class="font-medium text-gray-900">
										{formatBytes(currentTransaction.response.length)}
									</p>
								</div>
							{/if}
						</div>
						{#if !currentTransaction.response}
							<div class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
								<p class="text-sm text-yellow-800">
									⚠️ This transaction has no response (incomplete capture)
								</p>
							</div>
						{/if}
					</div>

					<!-- HTTP Request/Response Viewer -->
					<HttpViewer transaction={currentTransaction} />
				</div>
			{:else}
				<div class="card">
					<p class="text-center text-gray-500">No transaction selected</p>
				</div>
			{/if}
		</div>
	</div>
</div>
