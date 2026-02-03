<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { getSocket } from '$lib/socket.js';
  import { player } from '$lib/stores/player.js';
  import { connected } from '$lib/stores/game.js';
  import RoomCard from '$lib/components/RoomCard.svelte';
  import CreateRoomModal from '$lib/components/CreateRoomModal.svelte';
  
  let rooms = $state([]);
  let showCreateModal = $state(false);
  let joinCode = $state('');
  
  onMount(() => {
    // Redirect if no name
    if (!$player.name) {
      goto('/yahtzee');
      return;
    }
    
    const socket = getSocket();
    if (!socket) return;
    
    // Listen for room list updates
    socket.on('room-list', (newRooms) => {
      rooms = newRooms;
    });
    
    // Request room list when connected
    if ($connected) {
      socket.emit('get-rooms');
    }
    
    // Also request when connection is established
    const unsubscribe = connected.subscribe(isConnected => {
      if (isConnected) {
        socket.emit('get-rooms');
      }
    });
    
    return () => {
      socket.off('room-list');
      unsubscribe();
    };
  });
  
  function handleCreateRoom({ roomName, turnTimer }) {
    const socket = getSocket();
    if (!socket) return;
    
    socket.emit('create-room', {
      playerName: $player.name,
      roomName,
      turnTimer
    });
    
    showCreateModal = false;
  }
  
  function handleJoin(roomId) {
    const socket = getSocket();
    if (!socket) return;
    
    socket.emit('join-room', {
      roomId,
      playerName: $player.name,
      asSpectator: false
    });
  }
  
  function handleSpectate(roomId) {
    const socket = getSocket();
    if (!socket) return;
    
    socket.emit('join-room', {
      roomId,
      playerName: $player.name,
      asSpectator: true
    });
  }
  
  function handleJoinByCode(e) {
    e.preventDefault();
    if (joinCode.trim()) {
      handleJoin(joinCode.trim().toUpperCase());
      joinCode = '';
    }
  }
  
  function handleChangeName() {
    player.clear();
    goto('/yahtzee');
  }
  
  // Split rooms by status
  const waitingRooms = $derived(rooms.filter(r => r.status === 'waiting'));
  const activeRooms = $derived(rooms.filter(r => r.status === 'playing'));
  const finishedRooms = $derived(rooms.filter(r => r.status === 'finished'));
</script>

<svelte:head>
  <title>Yahtzee - Lobby</title>
</svelte:head>

<div class="min-h-screen p-4 max-w-2xl mx-auto">
  <!-- Header -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
    <div>
      <h1 class="text-2xl font-bold">Welcome, {$player.name}!</h1>
      <button 
        class="text-sm text-slate-400 hover:text-slate-300"
        onclick={handleChangeName}
      >
        Change name
      </button>
    </div>
    
    <button class="btn-primary" onclick={() => showCreateModal = true}>
      + New Room
    </button>
  </div>
  
  <!-- Join by code -->
  <form onsubmit={handleJoinByCode} class="card mb-6">
    <div class="flex gap-2">
      <input
        type="text"
        class="input flex-1 uppercase"
        placeholder="Enter room code..."
        bind:value={joinCode}
        maxlength="6"
      />
      <button type="submit" class="btn-secondary" disabled={!joinCode.trim()}>
        Join
      </button>
    </div>
  </form>
  
  <!-- Room lists -->
  {#if rooms.length === 0}
    <div class="card text-center py-12">
      <p class="text-slate-400 mb-4">No rooms yet. Be the first to create one!</p>
      <button class="btn-primary" onclick={() => showCreateModal = true}>
        Create Room
      </button>
    </div>
  {:else}
    <!-- Waiting rooms -->
    {#if waitingRooms.length > 0}
      <div class="mb-6">
        <h2 class="text-sm text-slate-400 uppercase tracking-wide mb-3">
          🟢 Open Rooms
        </h2>
        <div class="space-y-3">
          {#each waitingRooms as room (room.id)}
            <RoomCard {room} onJoin={handleJoin} onSpectate={handleSpectate} />
          {/each}
        </div>
      </div>
    {/if}
    
    <!-- Active games -->
    {#if activeRooms.length > 0}
      <div class="mb-6">
        <h2 class="text-sm text-slate-400 uppercase tracking-wide mb-3">
          🟡 Games in Progress
        </h2>
        <div class="space-y-3">
          {#each activeRooms as room (room.id)}
            <RoomCard {room} onJoin={handleJoin} onSpectate={handleSpectate} />
          {/each}
        </div>
      </div>
    {/if}
    
    <!-- Finished games -->
    {#if finishedRooms.length > 0}
      <div class="mb-6">
        <h2 class="text-sm text-slate-400 uppercase tracking-wide mb-3">
          ⚫ Recently Finished
        </h2>
        <div class="space-y-3">
          {#each finishedRooms as room (room.id)}
            <RoomCard {room} onJoin={handleJoin} onSpectate={handleSpectate} />
          {/each}
        </div>
      </div>
    {/if}
  {/if}
</div>

<CreateRoomModal
  open={showCreateModal}
  playerName={$player.name}
  onCreate={handleCreateRoom}
  onClose={() => showCreateModal = false}
/>
