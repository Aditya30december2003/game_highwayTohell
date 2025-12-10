import { AnimatedSprite, Texture, Rectangle, Assets } from "pixi.js";
import { ENEMY_CONFIG, ENEMY_VALUES } from "./constants";


const ENEMY_ALIASES = {
  devil: "devilSheet",
  zombie: "zombieSheet",
  minotaur: "minotaurSheet",
};


const FRAME_W = 64;
const FRAME_H = 64;
const FRAMES = 8;


const SEQUENCE = ["devil", "zombie", "minotaur"];
const SEQUENCE_DELAY_FRAMES = 120; 

function makeFramesFromAlias(alias) {
  const sheetTex = Assets.get(alias);
  if (!sheetTex) {
    console.error("Enemy spritesheet not found for alias:", alias);
    return [];
  }

  const frames = [];
  for (let i = 0; i < FRAMES; i++) {
    frames.push(
      new Texture({
        source: sheetTex.source,
        frame: new Rectangle(i * FRAME_W, 0, FRAME_W, FRAME_H),
      })
    );
  }
  return frames;
}

export function createEnemyManager(app, groundY) {
  const enemies = [];

  let sequenceIndex = 0;
  let spawnTimer = 0;

  function spawnNextInSequence() {
    const type = SEQUENCE[sequenceIndex];
    sequenceIndex = (sequenceIndex + 1) % SEQUENCE.length;

    const cfg = ENEMY_CONFIG[type];
    const alias = ENEMY_ALIASES[type];
    if (!cfg || !alias) return;

    const frames = makeFramesFromAlias(alias);
    if (!frames.length) return;

    const sprite = new AnimatedSprite(frames);
    sprite.anchor.set(0.5, 1);
    sprite.animationSpeed = 0.18;
    sprite.loop = true;
    sprite.play();

    sprite.x = app.screen.width + 80;
    sprite.y = groundY;
    sprite.scale.x = -1;
    sprite.zIndex = 2;
    app.stage.addChild(sprite);

    enemies.push({
      type,
      sprite,
      speed: cfg.speed,
      value: ENEMY_VALUES[type],
      alive: true,
      hurtTimer: 0,
    });
  }

  function update(delta) {
    
    const activeAlive = enemies.filter((e) => e.alive).length;

    if (activeAlive === 0) {
      spawnTimer += delta;
      if (spawnTimer >= SEQUENCE_DELAY_FRAMES) {
        spawnTimer = 0;
        spawnNextInSequence();
      }
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];

      if (!e.alive) {
        
        if (e.hurtTimer > 0) {
          e.hurtTimer -= delta;
          e.sprite.alpha = Math.max(0, e.hurtTimer / 15);
          if (e.hurtTimer <= 0) {
            app.stage.removeChild(e.sprite);
            enemies.splice(i, 1);
          }
        }
        continue;
      }

      e.sprite.x -= e.speed;

      if (e.sprite.x < -100) {
        app.stage.removeChild(e.sprite);
        enemies.splice(i, 1);
      }
    }
  }

  function markEnemyKilled(idx) {
    const e = enemies[idx];
    if (!e || !e.alive) return;
    e.alive = false;
    e.hurtTimer = 15;
    // flash
    e.sprite.tint = 0xff5555;
  }

  function removeEnemyImmediately(idx) {
    const e = enemies[idx];
    if (!e) return;
    app.stage.removeChild(e.sprite);
    enemies.splice(idx, 1);
  }

  return {
    enemies,
    update,
    markEnemyKilled,
    removeEnemyImmediately,
  };
}
