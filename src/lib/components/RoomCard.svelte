<script>
  let { room, onJoin = null, onSpectate = null } = $props();

  const statusColors = {
    waiting: "bg-green-500",
    playing: "bg-amber-500",
    finished: "bg-slate-500",
  };

  const statusLabels = {
    waiting: "Waiting",
    playing: "In Progress",
    finished: "Finished",
  };
</script>

<div
  class="card flex flex-col sm:flex-row sm:items-center justify-between gap-3"
>
  <div class="flex-1">
    <div class="flex items-center gap-2 mb-1">
      <span class="w-2 h-2 rounded-full {statusColors[room.status]}"></span>
      <h3 class="font-semibold">{room.name}</h3>
    </div>

    <div class="text-sm text-slate-400">
      <span>{room.player_count || 0}/{room.max_players} players</span>
      {#if room.spectator_count > 0}
        <span class="ml-2">• {room.spectator_count} watching</span>
      {/if}
      {#if room.turn_timer}
        <span class="ml-2">• ⏱ {room.turn_timer}s timer</span>
      {/if}
    </div>

    <div class="text-xs text-slate-500 mt-1">
      {statusLabels[room.status]}
      {#if room.status === "playing"}
        • Room code: {room.id}
      {/if}
    </div>
  </div>

  <div class="flex gap-2">
    {#if room.status === "waiting"}
      <button class="btn-success" onclick={() => onJoin?.(room.id)}>
        Join
      </button>
    {:else if room.status === "playing"}
      <button class="btn-secondary" onclick={() => onSpectate?.(room.id)}>
        Watch
      </button>
    {:else}
      <button class="btn-secondary" onclick={() => onSpectate?.(room.id)}>
        View
      </button>
    {/if}
  </div>
</div>
