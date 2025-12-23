<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import { ChevronDown } from 'lucide-svelte';
	import type { HTMLSelectAttributes } from 'svelte/elements';

	interface Option {
		value: string;
		label: string;
	}

	interface Props extends HTMLSelectAttributes {
		options: Option[];
		placeholder?: string;
		error?: string;
		class?: string;
	}

	let {
		options,
		placeholder,
		error,
		class: className,
		...rest
	}: Props = $props();
</script>

<div class="relative">
	<select
		{...rest}
		class={cn(
			'appearance-none w-full px-4 py-2 pr-10 border rounded-lg transition-all duration-200',
			'focus:ring-2 focus:ring-purple-500 focus:border-transparent',
			'disabled:opacity-50 disabled:cursor-not-allowed',
			error && 'border-red-300 focus:ring-red-500',
			className
		)}
	>
		{#if placeholder}
			<option value="" disabled selected>{placeholder}</option>
		{/if}
		{#each options as option}
			<option value={option.value}>{option.label}</option>
		{/each}
	</select>

	<div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
		<ChevronDown class="w-5 h-5 text-gray-400" />
	</div>

	{#if error}
		<p class="mt-1 text-sm text-red-600">{error}</p>
	{/if}
</div>
