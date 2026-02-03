<script>
  let { value = 1, held = false, disabled = false, rolling = false, onclick = null } = $props();
  
  // Dot positions for each die face
  const dotPositions = {
    1: ['center'],
    2: ['top-right', 'bottom-left'],
    3: ['top-right', 'center', 'bottom-left'],
    4: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
    5: ['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'],
    6: ['top-left', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-right']
  };
  
  const positionClasses = {
    'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
    'top-left': 'top-2 left-2',
    'top-right': 'top-2 right-2',
    'middle-left': 'top-1/2 left-2 -translate-y-1/2',
    'middle-right': 'top-1/2 right-2 -translate-y-1/2',
    'bottom-left': 'bottom-2 left-2',
    'bottom-right': 'bottom-2 right-2'
  };
</script>

<button
  type="button"
  class="die w-14 h-14 sm:w-16 sm:h-16 select-none touch-manipulation"
  class:held
  class:rolling
  class:cursor-pointer={!disabled && onclick}
  class:cursor-default={disabled || !onclick}
  class:opacity-60={disabled}
  disabled={disabled}
  onclick={onclick}
>
  {#each dotPositions[value] || [] as pos}
    <span class="dot {positionClasses[pos]}"></span>
  {/each}
</button>

<style>
  .rolling {
    animation: diceRoll 0.5s ease-out;
  }
  
  @keyframes diceRoll {
    0% { transform: rotateX(0deg) rotateY(0deg) scale(1); }
    25% { transform: rotateX(90deg) rotateY(45deg) scale(1.1); }
    50% { transform: rotateX(180deg) rotateY(180deg) scale(1); }
    75% { transform: rotateX(270deg) rotateY(270deg) scale(1.1); }
    100% { transform: rotateX(360deg) rotateY(360deg) scale(1); }
  }
</style>
