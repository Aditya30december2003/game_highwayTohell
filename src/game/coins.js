// game/coins.js
import { Sprite, Assets } from "pixi.js";
import { COIN_CONFIG } from "./constants";


export function createCoinManager(app, groundY) {
  const coins = [];
  let elapsedMs = 0;

  const baseTex = Assets.get("coinTex");
  if (!baseTex) {
    console.warn("coinTex not found in Assets cache");
  } else {
    console.log("coinTex loaded OK");
  }

  function spawnCoin() {
    if (!baseTex) return;

    const sprite = new Sprite(baseTex);
    sprite.anchor.set(0.5);
    sprite.scale.set(0.9);

    
    sprite.x = app.screen.width + 40;
    sprite.y = groundY - 80 - Math.random() * 100;
    sprite.zIndex = 2;

    app.stage.addChild(sprite);

    coins.push({
      sprite,
      value: 1,
    });

    console.log("Spawned coin at", sprite.x, sprite.y);
  }

  
  function update(deltaMs, scrollSpeed) {
    elapsedMs += deltaMs;

    const intervalMs = COIN_CONFIG.spawnInterval;

    
    while (elapsedMs >= intervalMs) {
      elapsedMs -= intervalMs;
      spawnCoin();
    }

    for (let i = coins.length - 1; i >= 0; i--) {
      const c = coins[i];
      c.sprite.x -= scrollSpeed * COIN_CONFIG.speedMultiplier;

      if (c.sprite.x < -60) {
        app.stage.removeChild(c.sprite);
        coins.splice(i, 1);
      }
    }
  }

  function removeCoin(idx) {
    const c = coins[idx];
    if (!c) return;
    app.stage.removeChild(c.sprite);
    coins.splice(idx, 1);
  }

  return {
    coins,
    update,
    removeCoin,
  };
}
