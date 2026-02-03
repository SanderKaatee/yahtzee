<script>
    import {
        getAchievableCategories,
        isCheatEnabled,
    } from "$lib/cheat-client.js";

    let {
        dice = [1, 1, 1, 1, 1],
        heldDice = [false, false, false, false, false],
        scorecard = {},
        playerName = "",
        onSelectCheat = null,
        rollsLeft = 3,
    } = $props();

    let isOpen = $state(false);
    let selectedCategory = $state(null);

    // Only show for Sander
    const showCheatPanel = $derived(isCheatEnabled(playerName));

    // Get achievable categories based on current held dice
    const achievableCategories = $derived(
        getAchievableCategories(dice, heldDice, scorecard),
    );

    function handleSelectCategory(category) {
        selectedCategory = category;
        if (onSelectCheat) {
            onSelectCheat(category);
        }
    }

    function handleClearCheat() {
        selectedCategory = null;
        if (onSelectCheat) {
            onSelectCheat(null);
        }
    }

    // Reset selection when dice change after a roll
    $effect(() => {
        if (rollsLeft === 3) {
            selectedCategory = null;
        }
    });
</script>

{#if showCheatPanel}
    <div class="fixed bottom-4 right-4 z-50">
        <!-- Toggle Button -->
        <button
            class="w-12 h-12 rounded-full bg-purple-600 hover:bg-purple-500 text-white shadow-lg flex items-center justify-center transition-all duration-200"
            class:ring-2={selectedCategory}
            class:ring-yellow-400={selectedCategory}
            onclick={() => (isOpen = !isOpen)}
            title="Cheat Mode 🎲"
        >
            {#if selectedCategory}
                🎯
            {:else}
                🃏
            {/if}
        </button>

        <!-- Panel -->
        {#if isOpen}
            <div
                class="absolute bottom-14 right-0 w-64 bg-slate-800 border border-purple-500 rounded-lg shadow-xl overflow-hidden"
            >
                <div
                    class="bg-purple-600 px-3 py-2 flex items-center justify-between"
                >
                    <span class="font-bold text-sm">🎯 Cheat Mode</span>
                    <button
                        class="text-white/70 hover:text-white text-lg"
                        onclick={() => (isOpen = false)}>×</button
                    >
                </div>

                <div class="p-2 max-h-64 overflow-y-auto">
                    {#if selectedCategory}
                        <div
                            class="text-center p-2 bg-yellow-500/20 rounded mb-2"
                        >
                            <p class="text-sm text-yellow-400">
                                Next roll guarantees:
                            </p>
                            <p class="font-bold text-yellow-300">
                                {achievableCategories.find(
                                    (c) => c.category === selectedCategory,
                                )?.label || selectedCategory}
                            </p>
                            <button
                                class="mt-2 text-xs text-red-400 hover:text-red-300"
                                onclick={handleClearCheat}
                            >
                                Clear selection
                            </button>
                        </div>
                    {:else if achievableCategories.length === 0}
                        <p class="text-sm text-slate-400 text-center py-4">
                            No categories achievable with current held dice
                        </p>
                    {:else}
                        <p class="text-xs text-slate-400 mb-2 px-1">
                            Select target for next roll:
                        </p>
                        <div class="space-y-1">
                            {#each achievableCategories as { category, label }}
                                <button
                                    class="w-full text-left px-3 py-2 rounded text-sm transition-colors
                         hover:bg-purple-600/50 bg-slate-700/50"
                                    onclick={() =>
                                        handleSelectCategory(category)}
                                >
                                    {label}
                                </button>
                            {/each}
                        </div>
                    {/if}
                </div>

                <div
                    class="px-3 py-2 bg-slate-900/50 border-t border-slate-700"
                >
                    <p class="text-xs text-slate-500 text-center">
                        Only visible to Sander 🤫
                    </p>
                </div>
            </div>
        {/if}
    </div>
{/if}
