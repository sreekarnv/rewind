<svelte:options runes={true} />

<script lang="ts">
    import { createMutation, useQueryClient } from "@tanstack/svelte-query";
    import { client } from "$lib/client";
    import type { AlertSeverity, AlertCondition } from "$lib/types";

    interface Props {
        isOpen: boolean;
        onClose: () => void;
    }

    let { isOpen, onClose }: Props = $props();

    const queryClient = useQueryClient();

    let name = $state("");
    let description = $state("");
    let severity = $state<AlertSeverity>("warning");
    let cooldownMinutes = $state(5);
    let conditions = $state<AlertCondition[]>([
        { type: "status_code", operator: "equals", value: "" },
    ]);

    const createAlertMutation = createMutation(() => ({
        mutationFn: async (data: any) => {
            const response = await client.api.v1.alerts.post(data);
            if (response.error) throw new Error("Failed to create alert rule");
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["alerts"] });
            resetForm();
            onClose();
        },
    }));

    function addCondition() {
        conditions = [
            ...conditions,
            { type: "status_code", operator: "equals", value: "" },
        ];
    }

    function removeCondition(index: number) {
        conditions = conditions.filter((_, i) => i !== index);
    }

    function updateCondition(
        index: number,
        field: keyof AlertCondition,
        value: any,
    ) {
        conditions = conditions.map((cond, i) =>
            i === index ? { ...cond, [field]: value } : cond,
        );
    }

    function handleSubmit() {
        if (!name.trim()) {
            alert("Please enter a rule name");
            return;
        }

        if (conditions.length === 0) {
            alert("Please add at least one condition");
            return;
        }

        for (const cond of conditions) {
            if (!cond.value) {
                alert("Please fill in all condition values");
                return;
            }
        }

        const processedConditions = conditions.map((cond) => ({
            ...cond,
            value:
                cond.type === "response_time" || cond.type === "status_code"
                    ? Number(cond.value)
                    : cond.value,
        }));

        createAlertMutation.mutate({
            name: name.trim(),
            description: description.trim() || undefined,
            severity,
            conditions: processedConditions,
            cooldownMinutes,
        });
    }

    function resetForm() {
        name = "";
        description = "";
        severity = "warning";
        cooldownMinutes = 5;
        conditions = [{ type: "status_code", operator: "equals", value: "" }];
    }

    function handleClose() {
        if (!createAlertMutation.isPending) {
            resetForm();
            onClose();
        }
    }

    $effect(() => {
        if (isOpen) {
            const handleEscape = (e: KeyboardEvent) => {
                if (e.key === "Escape") handleClose();
            };
            document.addEventListener("keydown", handleEscape);
            return () => document.removeEventListener("keydown", handleEscape);
        }
    });
</script>

{#if isOpen}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="fixed inset-0 z-50 overflow-y-auto" onclick={handleClose}>
        <div
            class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0"
        >
            <div
                class="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 backdrop-blur-sm"
            ></div>

            <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="create-alert-title"
                tabindex="-1"
                class="relative inline-block w-full max-w-3xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl"
                onclick={(e) => e.stopPropagation()}
            >
                <div class="flex items-center justify-between mb-6">
                    <h3
                        id="create-alert-title"
                        class="text-2xl font-bold text-gray-900"
                    >
                        Create Alert Rule
                    </h3>

                    <button
                        onclick={handleClose}
                        aria-label="Close modal"
                        class="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                        disabled={createAlertMutation.isPending}
                    >
                        <svg
                            class="w-6 h-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                <div class="space-y-6">
                    <div>
                        <label
                            for="alert-name"
                            class="block text-sm font-medium text-gray-700 mb-2"
                        >
                            Rule Name <span class="text-red-500">*</span>
                        </label>
                        <input
                            id="alert-name"
                            type="text"
                            bind:value={name}
                            placeholder="e.g., Server Error Alert"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            disabled={createAlertMutation.isPending}
                        />
                    </div>

                    <div>
                        <label
                            for="alert-description"
                            class="block text-sm font-medium text-gray-700 mb-2"
                        >
                            Description (optional)
                        </label>
                        <textarea
                            id="alert-description"
                            bind:value={description}
                            placeholder="Describe what this alert monitors..."
                            rows="2"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            disabled={createAlertMutation.isPending}
                        ></textarea>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label
                                for="alert-severity"
                                class="block text-sm font-medium text-gray-700 mb-2"
                            >
                                Severity <span class="text-red-500">*</span>
                            </label>
                            <select
                                id="alert-severity"
                                bind:value={severity}
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                disabled={createAlertMutation.isPending}
                            >
                                <option value="info">Info</option>
                                <option value="warning">Warning</option>
                                <option value="error">Error</option>
                                <option value="critical">Critical</option>
                            </select>
                        </div>
                        <div>
                            <label
                                for="alert-cooldown"
                                class="block text-sm font-medium text-gray-700 mb-2"
                            >
                                Cooldown (minutes) <span class="text-red-500"
                                    >*</span
                                >
                            </label>
                            <input
                                id="alert-cooldown"
                                type="number"
                                bind:value={cooldownMinutes}
                                min="0"
                                max="1440"
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                disabled={createAlertMutation.isPending}
                            />
                        </div>
                    </div>

                    <div>
                        <div class="flex items-center justify-between mb-3">
                            <!-- svelte-ignore a11y_label_has_associated_control -->
                            <label
                                class="block text-sm font-medium text-gray-700"
                            >
                                Conditions <span class="text-red-500">*</span>
                            </label>
                            <button
                                onclick={addCondition}
                                aria-label="Add new condition"
                                class="px-3 py-1 text-sm font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                                disabled={createAlertMutation.isPending}
                            >
                                + Add Condition
                            </button>
                        </div>

                        <div class="space-y-3">
                            {#each conditions as condition, index (index)}
                                <div
                                    class="p-4 border border-gray-200 rounded-lg bg-gray-50"
                                >
                                    <div
                                        class="grid grid-cols-12 gap-3 items-start"
                                    >
                                        <div class="col-span-4">
                                            <select
                                                value={condition.type}
                                                onchange={(e) =>
                                                    updateCondition(
                                                        index,
                                                        "type",
                                                        e.currentTarget.value,
                                                    )}
                                                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                disabled={createAlertMutation.isPending}
                                            >
                                                <option value="status_code"
                                                    >Status Code</option
                                                >
                                                <option value="status_range"
                                                    >Status Range</option
                                                >
                                                <option value="method"
                                                    >HTTP Method</option
                                                >
                                                <option value="url_pattern"
                                                    >URL Pattern</option
                                                >
                                                <option value="response_time"
                                                    >Response Time</option
                                                >
                                            </select>
                                        </div>

                                        <div class="col-span-3">
                                            <select
                                                value={condition.operator}
                                                onchange={(e) =>
                                                    updateCondition(
                                                        index,
                                                        "operator",
                                                        e.currentTarget.value,
                                                    )}
                                                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                disabled={createAlertMutation.isPending}
                                            >
                                                <option value="equals">=</option
                                                >
                                                <option value="not_equals"
                                                    >≠</option
                                                >
                                                <option value="greater_than"
                                                    >&gt;</option
                                                >
                                                <option value="less_than"
                                                    >&lt;</option
                                                >
                                                <option value="contains"
                                                    >contains</option
                                                >
                                                <option value="regex"
                                                    >regex</option
                                                >
                                            </select>
                                        </div>

                                        <div class="col-span-4">
                                            {#if condition.type === "status_range"}
                                                <select
                                                    value={condition.value}
                                                    onchange={(e) =>
                                                        updateCondition(
                                                            index,
                                                            "value",
                                                            e.currentTarget
                                                                .value,
                                                        )}
                                                    class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                    disabled={createAlertMutation.isPending}
                                                >
                                                    <option value=""
                                                        >Select range</option
                                                    >
                                                    <option value="5xx"
                                                        >5xx</option
                                                    >
                                                    <option value="4xx"
                                                        >4xx</option
                                                    >
                                                    <option value="3xx"
                                                        >3xx</option
                                                    >
                                                    <option value="2xx"
                                                        >2xx</option
                                                    >
                                                </select>
                                            {:else if condition.type === "method"}
                                                <select
                                                    value={condition.value}
                                                    onchange={(e) =>
                                                        updateCondition(
                                                            index,
                                                            "value",
                                                            e.currentTarget
                                                                .value,
                                                        )}
                                                    class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                    disabled={createAlertMutation.isPending}
                                                >
                                                    <option value=""
                                                        >Select method</option
                                                    >
                                                    <option value="GET"
                                                        >GET</option
                                                    >
                                                    <option value="POST"
                                                        >POST</option
                                                    >
                                                    <option value="PUT"
                                                        >PUT</option
                                                    >
                                                    <option value="PATCH"
                                                        >PATCH</option
                                                    >
                                                    <option value="DELETE"
                                                        >DELETE</option
                                                    >
                                                    <option value="OPTIONS"
                                                        >OPTIONS</option
                                                    >
                                                    <option value="HEAD"
                                                        >HEAD</option
                                                    >
                                                </select>
                                            {:else}
                                                <input
                                                    type={condition.type ===
                                                        "response_time" ||
                                                    condition.type ===
                                                        "status_code"
                                                        ? "number"
                                                        : "text"}
                                                    value={condition.value}
                                                    oninput={(e) =>
                                                        updateCondition(
                                                            index,
                                                            "value",
                                                            e.currentTarget
                                                                .value,
                                                        )}
                                                    placeholder={condition.type ===
                                                    "response_time"
                                                        ? "ms"
                                                        : condition.type ===
                                                            "status_code"
                                                          ? "e.g., 404"
                                                          : "value"}
                                                    class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                    disabled={createAlertMutation.isPending}
                                                />
                                            {/if}
                                        </div>

                                        <div class="col-span-1">
                                            <button
                                                onclick={() =>
                                                    removeCondition(index)}
                                                aria-label="Remove condition"
                                                class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                disabled={createAlertMutation.isPending ||
                                                    conditions.length === 1}
                                                title="Remove condition"
                                            >
                                                <svg
                                                    class="w-5 h-5"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        stroke-linecap="round"
                                                        stroke-linejoin="round"
                                                        stroke-width="2"
                                                        d="M6 18L18 6M6 6l12 12"
                                                    />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    </div>

                    <div
                        class="p-4 bg-blue-50 border border-blue-200 rounded-lg"
                    >
                        <p class="text-sm text-blue-800">
                            <strong>Note:</strong> All conditions must match (AND
                            logic) for the alert to trigger. The cooldown period prevents
                            alert spam by limiting how often the same rule can trigger.
                        </p>
                    </div>
                </div>

                <div
                    class="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200"
                >
                    <button
                        onclick={handleClose}
                        class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                        disabled={createAlertMutation.isPending}
                    >
                        Cancel
                    </button>
                    <button
                        onclick={handleSubmit}
                        class="px-6 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-all shadow-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={createAlertMutation.isPending}
                    >
                        {#if createAlertMutation.isPending}
                            <span class="flex items-center gap-2">
                                <svg
                                    class="animate-spin h-4 w-4"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        class="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        stroke-width="4"
                                        fill="none"
                                    ></circle>
                                    <path
                                        class="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                </svg>
                                Creating...
                            </span>
                        {:else}
                            Create Alert Rule
                        {/if}
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if}
