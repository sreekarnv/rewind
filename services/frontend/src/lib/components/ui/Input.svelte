<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import type { Component } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';

	interface Props extends HTMLInputAttributes {
		icon?: Component;
		iconPosition?: 'left' | 'right';
		error?: string;
		class?: string;
	}

	let {
		icon: Icon,
		iconPosition = 'left',
		error,
		class: className,
		...rest
	}: Props = $props();
</script>

<div class="relative">
	{#if Icon && iconPosition === 'left'}
		<div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
			<Icon class="w-5 h-5 text-gray-400" />
		</div>
	{/if}

	<input
		{...rest}
		class={cn(
			'w-full px-4 py-2 border rounded-lg transition-all duration-200',
			'focus:ring-2 focus:ring-purple-500 focus:border-transparent',
			'disabled:opacity-50 disabled:cursor-not-allowed',
			error && 'border-red-300 focus:ring-red-500',
			Icon && iconPosition === 'left' && 'pl-12',
			Icon && iconPosition === 'right' && 'pr-12',
			className
		)}
	/>

	{#if Icon && iconPosition === 'right'}
		<div class="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
			<Icon class="w-5 h-5 text-gray-400" />
		</div>
	{/if}

	{#if error}
		<p class="mt-1 text-sm text-red-600">{error}</p>
	{/if}
</div>
