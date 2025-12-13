<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';

	$: currentPath = $page.url.pathname;
</script>

<div class="min-h-screen flex flex-col">
	<header class="bg-white shadow-sm border-b border-gray-200">
		<nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between h-16">
				<div class="flex">
					<!-- Logo -->
					<div class="flex-shrink-0 flex items-center">
						<a href="/" class="text-2xl font-bold text-primary-600">Rewind</a>
					</div>

					<!-- Navigation Links -->
					<div class="hidden sm:ml-8 sm:flex sm:space-x-8">
						<a
							href="/"
							class="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors {currentPath ===
							'/'
								? 'border-primary-500 text-gray-900'
								: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
						>
							Sessions
						</a>
						<a
							href="/stats"
							class="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors {currentPath ===
							'/stats'
								? 'border-primary-500 text-gray-900'
								: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
						>
							Statistics
						</a>
						<a
							href="/metrics"
							class="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors {currentPath ===
							'/metrics'
								? 'border-primary-500 text-gray-900'
								: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
						>
							Metrics
						</a>
					</div>
				</div>

				<!-- Status Indicator -->
				<div class="flex items-center">
					<div class="flex items-center text-sm text-gray-500">
						<div class="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
						<span>API Connected</span>
					</div>
				</div>
			</div>
		</nav>
	</header>

	<main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
		<slot />
	</main>

	<footer class="bg-white border-t border-gray-200 mt-auto">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
			<p class="text-center text-sm text-gray-500">
				Rewind - HTTP Traffic Capture & Analysis Platform
			</p>
		</div>
	</footer>
</div>
