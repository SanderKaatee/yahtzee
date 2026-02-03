<script>
  let { 
    open = false,
    playerName = '',
    onCreate = null,
    onClose = null
  } = $props();
  
  let roomName = $state('');
  let turnTimer = $state('');
  
  function handleSubmit(e) {
    e.preventDefault();
    onCreate?.({
      roomName: roomName || `${playerName}'s Game`,
      turnTimer: turnTimer ? parseInt(turnTimer) : null
    });
    roomName = '';
    turnTimer = '';
  }
  
  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  }
</script>

{#if open}
  <!-- Backdrop -->
  <div 
    class="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
    onclick={handleBackdropClick}
    role="dialog"
    aria-modal="true"
  >
    <!-- Modal -->
    <div class="card w-full max-w-md animate-bounce-in">
      <h2 class="text-xl font-bold mb-4">Create New Room</h2>
      
      <form onsubmit={handleSubmit}>
        <div class="space-y-4">
          <div>
            <label for="roomName" class="block text-sm text-slate-400 mb-1">
              Room Name (optional)
            </label>
            <input
              id="roomName"
              type="text"
              class="input"
              placeholder="{playerName}'s Game"
              bind:value={roomName}
              maxlength="30"
            />
          </div>
          
          <div>
            <label for="turnTimer" class="block text-sm text-slate-400 mb-1">
              Turn Timer (optional)
            </label>
            <select id="turnTimer" class="input" bind:value={turnTimer}>
              <option value="">No timer</option>
              <option value="30">30 seconds</option>
              <option value="60">1 minute</option>
              <option value="120">2 minutes</option>
              <option value="300">5 minutes</option>
            </select>
            <p class="text-xs text-slate-500 mt-1">
              Players will need to make their move before time runs out
            </p>
          </div>
        </div>
        
        <div class="flex gap-3 mt-6">
          <button type="button" class="btn-secondary flex-1" onclick={onClose}>
            Cancel
          </button>
          <button type="submit" class="btn-primary flex-1">
            Create Room
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
