<script>
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { getSocket } from "$lib/socket.js";
  import { player } from "$lib/stores/player.js";
  import {
    room,
    gameState,
    players,
    spectators,
    isPlaying,
    isWaiting,
    isFinished,
  } from "$lib/stores/game.js";
  import Dice from "$lib/components/Dice.svelte";
  import Scorecard from "$lib/components/Scorecard.svelte";
  import PlayerList from "$lib/components/PlayerList.svelte";
  import CheatPanel from "$lib/components/CheatPanel.svelte";
  import { calculateTotalScore } from "$lib/utils/scoring.js";

  const roomId = $derived($page.params.id);

  // Cheat mode state
  let cheatTarget = $state(null);

  // Find current player's data
  const me = $derived($players.find((p) => p.id === $player.id));
  const isSpectator = $derived($spectators.some((s) => s.id === $player.id));
  const isHost = $derived($room?.host_id === $player.id);

  // Game state helpers
  const currentPlayer = $derived($players[$gameState?.currentPlayerIndex || 0]);
  const isMyTurn = $derived($isPlaying && currentPlayer?.id === $player.id);
  const canRoll = $derived(
    isMyTurn && ($gameState?.rollsLeft || 0) > 0 && !$gameState?.isRolling,
  );
  const canHold = $derived(
    isMyTurn &&
      ($gameState?.rollsLeft || 0) < 3 &&
      ($gameState?.rollsLeft || 0) > 0,
  );
  const canScore = $derived(isMyTurn && ($gameState?.rollsLeft || 0) < 3);

  // Reset cheat target when turn ends or new turn starts
  $effect(() => {
    if ($gameState?.rollsLeft === 3) {
      cheatTarget = null;
    }
  });

  onMount(() => {
    if (!$player.name) {
      goto("/yahtzee");
      return;
    }

    // If we don't have room data, we might need to rejoin
    // The socket reconnect handler should handle this
  });

  function handleRoll() {
    const socket = getSocket();
    if (!socket || !canRoll) return;
    socket.emit("roll-dice", { roomId, playerId: $player.id, cheatTarget });
  }

  function handleCheatSelect(category) {
    cheatTarget = category;
  }

  function handleToggleHold(index) {
    const socket = getSocket();
    if (!socket || !canHold) return;
    socket.emit("toggle-hold", {
      roomId,
      playerId: $player.id,
      dieIndex: index,
    });
  }

  function handleScore(category) {
    const socket = getSocket();
    if (!socket || !canScore) return;
    socket.emit("score-category", { roomId, playerId: $player.id, category });
  }

  function handleStartGame() {
    const socket = getSocket();
    if (!socket || !isHost) return;
    socket.emit("start-game", { roomId, playerId: $player.id });
  }

  function handleLeave() {
    const socket = getSocket();
    if (!socket) return;
    socket.emit("leave-room", { roomId, playerId: $player.id });
    player.setId(null);
    room.set(null);
    goto("/yahtzee/lobby");
  }

  function handleKick(targetPlayerId) {
    const socket = getSocket();
    if (!socket || !isHost) return;
    socket.emit("kick-player", {
      roomId,
      playerId: $player.id,
      targetPlayerId,
    });
  }

  function handlePlayAgain() {
    goto("/yahtzee/lobby");
  }
</script>

<svelte:head>
  <title>Yahtzee - {$room?.name || "Game"}</title>
</svelte:head>

<div class="min-h-screen p-4 pb-safe">
  <!-- Header -->
  <div class="flex items-center justify-between mb-4">
    <button class="text-slate-400 hover:text-white" onclick={handleLeave}>
      ← Leave
    </button>

    <div class="text-center">
      <h1 class="font-bold">{$room?.name || "Loading..."}</h1>
      {#if $isPlaying}
        <span class="text-sm text-slate-400"
          >Round {$gameState?.turnNumber || 1} of 13</span
        >
      {:else if $isWaiting}
        <span class="text-sm text-slate-400">Room: {roomId}</span>
      {/if}
    </div>

    <div class="w-16"></div>
  </div>

  {#if !$room}
    <div class="card text-center py-12">
      <p class="text-slate-400">Loading room...</p>
    </div>
  {:else if $isWaiting}
    <!-- Waiting Room -->
    <div class="max-w-md mx-auto space-y-4">
      <PlayerList
        players={$players}
        spectators={$spectators}
        hostId={$room.host_id}
        myPlayerId={$player.id}
        isPlaying={false}
        onKick={isHost ? handleKick : null}
      />

      <div class="card text-center">
        <p class="text-slate-400 mb-2">Share this code with friends:</p>
        <p class="text-3xl font-mono font-bold text-yahtzee-red">{roomId}</p>

        {#if $room.turn_timer}
          <p class="text-sm text-slate-400 mt-2">
            ⏱ {$room.turn_timer}s turn timer enabled
          </p>
        {/if}
      </div>

      {#if isHost}
        <button
          class="btn-success w-full text-lg py-3"
          onclick={handleStartGame}
          disabled={$players.length < 1}
        >
          Start Game
        </button>
        {#if $players.length < 1}
          <p class="text-sm text-slate-400 text-center">
            Need at least 1 player to start
          </p>
        {/if}
      {:else if isSpectator}
        <div class="card text-center">
          <p class="text-slate-400">👁 You're spectating</p>
          <p class="text-sm text-slate-500">
            Waiting for host to start the game...
          </p>
        </div>
      {:else}
        <div class="card text-center">
          <p class="text-slate-400">Waiting for host to start the game...</p>
        </div>
      {/if}
    </div>
  {:else if $isPlaying}
    <!-- Game in Progress -->
    <div class="max-w-4xl mx-auto">
      <!-- Turn indicator -->
      <div class="text-center mb-4">
        {#if isMyTurn}
          <span class="text-lg font-semibold text-yahtzee-green"
            >🎯 Your turn!</span
          >
        {:else}
          <span class="text-slate-400">
            Waiting for <span class="font-semibold text-white"
              >{currentPlayer?.name}</span
            >...
          </span>
        {/if}
      </div>

      <div class="grid lg:grid-cols-3 gap-4">
        <!-- Left: Dice + Controls -->
        <div class="lg:col-span-2 space-y-4">
          <!-- Dice area -->
          <div class="card">
            <Dice
              dice={$gameState?.dice || [1, 1, 1, 1, 1]}
              heldDice={$gameState?.heldDice || [
                false,
                false,
                false,
                false,
                false,
              ]}
              rollsLeft={$gameState?.rollsLeft || 3}
              isRolling={$gameState?.isRolling || false}
              {canHold}
              {canRoll}
              onToggleHold={handleToggleHold}
              onRoll={handleRoll}
            />
          </div>

          <!-- My scorecard -->
          {#if me && !isSpectator}
            <Scorecard
              scorecard={me.scorecard || {}}
              dice={$gameState?.dice}
              {canScore}
              onScore={handleScore}
            />
          {/if}
        </div>

        <!-- Right: Players -->
        <div>
          <PlayerList
            players={$players}
            spectators={$spectators}
            currentPlayerIndex={$gameState?.currentPlayerIndex || 0}
            hostId={$room.host_id}
            myPlayerId={$player.id}
            isPlaying={true}
          />
        </div>
      </div>
    </div>
  {:else if $isFinished}
    <!-- Game Over -->
    <div class="max-w-md mx-auto space-y-4">
      <div class="card text-center">
        <h2 class="text-2xl font-bold mb-2">🏆 Game Over!</h2>

        {#if $gameState?.winner}
          <p class="text-lg">
            <span class="font-semibold text-yahtzee-green"
              >{$gameState.winner.name}</span
            > wins!
          </p>
          <p class="text-3xl font-mono font-bold text-yahtzee-red mt-2">
            {$gameState.winner.score} points
          </p>
        {/if}
      </div>

      <!-- Final scores -->
      <div class="card">
        <h3 class="font-bold mb-3">Final Scores</h3>
        <div class="space-y-2">
          {#each [...$players].sort((a, b) => calculateTotalScore(b.scorecard) - calculateTotalScore(a.scorecard)) as p, i}
            <div
              class="flex justify-between items-center p-2 rounded {i === 0
                ? 'bg-yahtzee-green/20'
                : ''}"
            >
              <span>
                {#if i === 0}🥇{:else if i === 1}🥈{:else if i === 2}🥉{:else}{i +
                    1}.{/if}
                {p.name}
              </span>
              <span class="font-mono font-bold"
                >{calculateTotalScore(p.scorecard)}</span
              >
            </div>
          {/each}
        </div>
      </div>

      <button class="btn-primary w-full" onclick={handlePlayAgain}>
        Back to Lobby
      </button>
    </div>
  {/if}
</div>

<!-- Cheat Panel for Sander -->
{#if $isPlaying && isMyTurn}
  <CheatPanel
    dice={$gameState?.dice || [1, 1, 1, 1, 1]}
    heldDice={$gameState?.heldDice || [false, false, false, false, false]}
    scorecard={me?.scorecard || {}}
    playerName={$player.name}
    rollsLeft={$gameState?.rollsLeft || 3}
    onSelectCheat={handleCheatSelect}
  />
{/if}
