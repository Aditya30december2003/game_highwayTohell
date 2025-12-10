// game/traps.js
import { Sprite, Assets } from "pixi.js";
import { TRAP_CONFIG } from "./constants";

export function createTrapManager(app, groundY) {
  const traps = [];
  let frameCounter = 0;

  const tex = Assets.get("rollerTex");

function spawnTrap() {
  if (!tex) return;

  const sprite = new Sprite(tex);
  sprite.anchor.set(0.5, 1);

  
  const desiredHeight = 60;                
  const scale = desiredHeight / sprite.height;
  sprite.scale.set(scale);

  sprite.x = app.screen.width + 100;
  sprite.y = groundY;                       
  sprite.zIndex = 2;
  app.stage.addChild(sprite);

  traps.push({
    sprite,
    speed: TRAP_CONFIG.rollerSpeed,
  });
}


  function update(delta) {
    frameCounter += delta;
    if (frameCounter >= TRAP_CONFIG.spawnInterval) {
      frameCounter = 0;
      spawnTrap();
    }

    for (let i = traps.length - 1; i >= 0; i--) {
      const t = traps[i];
      t.sprite.x -= t.speed;
      if (t.sprite.x < -120) {
        app.stage.removeChild(t.sprite);
        traps.splice(i, 1);
      }
    }
  }

  return {
    traps,
    update,
  };
}
