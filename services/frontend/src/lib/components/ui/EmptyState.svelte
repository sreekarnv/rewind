<script lang="ts">
	import Card from './Card.svelte';
	import Button from './Button.svelte';
	import type { Component } from 'svelte';

	interface Props {
		title: string;
		description?: string;
		icon: Component;
		actionLabel?: string;
		onAction?: () => void;
	}

	let {
		title,
		description,
		icon: Icon,
		actionLabel,
		onAction
	}: Props = $props();
</script>

<Card class="p-12">
	<div class="text-center">
		<div class="mx-auto w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mb-4">
			<Icon class="w-8 h-8 text-purple-600" />
		</div>
		<h3 class="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
		{#if description}
			<p class="text-gray-600 mb-6">{description}</p>
		{/if}
		{#if actionLabel && onAction}
			<Button onclick={onAction}>
				{actionLabel}
			</Button>
		{/if}
	</div>
</Card>
