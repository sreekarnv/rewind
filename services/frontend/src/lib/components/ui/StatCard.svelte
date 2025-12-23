<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import type { Component } from 'svelte';

	interface Props {
		title: string;
		value: string | number;
		icon: Component;
		iconColor?: string;
		badge?: string;
		badgeColor?: string;
		class?: string;
	}

	let {
		title,
		value,
		icon: Icon,
		iconColor = 'bg-blue-500',
		badge,
		badgeColor = 'bg-blue-50 text-blue-600',
		class: className
	}: Props = $props();
</script>

<div
	class={cn(
		'group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-blue-100',
		className
	)}
>
	<div class="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/5"></div>
	<div class="relative p-6">
		<div class="flex items-center justify-between mb-4">
			<div class={cn('p-3 rounded-xl shadow-lg', iconColor)}>
				<Icon class="w-6 h-6 text-white" />
			</div>
			{#if badge}
				<span class={cn('text-sm font-medium px-3 py-1 rounded-full', badgeColor)}>
					{badge}
				</span>
			{/if}
		</div>
		<h3 class="text-sm font-medium text-gray-600 mb-1">{title}</h3>
		<p class="text-3xl font-bold text-gray-900">{value}</p>
	</div>
</div>
