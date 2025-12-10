import attackSfx from "../assets/sounds/attack.ogg";
import hurtSfx from "../assets/sounds/hurt.ogg";
import jumpSfx from "../assets/sounds/jump.ogg";
import killSfx from "../assets/sounds/kill.ogg";
import riseSfx from "../assets/sounds/rise.ogg";

import bgLoop from "../assets/sounds/intro.mp3";

export function createAudioManager() {
  const bg = new Audio(bgLoop);
  bg.loop = true;
  bg.volume = 0.4;

  const sounds = {
    attack: new Audio(attackSfx),
    hurt: new Audio(hurtSfx),
    jump: new Audio(jumpSfx),
    kill: new Audio(killSfx),
    rise: new Audio(riseSfx),
  };

  const play = (key) => {
    const a = sounds[key];
    if (!a) return;
    a.currentTime = 0;
    a.play().catch(() => {});
  };

  return {
    startMusic() {
      bg.currentTime = 0;
      bg.play().catch(() => {});
    },
    stopMusic() {
      bg.pause();
    },
    playAttack() {
      play("attack");
    },
    playHurt() {
      play("hurt");
    },
    playJump() {
      play("jump");
    },
    playKill() {
      play("kill");
    },
    playRise() {
      play("rise");
    },
  };
}
