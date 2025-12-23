<script lang="ts">
	import { Dialog } from 'bits-ui';
	import { cn } from '$lib/utils/cn';
	import { X } from 'lucide-svelte';
	import { fly, fade } from 'svelte/transition';

	interface Props {
		open: boolean;
		onClose: () => void;
		title?: string;
		description?: string;
		size?: 'sm' | 'md' | 'lg' | 'xl';
		showCloseButton?: boolean;
		class?: string;
		children: any;
	}

	let {
		open = $bindable(),
		onClose,
		title,
		description,
		size = 'md',
		showCloseButton = true,
		class: className
	}: Props = $props();

	const sizes = {
		sm: 'max-w-md',
		md: 'max-w-2xl',
		lg: 'max-w-4xl',
		xl: 'max-w-6xl'
	};
</script>

<Dialog.Root bind:open onOpenChange={(isOpen) => !isOpen && onClose()}>
	<Dialog.Portal>
		<Dialog.Overlay transition={fade} transitionConfig={{ duration: 150 }} class="fixed inset-0 z-50 bg-gray-500/75 backdrop-blur-sm" />
		<Dialog.Content
			transition={fly}
			transitionConfig={{ y: -10, duration: 200 }}
			class={cn(
				'fixed left-1/2 top-1/2 z-50 w-full -translate-x-1/2 -translate-y-1/2',
				'bg-white rounded-2xl shadow-2xl border border-gray-200',
				'max-h-[90vh] overflow-y-auto',
				sizes[size],
				className
			)}
		>
			{#if title || showCloseButton}
				<div class="flex items-center justify-between p-6 border-b border-gray-100">
					<div>
						{#if title}
							<Dialog.Title class="text-2xl font-bold text-gray-900">
								{title}
							</Dialog.Title>
						{/if}
						{#if description}
							<Dialog.Description class="mt-1 text-sm text-gray-600">
								{description}
							</Dialog.Description>
						{/if}
					</div>
					{#if showCloseButton}
						<Dialog.Close class="p-2 rounded-lg hover:bg-gray-100 transition-colors">
							<X class="w-5 h-5 text-gray-400" />
						</Dialog.Close>
					{/if}
				</div>
			{/if}

			<div class="p-6">
				{@render children()}
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
