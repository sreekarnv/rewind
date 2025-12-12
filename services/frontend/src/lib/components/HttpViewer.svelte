<script lang="ts">
	import { onMount } from 'svelte';
	import hljs from 'highlight.js/lib/core';
	import json from 'highlight.js/lib/languages/json';
	import http from 'highlight.js/lib/languages/http';
	import 'highlight.js/styles/github-dark.css';
	import { tryFormatJson, isJson } from '$lib/utils';
	import type { HttpTransaction } from '$lib/types';

	export let transaction: HttpTransaction;

	let activeTab: 'request' | 'response' = 'request';

	// Register languages
	onMount(() => {
		hljs.registerLanguage('json', json);
		hljs.registerLanguage('http', http);
	});

	function highlightCode(code: string, language: string): string {
		try {
			return hljs.highlight(code, { language }).value;
		} catch {
			return code;
		}
	}

	function formatHeaders(headers: Record<string, string>): string {
		return Object.entries(headers)
			.map(([key, value]) => `${key}: ${value}`)
			.join('\n');
	}

	function formatRequestHeaders(): string {
		if (!transaction.request) return '';
		const { method, uri, version, headers } = transaction.request;
		const requestLine = `${method || 'GET'} ${uri || '/'} ${version || 'HTTP/1.1'}`;
		const headerLines = headers ? formatHeaders(headers) : '';
		return `${requestLine}\n${headerLines}`;
	}

	function formatResponseHeaders(): string {
		if (!transaction.response) return '';
		const { version, statusCode, statusMessage, headers } = transaction.response;
		const statusLine = `${version || 'HTTP/1.1'} ${statusCode || '???'} ${statusMessage || ''}`;
		const headerLines = headers ? formatHeaders(headers) : '';
		return `${statusLine}\n${headerLines}`;
	}

	$: requestHeaders = formatRequestHeaders();
	$: responseHeaders = formatResponseHeaders();
	$: requestBody = transaction.request?.body || '';
	$: responseBody = transaction.response?.body || '';

	$: formattedRequestBody = isJson(requestBody) ? tryFormatJson(requestBody) : requestBody;
	$: formattedResponseBody = isJson(responseBody) ? tryFormatJson(responseBody) : responseBody;

	$: requestBodyLanguage = isJson(requestBody) ? 'json' : 'http';
	$: responseBodyLanguage = isJson(responseBody) ? 'json' : 'http';
</script>

<div class="card">
	<!-- Tabs -->
	<div class="border-b border-gray-200 mb-4">
		<nav class="-mb-px flex space-x-8" aria-label="Tabs">
			<button
				on:click={() => (activeTab = 'request')}
				class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors {activeTab ===
				'request'
					? 'border-primary-500 text-primary-600'
					: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
			>
				Request
			</button>
			<button
				on:click={() => (activeTab = 'response')}
				disabled={!transaction.response}
				class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors {activeTab ===
				'response'
					? 'border-primary-500 text-primary-600'
					: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} {!transaction.response
					? 'opacity-50 cursor-not-allowed'
					: ''}"
			>
				Response {!transaction.response ? '(N/A)' : ''}
			</button>
		</nav>
	</div>

	<!-- Request Tab -->
	{#if activeTab === 'request'}
		<div class="space-y-4">
			<!-- Request Headers -->
			<div>
				<h4 class="text-sm font-medium text-gray-700 mb-2">Headers</h4>
				<pre
					class="hljs"><code>{@html highlightCode(requestHeaders, 'http')}</code></pre>
			</div>

			<!-- Request Body -->
			{#if requestBody}
				<div>
					<h4 class="text-sm font-medium text-gray-700 mb-2">Body</h4>
					<pre
						class="hljs"><code>{@html highlightCode(
							formattedRequestBody,
							requestBodyLanguage
						)}</code></pre>
				</div>
			{:else}
				<div class="text-center py-8 bg-gray-50 rounded-md">
					<p class="text-sm text-gray-500">No request body</p>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Response Tab -->
	{#if activeTab === 'response'}
		{#if transaction.response}
			<div class="space-y-4">
				<!-- Response Headers -->
				<div>
					<h4 class="text-sm font-medium text-gray-700 mb-2">Headers</h4>
					<pre
						class="hljs"><code>{@html highlightCode(responseHeaders, 'http')}</code></pre>
				</div>

				<!-- Response Body -->
				{#if responseBody}
					<div>
						<h4 class="text-sm font-medium text-gray-700 mb-2">Body</h4>
						<pre
							class="hljs"><code>{@html highlightCode(
								formattedResponseBody,
								responseBodyLanguage
							)}</code></pre>
					</div>
				{:else}
					<div class="text-center py-8 bg-gray-50 rounded-md">
						<p class="text-sm text-gray-500">No response body</p>
					</div>
				{/if}
			</div>
		{:else}
			<div class="text-center py-12 bg-yellow-50 rounded-md">
				<p class="text-sm font-medium text-yellow-800">No response available</p>
				<p class="text-xs text-yellow-600 mt-1">This transaction was incomplete or still pending</p>
			</div>
		{/if}
	{/if}
</div>
