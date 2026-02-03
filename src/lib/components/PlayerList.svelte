<script>
  import { calculateTotalScore } from "$lib/utils/scoring.js";

  let {
    players = [],
    spectators = [],
    currentPlayerIndex = 0,
    hostId = null,
    myPlayerId = null,
    isPlaying = false,
    onKick = null,
  } = $props();

  function getScore(player) {
    if (!player.scorecard || typeof player.scorecard !== "object") return 0;
    return calculateTotalScore(player.scorecard);
  }

  const isHost = $derived(myPlayerId === hostId);
</script>

<div class="card">
  <h3 class="font-bold text-lg mb-3">
    Players ({players.length})
  </h3>

  <div class="space-y-2">
    {#each players as player, index}
      {@const isCurrent = isPlaying && index === currentPlayerIndex}
      {@const isMe = player.id === myPlayerId}
      {@const isPlayerHost = player.id === hostId}

      <div
        class="flex items-center justify-between p-2 rounded-lg transition-colors {isCurrent
          ? 'bg-yahtzee-red/20 border-l-4 border-yahtzee-red'
          : ''}"
      >
        <div class="flex items-center gap-2">
          {#if isCurrent}
            <span class="animate-pulse">🎯</span>
          {/if}

          <span
            class:font-semibold={isMe}
            class:opacity-50={!player.is_connected}
          >
            {player.name}
            {#if isMe}(you){/if}
          </span>

          {#if isPlayerHost}
            <span class="text-xs bg-amber-600 px-1.5 py-0.5 rounded">HOST</span>
          {/if}

          {#if !player.is_connected}
            <span class="text-xs text-slate-400">(offline)</span>
          {/if}
        </div>

        <div class="flex items-center gap-3">
          {#if isPlaying}
            <span class="font-mono text-lg">{getScore(player)}</span>
          {/if}

          {#if isHost && !isMe && !isPlaying && onKick}
            <button
              class="text-xs text-red-400 hover:text-red-300"
              onclick={() => onKick(player.id)}
            >
              Kick
            </button>
          {/if}
        </div>
      </div>
    {/each}
  </div>

  {#if spectators.length > 0}
    <div class="mt-4 pt-3 border-t border-slate-700">
      <h4 class="text-sm text-slate-400 mb-2">
        👁 Spectators ({spectators.length})
      </h4>
      <div class="flex flex-wrap gap-2">
        {#each spectators as spectator}
          <span class="text-sm text-slate-400">
            {spectator.name}
          </span>
        {/each}
      </div>
    </div>
  {/if}
</div>
