<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import type { HTMLAttributes } from 'svelte/elements';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		variant?: 'default' | 'info' | 'warning' | 'error' | 'success';
		hoverable?: boolean;
		class?: string;
	}

	let {
		variant = 'default',
		hoverable = false,
		class: className,
		children,
		...rest
	}: Props = $props();

	const variants = {
		default: 'bg-white/80 backdrop-blur-sm border-gray-100',
		info: 'bg-gradient-to-r from-blue-50 to-blue-100/50 border-blue-100',
		warning: 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200/50',
		error: 'bg-white/80 backdrop-blur-sm border-red-200',
		success: 'bg-gradient-to-r from-green-50 to-emerald-50/50 border-green-100'
	};
</script>

<div
	{...rest}
	class={cn(
		'rounded-2xl shadow-lg p-6 border transition-all duration-300',
		variants[variant],
		hoverable && 'hover:shadow-xl hover:scale-[1.02]',
		className
	)}
>
	{@render children?.()}
</div>
