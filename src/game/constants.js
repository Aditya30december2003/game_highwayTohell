// game/constants.js

export const GAME_CONFIG = {
  gravity: 0.9,
  jumpVelocity: -16,
  groundHeightRatio: 0.78,
  baseScrollSpeed: 3,
  heroSpeed: 5,
};

export const HERO_STATES = {
  IDLE: "idle",
  RUN: "run",
  JUMP: "jump",
  ATTACK: "attack",
};

export const HERO_SPRITE_CONFIG = {
  frameWidth: 64,
  frameHeight: 64,
  animationRows: {
    idle: 11,
    run: 12,
    slash: 1,
  },
  framesPerAnimation: {
    idle: 9,
    run: 9,
    slash: 7,
  },
};
export const ENEMY_VALUES = {
  devil: 5,
  zombie: 2,
  minotaur: 10,
};


export const ENEMY_CONFIG = {
  devil: { speed: 3.5 },
  zombie: { speed: 3 },
  minotaur: { speed: 2.0 },
};

export const COIN_CONFIG = {
  spawnInterval: 1200,        // ~2 seconds
  speedMultiplier: 1.0,
};

export const TRAP_CONFIG = {
  rollerSpeed: 4.5,
  spawnInterval: 4600,        // ~4 seconds
};
