<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import type { HTMLButtonAttributes, HTMLAnchorAttributes } from 'svelte/elements';

	interface BaseProps {
		variant?: 'primary' | 'success' | 'danger' | 'secondary' | 'ghost' | 'icon';
		size?: 'sm' | 'md' | 'lg';
		loading?: boolean;
		class?: string;
	}

	type Props = BaseProps & (
		| (HTMLButtonAttributes & { href?: never })
		| (HTMLAnchorAttributes & { href: string; disabled?: never })
	);

	let {
		variant = 'primary',
		size = 'md',
		loading = false,
		class: className,
		disabled,
		href,
		children,
		...rest
	}: Props = $props();

	const variants = {
		primary:
			'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-md',
		success:
			'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-md',
		danger:
			'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-md',
		secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 shadow-sm',
		ghost: 'bg-transparent hover:bg-gray-100 text-gray-700',
		icon: 'p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg'
	};

	const sizes = {
		sm: 'px-3 py-1.5 text-sm',
		md: 'px-4 py-2',
		lg: 'px-6 py-3 text-lg'
	};

	const baseClasses = cn(
		'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200',
		variant !== 'icon' && 'rounded-xl',
		variant !== 'icon' && sizes[size],
		variants[variant],
		className
	);
</script>

{#if href}
	<a
		{...rest}
		{href}
		class={cn(baseClasses, 'no-underline')}
	>
		{#if loading}
			<svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
				<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
			</svg>
		{/if}
		{@render children?.()}
	</a>
{:else}
	<button
		{...rest}
		disabled={disabled || loading}
		class={cn(baseClasses, 'disabled:opacity-50 disabled:cursor-not-allowed')}
	>
		{#if loading}
			<svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
				<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
			</svg>
		{/if}
		{@render children?.()}
	</button>
{/if}
