<script>
  import Die from './Die.svelte';
  
  let { 
    dice = [1, 1, 1, 1, 1], 
    heldDice = [false, false, false, false, false],
    rollsLeft = 3,
    isRolling = false,
    canHold = false,
    canRoll = false,
    onToggleHold = null,
    onRoll = null
  } = $props();
  
  function handleToggle(index) {
    if (canHold && onToggleHold) {
      onToggleHold(index);
    }
  }
  
  function handleRoll() {
    if (canRoll && onRoll) {
      onRoll();
    }
  }
  
  // Roll indicator dots
  const rollDots = $derived([...Array(3)].map((_, i) => i < rollsLeft));
</script>

<div class="flex flex-col items-center gap-4">
  <!-- Dice -->
  <div class="flex gap-2 sm:gap-3 flex-wrap justify-center">
    {#each dice as value, i}
      <Die 
        {value} 
        held={heldDice[i]} 
        rolling={isRolling}
        disabled={!canHold}
        onclick={() => handleToggle(i)}
      />
    {/each}
  </div>
  
  <!-- Hold hint -->
  {#if canHold}
    <p class="text-sm text-slate-400">Tap dice to hold them</p>
  {/if}
  
  <!-- Roll button and indicator -->
  <div class="flex items-center gap-4">
    <button
      class="btn-primary text-lg px-6 py-3"
      disabled={!canRoll}
      onclick={handleRoll}
    >
      🎲 {rollsLeft === 3 ? 'Roll Dice' : 'Roll Again'}
    </button>
    
    <!-- Rolls remaining indicator -->
    <div class="flex gap-1.5">
      {#each rollDots as active}
        <span 
          class="w-3 h-3 rounded-full transition-colors duration-200"
          class:bg-yahtzee-red={active}
          class:bg-slate-600={!active}
        ></span>
      {/each}
    </div>
  </div>
</div>
