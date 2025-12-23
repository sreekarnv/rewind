<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import type { HTMLAttributes } from 'svelte/elements';

	interface Props extends HTMLAttributes<HTMLSpanElement> {
		variant?: 'default' | 'success' | 'error' | 'warning' | 'info' | 'purple' | 'method';
		size?: 'xs' | 'sm' | 'md' | 'lg';
		pulse?: boolean;
		class?: string;
	}

	let {
		variant = 'default',
		size = 'sm',
		pulse = false,
		class: className,
		children,
		...rest
	}: Props = $props();

	const variants = {
		default: 'bg-gray-100 text-gray-800 border-gray-200',
		success: 'bg-green-100 text-green-800 border-green-200',
		error: 'bg-red-100 text-red-800 border-red-200',
		warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
		info: 'bg-blue-100 text-blue-800 border-blue-200',
		purple: 'bg-purple-100 text-purple-700 border-purple-200',
		method: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-sm border-transparent'
	};

	const sizes = {
		xs: 'px-2 py-0.5 text-xs',
		sm: 'px-3 py-1 text-sm',
		md: 'px-4 py-1.5 text-base',
		lg: 'px-5 py-2 text-lg'
	};
</script>

<span
	{...rest}
	class={cn(
		'inline-flex items-center gap-2 rounded-full font-medium border',
		sizes[size],
		variants[variant],
		className
	)}
>
	{#if pulse}
		<span class="relative flex h-3 w-3">
			<span class="absolute inline-flex h-full w-full rounded-full bg-current opacity-75 animate-ping"></span>
			<span class="relative inline-flex h-3 w-3 rounded-full bg-current"></span>
		</span>
	{/if}
	{@render children?.()}
</span>
