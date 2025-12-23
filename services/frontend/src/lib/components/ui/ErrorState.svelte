<script lang="ts">
	import Card from './Card.svelte';
	import Button from './Button.svelte';
	import { AlertTriangle } from 'lucide-svelte';

	interface Props {
		title: string;
		message?: string;
		onRetry?: () => void;
	}

	let {
		title,
		message,
		onRetry
	}: Props = $props();
</script>

<Card variant="error" class="p-6">
	<div class="flex items-start gap-4">
		<div class="flex-shrink-0">
			<div class="p-2 bg-red-100 rounded-lg">
				<AlertTriangle class="w-6 h-6 text-red-600" />
			</div>
		</div>
		<div class="flex-1">
			<h3 class="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
			{#if message}
				<p class="text-gray-600 mb-4">{message}</p>
			{/if}
			{#if onRetry}
				<Button variant="secondary" onclick={onRetry}>
					Try Again
				</Button>
			{/if}
		</div>
	</div>
</Card>
