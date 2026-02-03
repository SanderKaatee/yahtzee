<script>
  import { CATEGORIES, calculateScore, calculateUpperTotal, calculateUpperBonus, calculateLowerTotal, calculateTotalScore } from '$lib/utils/scoring.js';
  
  let { 
    scorecard = {}, 
    dice = null,
    canScore = false,
    onScore = null,
    compact = false
  } = $props();
  
  // Preview score for each category
  function getPreviewScore(category) {
    if (!dice || !canScore || scorecard[category] !== null) return null;
    return calculateScore(dice, category);
  }
  
  function handleScore(category) {
    if (canScore && scorecard[category] === null && onScore) {
      onScore(category);
    }
  }
  
  const upperTotal = $derived(calculateUpperTotal(scorecard));
  const upperBonus = $derived(calculateUpperBonus(scorecard));
  const lowerTotal = $derived(calculateLowerTotal(scorecard));
  const grandTotal = $derived(calculateTotalScore(scorecard));
  const bonusProgress = $derived(Math.min(upperTotal, 63));
</script>

<div class="card" class:p-2={compact} class:text-sm={compact}>
  {#if !compact}
    <h3 class="font-bold text-lg mb-3 text-center">Scorecard</h3>
  {/if}
  
  <!-- Upper Section -->
  <div class="mb-2">
    {#if !compact}
      <div class="text-xs text-slate-400 uppercase tracking-wide mb-1">Upper Section</div>
    {/if}
    
    {#each CATEGORIES.upper as { key, label }}
      {@const preview = getPreviewScore(key)}
      {@const scored = scorecard[key] !== null}
      {@const value = scorecard[key]}
      
      <button
        class="w-full flex justify-between items-center py-1.5 px-2 rounded hover:bg-slate-700/50 transition-colors"
        class:cursor-pointer={canScore && !scored}
        class:cursor-default={!canScore || scored}
        disabled={!canScore || scored}
        onclick={() => handleScore(key)}
      >
        <span class:text-slate-500={scored && value === 0}>{label}</span>
        <span class="font-mono">
          {#if scored}
            <span class:text-slate-500={value === 0}>{value}</span>
          {:else if preview !== null}
            <span class="text-yahtzee-green">{preview}→</span>
          {:else}
            <span class="text-slate-600">-</span>
          {/if}
        </span>
      </button>
    {/each}
    
    <!-- Upper bonus -->
    <div class="flex justify-between items-center py-1.5 px-2 border-t border-slate-700 mt-1">
      <span class="text-slate-400 text-sm">
        Bonus ({bonusProgress}/63)
      </span>
      <span class="font-mono" class:text-yahtzee-green={upperBonus > 0}>
        {upperBonus > 0 ? '+35' : '-'}
      </span>
    </div>
    
    <div class="flex justify-between items-center py-1 px-2 font-semibold">
      <span>Upper Total</span>
      <span class="font-mono">{upperTotal + upperBonus}</span>
    </div>
  </div>
  
  <!-- Lower Section -->
  <div class="border-t border-slate-700 pt-2">
    {#if !compact}
      <div class="text-xs text-slate-400 uppercase tracking-wide mb-1">Lower Section</div>
    {/if}
    
    {#each CATEGORIES.lower as { key, label }}
      {@const preview = getPreviewScore(key)}
      {@const scored = scorecard[key] !== null}
      {@const value = scorecard[key]}
      
      <button
        class="w-full flex justify-between items-center py-1.5 px-2 rounded hover:bg-slate-700/50 transition-colors"
        class:cursor-pointer={canScore && !scored}
        class:cursor-default={!canScore || scored}
        disabled={!canScore || scored}
        onclick={() => handleScore(key)}
      >
        <span class:text-slate-500={scored && value === 0}>{label}</span>
        <span class="font-mono">
          {#if scored}
            <span class:text-slate-500={value === 0}>{value}</span>
          {:else if preview !== null}
            <span class="text-yahtzee-green">{preview}→</span>
          {:else}
            <span class="text-slate-600">-</span>
          {/if}
        </span>
      </button>
    {/each}
    
    <!-- Yahtzee bonus -->
    {#if scorecard.yahtzeeBonus > 0}
      <div class="flex justify-between items-center py-1.5 px-2 text-yahtzee-green">
        <span>Yahtzee Bonus</span>
        <span class="font-mono">+{scorecard.yahtzeeBonus}</span>
      </div>
    {/if}
    
    <div class="flex justify-between items-center py-1 px-2 font-semibold">
      <span>Lower Total</span>
      <span class="font-mono">{lowerTotal}</span>
    </div>
  </div>
  
  <!-- Grand Total -->
  <div class="border-t-2 border-slate-600 mt-2 pt-2">
    <div class="flex justify-between items-center px-2 text-xl font-bold">
      <span>Total</span>
      <span class="font-mono text-yahtzee-red">{grandTotal}</span>
    </div>
  </div>
</div>
