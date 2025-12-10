// game/hero.js
import { AnimatedSprite, Rectangle, Texture } from "pixi.js";
import { GAME_CONFIG, HERO_SPRITE_CONFIG, HERO_STATES } from "./constants";

function createAnimationFrames(sheetTex, name) {
  const { frameWidth, frameHeight, animationRows, framesPerAnimation } =
    HERO_SPRITE_CONFIG;

  const rowIndex = animationRows[name];
  const frameCount = framesPerAnimation[name];

  const frames = [];
  for (let i = 0; i < frameCount; i++) {
    frames.push(
      new Texture({
        source: sheetTex.source,
        frame: new Rectangle(
          i * frameWidth,
          rowIndex * frameHeight,
          frameWidth,
          frameHeight
        ),
      })
    );
  }
  return frames;
}

export function createHero(app, groundY, heroSheetTexture, audio) {
  const heroAnimations = {
    idle: new AnimatedSprite(createAnimationFrames(heroSheetTexture, "idle")),
    run: new AnimatedSprite(createAnimationFrames(heroSheetTexture, "run")),
    jump: new AnimatedSprite(createAnimationFrames(heroSheetTexture, "run")),
    attack: new AnimatedSprite(createAnimationFrames(heroSheetTexture, "slash")),
  };

  Object.entries(heroAnimations).forEach(([key, sprite]) => {
    sprite.anchor.set(0.5, 1);
    sprite.loop = key !== "attack";
    sprite.animationSpeed =
      key === "idle" ? 0.1 : key === "attack" ? 0.25 : 0.15;
    sprite.visible = false;
    sprite.zIndex = 2;
    app.stage.addChild(sprite);
  });

  let active = heroAnimations.idle;
  active.visible = true;
  active.play();
  active.x = app.screen.width * 0.15;
  active.y = groundY;

  const state = {
    sprite: active,
    vy: 0,
    onGround: true,
    facing: 1,
    logicState: HERO_STATES.IDLE,
    attackTimer: 0,
    isAttacking: false,
    isDead: false,
  };

  function switchState(next) {
    if (state.logicState === next || state.isDead) return;

    const old = state.sprite;
    const nextSprite =
      next === HERO_STATES.JUMP
        ? heroAnimations.jump
        : next === HERO_STATES.ATTACK
        ? heroAnimations.attack
        : next === HERO_STATES.RUN
        ? heroAnimations.run
        : heroAnimations.idle;

    nextSprite.x = old.x;
    nextSprite.y = old.y;
    nextSprite.scale.x = state.facing;
    nextSprite.scale.y = 1;

    old.visible = false;
    old.stop();

    nextSprite.visible = true;
    nextSprite.play();
    if (next === HERO_STATES.ATTACK) nextSprite.gotoAndPlay(0);

    state.sprite = nextSprite;
    state.logicState = next;

    if (next === HERO_STATES.ATTACK) {
      state.isAttacking = true;
      state.attackTimer = 14;
      audio.playAttack && audio.playAttack();
    }
    if (next === HERO_STATES.JUMP) {
      audio.playJump && audio.playJump();
    }
  }

  function killHero() {
    if (state.isDead) return;
    state.isDead = true;
    state.isAttacking = false;
    audio.playHurt && audio.playHurt();
  }

  function update(delta, keys, context) {
    if (state.isDead) return { dead: true, scoreDelta: 0 };

    const baseMove = GAME_CONFIG.heroSpeed;
    let vx = 0;

    if (!state.isAttacking) {
      if (keys["ArrowLeft"] || keys["KeyA"]) vx -= baseMove;
      if (keys["ArrowRight"] || keys["KeyD"]) vx += baseMove;

      state.sprite.x += vx;
      state.sprite.x = Math.max(
        40,
        Math.min(app.screen.width - 40, state.sprite.x)
      );

      if (vx !== 0) {
        state.facing = vx > 0 ? 1 : -1;
        state.sprite.scale.x = state.facing;
      }
    }

    
    state.vy += GAME_CONFIG.gravity;
    state.sprite.y += state.vy;

    if (state.sprite.y >= groundY) {
      state.sprite.y = groundY;
      state.vy = 0;
      state.onGround = true;
    } else {
      state.onGround = false;
    }

   
    if (state.attackTimer > 0) {
      state.attackTimer -= delta;
      if (state.attackTimer <= 0) {
        state.isAttacking = false;
      }
    }

    let scoreDelta = 0;

    
    context.coins.forEach((coin, idx) => {
      if (hitCircle(state.sprite, coin.sprite, 30)) {
        scoreDelta += coin.value;
        context.removeCoin(idx);
      }
    });

    
    context.enemies.forEach((enemy, idx) => {
      if (!enemy.alive) return;
      if (hitCircle(state.sprite, enemy.sprite, 40)) {
        if (state.isAttacking) {
          audio.playKill && audio.playKill();
          scoreDelta += enemy.value;
          context.markEnemyKilled(idx);
        } else {
          killHero();
        }
      }
    });

    
    context.traps.forEach((trap) => {
      if (hitCircle(state.sprite, trap.sprite, 35)) {
        killHero();
      }
    });

    
    if (!state.isDead && !state.isAttacking) {
      if (!state.onGround) {
        switchState(HERO_STATES.JUMP);
      } else if (vx !== 0) {
        switchState(HERO_STATES.RUN);
      } else {
        switchState(HERO_STATES.IDLE);
      }
    }

    return { dead: state.isDead, scoreDelta };
  }

  function onKeyDown(e) {
    if (state.isDead) return;

    if ((e.code === "Space" || e.code === "ArrowUp") && state.onGround) {
      e.preventDefault();
      state.vy = GAME_CONFIG.jumpVelocity;
      state.onGround = false;
      switchState(HERO_STATES.JUMP);
    }

    if (e.code === "KeyJ" && state.onGround && !state.isAttacking) {
      switchState(HERO_STATES.ATTACK);
    }
  }

  function onPointerDown() {
    if (state.isDead) return;
    if (state.onGround && !state.isAttacking) {
      state.vy = GAME_CONFIG.jumpVelocity;
      state.onGround = false;
      switchState(HERO_STATES.JUMP);
    }
  }

  return {
    update,
    onKeyDown,
    onPointerDown,
  };
}

function hitCircle(aSprite, bSprite, radius) {
  const ax = aSprite.x;
  const ay = aSprite.y - aSprite.height / 2;

  const bx = bSprite.x;
  const by = bSprite.y - bSprite.height / 2;

  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy < radius * radius;
}
