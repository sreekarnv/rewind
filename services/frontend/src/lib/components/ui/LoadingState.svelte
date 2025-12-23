<script lang="ts">
	import Card from './Card.svelte';
	import LoadingSpinner from './LoadingSpinner.svelte';
	import type { Component } from 'svelte';

	interface Props {
		title?: string;
		description?: string;
		icon?: Component;
	}

	let {
		title = 'Loading',
		description = 'Please wait...',
		icon: Icon
	}: Props = $props();
</script>

<Card class="p-12">
	<div class="text-center">
		<div class="mx-auto w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mb-4">
			{#if Icon}
				<Icon class="w-8 h-8 text-purple-600" />
			{:else}
				<LoadingSpinner size="md" />
			{/if}
		</div>
		<h3 class="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
		<p class="text-gray-600">{description}</p>
	</div>
</Card>
