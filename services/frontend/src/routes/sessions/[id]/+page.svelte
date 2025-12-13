<script lang="ts">
	import { getStatusBadgeClass, getMethodBadgeClass } from '$lib/utils';
	import type { PageData } from './$types';

	export let data: PageData;

	$: session = data.session;
</script>

<svelte:head>
	<title>{session.request.method} {session.request.uri} - Session Details - Rewind</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<a
			href="/"
			class="inline-flex items-center text-sm text-primary-600 hover:text-primary-700"
		>
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

	<div class="card">
		<div class="flex items-center gap-3 mb-4">
			<span class="badge badge-primary text-base px-3 py-1">{session.request.method}</span>
			{#if session.response}
				<span class="{getStatusBadgeClass(session.response.statusCode)} text-base px-3 py-1">
					{session.response.statusCode} {session.response.statusMessage}
				</span>
			{:else}
				<span class="badge badge-warning text-base px-3 py-1">
					No Response
				</span>
			{/if}
		</div>

		<h1 class="text-xl font-mono text-gray-900 mb-6 break-all">
			{session.request.uri}
		</h1>

		<div class="grid grid-cols-2 md:grid-cols-3 gap-6">
			<div>
				<p class="text-sm text-gray-500">Source</p>
				<p class="font-medium text-gray-900 font-mono text-sm">
					{session.sourceIp}:{session.sourcePort}
				</p>
			</div>
			<div>
				<p class="text-sm text-gray-500">Destination</p>
				<p class="font-medium text-gray-900 font-mono text-sm">
					{session.destIp}:{session.destPort}
				</p>
			</div>
			<div>
				<p class="text-sm text-gray-500">Timestamp</p>
				<p class="font-medium text-gray-900 text-sm">
					{new Date(session.timestamp).toLocaleString()}
				</p>
			</div>
		</div>
	</div>

	<div class="space-y-4">
		<div class="card">
			<h2 class="text-lg font-semibold text-gray-900 mb-4">Request Headers</h2>
			<div class="font-mono text-sm space-y-1">
				{#each session.request.headers as header}
					<div class="flex gap-2">
						<span class="text-gray-600 font-semibold">{header.name}:</span>
						<span class="text-gray-900">{header.value}</span>
					</div>
				{/each}
			</div>
			{#if session.request.body}
				<div class="mt-4 pt-4 border-t">
					<h3 class="font-semibold text-gray-900 mb-2">Request Body</h3>
					<pre class="bg-gray-50 p-3 rounded font-mono text-xs overflow-x-auto">{session.request.body}</pre>
				</div>
			{/if}
		</div>

		{#if session.response}
			<div class="card">
				<h2 class="text-lg font-semibold text-gray-900 mb-4">Response Headers</h2>
				<div class="font-mono text-sm space-y-1">
					{#each session.response.headers as header}
						<div class="flex gap-2">
							<span class="text-gray-600 font-semibold">{header.name}:</span>
							<span class="text-gray-900">{header.value}</span>
						</div>
					{/each}
				</div>
				{#if session.response.body}
					<div class="mt-4 pt-4 border-t">
						<h3 class="font-semibold text-gray-900 mb-2">Response Body</h3>
						<pre class="bg-gray-50 p-3 rounded font-mono text-xs overflow-x-auto max-h-96">{session.response.body}</pre>
					</div>
				{/if}
			</div>
		{:else}
			<div class="card bg-yellow-50 border-yellow-200">
				<p class="text-yellow-800">⚠️ No response captured for this request</p>
			</div>
		{/if}
	</div>
</div>
