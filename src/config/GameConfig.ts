export const GameConfig = {
  // The initial balance and default bet amount for the player
  balance: {
    starting: 10000,
    defaultBet: 1,
  },

  // Show cheat/audio menus in the UI
  showCheatMenu: false,
  showAudioMenu: false,

  // Reel configuration
  reels: {
    count: 5,
    visibleSymbols: 3,
  },

  // Layout breakpoints in pixels
  layout: {
    mobileBreakpoint: 768,
    desktopBreakpoint: 1400,
  },

  spin: {
    // How long reels spin at full speed before the first one starts stopping
    minDurationMs: 1500,

    // Delay between each reel's stop, so they settle left to right instead of all at once
    stopStaggerMs: 500,

    // Delay after the reels settle before the win amount updates and celebrates
    winDisplayDelayMs: 1000,

    // Reel spin animation feel
    baseSpeed: 3200,
    speedAmplitude: 1400,
    oscillationPeriodMs: 2150,
    upDurationMs: 200,
    downDurationMs: 650,
    downCreepFactor: 0.4,
    settleDurationMs: 60,
    settleOvershootFraction: 0.05,
  },
} as const;
