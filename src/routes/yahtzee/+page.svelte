<script>
  import { goto } from '$app/navigation';
  import { player } from '$lib/stores/player.js';
  
  let name = $state($player.name || '');
  
  function handleSubmit(e) {
    e.preventDefault();
    if (name.trim()) {
      player.setName(name.trim());
      goto('/yahtzee/lobby');
    }
  }
</script>

<svelte:head>
  <title>Yahtzee - Play Online</title>
</svelte:head>

<div class="min-h-screen flex flex-col items-center justify-center p-4">
  <div class="text-center mb-8">
    <h1 class="text-5xl sm:text-6xl font-bold mb-2">
      🎲 Yahtzee 🎲
    </h1>
    <p class="text-slate-400">
      Play the classic dice game with friends
    </p>
  </div>
  
  <form onsubmit={handleSubmit} class="w-full max-w-xs">
    <input
      type="text"
      class="input text-center text-lg mb-4"
      placeholder="Enter your name"
      bind:value={name}
      maxlength="20"
      autofocus
    />
    
    <button 
      type="submit"
      class="btn-primary w-full text-lg py-3"
      disabled={!name.trim()}
    >
      Play Now →
    </button>
  </form>
  
  <p class="text-sm text-slate-500 mt-8">
    No account needed. Just pick a name and play!
  </p>
</div>
