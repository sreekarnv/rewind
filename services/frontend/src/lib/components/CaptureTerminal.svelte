<script lang="ts">
    import { onMount, onDestroy } from "svelte";

    export let show: boolean = false;

    let ws: WebSocket | null = null;
    let outputLines: string[] = [];
    let inputValue = "";
    let isConnected = false;
    let terminalElement: HTMLDivElement;
    let autoScroll = true;

    const WS_URL = "ws://localhost:8000/api/v1/capture/stream";

    onMount(() => {
        if (show) {
            connect();
        }
    });

    onDestroy(() => {
        disconnect();
    });

    $: if (show && !isConnected) {
        connect();
    } else if (!show && isConnected) {
        disconnect();
    }

    function connect() {
        try {
            ws = new WebSocket(WS_URL);

            ws.onopen = () => {
                isConnected = true;
                addOutput("=== Connected to capture agent ===\n");
            };

            ws.onmessage = (event) => {
                try {
                    // Log raw data for debugging
                    console.log(
                        "WebSocket received:",
                        typeof event.data,
                        event.data,
                    );

                    // Handle both string and object data
                    let message;
                    if (typeof event.data === "string") {
                        try {
                            message = JSON.parse(event.data);
                        } catch (parseErr) {
                            console.error(
                                "JSON parse failed:",
                                parseErr,
                                "Data:",
                                event.data,
                            );
                            // If it's not JSON, treat it as plain text output
                            addOutput(event.data);
                            return;
                        }
                    } else if (typeof event.data === "object") {
                        message = event.data;
                    } else {
                        console.error(
                            "Unexpected WebSocket data type:",
                            typeof event.data,
                        );
                        return;
                    }

                    if (message.type === "output") {
                        addOutput(message.data);
                    } else if (message.type === "input_ack") {
                        if (!message.success) {
                            addOutput("ERROR: Failed to send input\n");
                        }
                    } else if (message.type === "error") {
                        addOutput(`ERROR: ${message.message}\n`);
                    }
                } catch (err) {
                    console.error("WebSocket message handler error:", err);
                }
            };

            ws.onerror = (error) => {
                console.error("WebSocket error:", error);
                addOutput("ERROR: WebSocket connection error\n");
            };

            ws.onclose = () => {
                isConnected = false;
                addOutput("=== Disconnected from capture agent ===\n");
            };
        } catch (error) {
            console.error("Failed to connect to capture stream:", error);
        }
    }

    function disconnect() {
        if (ws) {
            ws.close();
            ws = null;
            isConnected = false;
        }
    }

    function addOutput(text: string) {
        outputLines = [...outputLines, text];

        if (autoScroll && terminalElement) {
            setTimeout(() => {
                terminalElement.scrollTop = terminalElement.scrollHeight;
            }, 10);
        }
    }

    function handleSubmit(e: Event) {
        e.preventDefault();

        if (!inputValue.trim() || !ws || ws.readyState !== WebSocket.OPEN) {
            return;
        }

        const messageObj = {
            type: "input",
            value: inputValue.trim(),
        };
        const messageStr = JSON.stringify(messageObj);

        console.log("Sending to backend:", messageObj);
        console.log("As JSON string:", messageStr);

        ws.send(messageStr);

        addOutput(`> ${inputValue}\n`);

        inputValue = "";
    }

    function clearTerminal() {
        outputLines = [];
    }

    function toggleAutoScroll() {
        autoScroll = !autoScroll;
    }
</script>

{#if show}
    <div class="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
        <div
            class="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700"
        >
            <div class="flex items-center gap-2">
                <div class="flex gap-1.5">
                    <div class="w-3 h-3 rounded-full bg-red-500"></div>
                    <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div class="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <span class="text-sm font-mono text-gray-300 ml-2"
                    >Capture Agent Output</span
                >
                {#if isConnected}
                    <span
                        class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-900 text-green-200"
                    >
                        <span
                            class="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5 animate-pulse"
                        ></span>
                        Connected
                    </span>
                {:else}
                    <span
                        class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-700 text-gray-300"
                    >
                        Disconnected
                    </span>
                {/if}
            </div>
            <div class="flex items-center gap-2">
                <button
                    on:click={toggleAutoScroll}
                    class="text-xs text-gray-400 hover:text-gray-200 transition-colors px-2 py-1 rounded hover:bg-gray-700"
                    title={autoScroll
                        ? "Disable auto-scroll"
                        : "Enable auto-scroll"}
                >
                    {autoScroll ? "📜 Auto" : "📜 Manual"}
                </button>
                <button
                    on:click={clearTerminal}
                    class="text-xs text-gray-400 hover:text-gray-200 transition-colors px-2 py-1 rounded hover:bg-gray-700"
                >
                    Clear
                </button>
            </div>
        </div>

        <div
            bind:this={terminalElement}
            class="bg-gray-900 p-4 h-96 overflow-y-auto font-mono text-sm text-green-400"
        >
            {#if outputLines.length === 0}
                <div class="text-gray-500 italic">
                    Waiting for output from capture agent...
                    <br />
                    Start the capture agent to see output here.
                </div>
            {:else}
                {#each outputLines as line}
                    <div class="whitespace-pre-wrap break-words">
                        {line}
                    </div>
                {/each}
            {/if}
        </div>

        <div class="bg-gray-800 px-4 py-3 border-t border-gray-700">
            <form on:submit={handleSubmit} class="flex gap-2">
                <div class="flex-1 flex items-center">
                    <span class="text-green-400 font-mono mr-2">&gt;</span>
                    <input
                        type="text"
                        bind:value={inputValue}
                        placeholder="Enter interface number or command..."
                        disabled={!isConnected}
                        class="flex-1 bg-transparent text-green-400 font-mono outline-none placeholder-gray-600 disabled:opacity-50"
                    />
                </div>
                <button
                    type="submit"
                    disabled={!isConnected || !inputValue.trim()}
                    class="px-4 py-1 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Send
                </button>
            </form>
            <div class="text-xs text-gray-500 mt-2">
                💡 Tip: When prompted for network interface, enter the interface
                number and press Send
            </div>
        </div>
    </div>
{/if}
