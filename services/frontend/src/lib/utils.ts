/**
 * Format Unix timestamp to readable date string
 */
export function formatTimestamp(timestamp: number): string {
	return new Date(timestamp * 1000).toLocaleString();
}

/**
 * Format duration in seconds to human-readable format
 */
export function formatDuration(seconds: number): string {
	if (seconds < 1) {
		return `${Math.round(seconds * 1000)}ms`;
	}
	if (seconds < 60) {
		return `${seconds.toFixed(2)}s`;
	}
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = Math.floor(seconds % 60);
	return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Get badge color class based on HTTP status code
 */
export function getStatusBadgeClass(statusCode: number): string {
	if (statusCode >= 200 && statusCode < 300) return 'badge-success';
	if (statusCode >= 300 && statusCode < 400) return 'badge-info';
	if (statusCode >= 400 && statusCode < 500) return 'badge-warning';
	if (statusCode >= 500) return 'badge-error';
	return 'badge-info';
}

/**
 * Get badge color class for HTTP method
 */
export function getMethodBadgeClass(method: string): string {
	const methodMap: Record<string, string> = {
		GET: 'badge-info',
		POST: 'badge-success',
		PUT: 'badge-warning',
		DELETE: 'badge-error',
		PATCH: 'badge-warning',
		OPTIONS: 'badge-info',
		HEAD: 'badge-info'
	};
	return methodMap[method.toUpperCase()] || 'badge-info';
}

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number): string {
	if (bytes === 0) return '0 B';
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Try to parse and pretty-print JSON
 */
export function tryFormatJson(text: string): string {
	try {
		const parsed = JSON.parse(text);
		return JSON.stringify(parsed, null, 2);
	} catch {
		return text;
	}
}

/**
 * Check if content is JSON
 */
export function isJson(text: string): boolean {
	try {
		JSON.parse(text);
		return true;
	} catch {
		return false;
	}
}
