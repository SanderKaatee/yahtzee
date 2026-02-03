<script>
  import { onMount, onDestroy } from "svelte";
  import { page } from "$app/stores";
  import { browser } from "$app/environment";
  import { connectSocket, disconnectSocket } from "$lib/socket.js";
  import { connected, error } from "$lib/stores/game.js";
  import "../../app.css";

  let { children } = $props();

  onMount(() => {
    if (browser) {
      connectSocket();
    }
  });

  onDestroy(() => {
    if (browser) {
      disconnectSocket();
    }
  });
</script>

<div class="min-h-screen bg-slate-900 text-white">
  <!-- Connection indicator -->
  {#if browser && !$connected}
    <div
      class="fixed top-0 inset-x-0 bg-amber-600 text-center py-1 text-sm z-50"
    >
      Connecting to server...
    </div>
  {/if}

  <!-- Error toast -->
  {#if $error}
    <div
      class="fixed top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-bounce-in"
    >
      {$error}
    </div>
  {/if}

  {@render children()}
</div>
