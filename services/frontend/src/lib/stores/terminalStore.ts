import { writable } from 'svelte/store';

export interface TerminalMessage {
	text: string;
	timestamp: number;
	type: 'output' | 'input' | 'system';
}

interface TerminalState {
	messages: TerminalMessage[];
	isConnected: boolean;
	websocket: WebSocket | null;
}

function createTerminalStore() {
	const { subscribe, set, update } = writable<TerminalState>({
		messages: [],
		isConnected: false,
		websocket: null
	});

	return {
		subscribe,
		addMessage: (text: string, type: TerminalMessage['type'] = 'output') => {
			update((state) => ({
				...state,
				messages: [...state.messages, { text, timestamp: Date.now(), type }]
			}));
		},
		clearMessages: () => {
			update((state) => ({
				...state,
				messages: []
			}));
		},
		setConnected: (connected: boolean) => {
			update((state) => ({
				...state,
				isConnected: connected
			}));
		},
		setWebSocket: (ws: WebSocket | null) => {
			update((state) => ({
				...state,
				websocket: ws
			}));
		},
		disconnect: () => {
			update((state) => {
				if (state.websocket) {
					state.websocket.close();
				}
				return {
					...state,
					websocket: null,
					isConnected: false
				};
			});
		},
		reset: () => {
			set({
				messages: [],
				isConnected: false,
				websocket: null
			});
		}
	};
}

export const terminalStore = createTerminalStore();
