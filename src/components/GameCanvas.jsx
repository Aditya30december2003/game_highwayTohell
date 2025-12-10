import { useEffect, useRef, useState } from "react";
import { Application, Assets, Graphics, Sprite } from "pixi.js";
import heroSpriteSheet from "../assets/hero.png";
import farMountainsImg from "../assets/far-mountains.png";
import midMountainsImg from "../assets/mountains.png";
import nearMountainsImg from "../assets/near-clouds.png";
import treesImg from "../assets/trees.png";
import skyImg from "../assets/sky.png";
import blanksky from "../assets/blanksky.png";
import coinImg from "../assets/coin.png";
import rollerImg from "../assets/unavoidable_roller/unavoidable_spikes_just_roller_01.png";
import landImg from '../assets/land.png'
import zombieImg from "../assets/Zombie.png";
import devilImg from "../assets/Devil.png";
import minotaurImg from "../assets/Minotaur.png";
import homeImg from '../assets/home.png'

import { GAME_CONFIG } from "../game/constants";
import { createAudioManager } from "../game/audio";
import { createHero } from "../game/hero";
import { createEnemyManager } from "../game/enemies";
import { createCoinManager } from "../game/coins";
import { createTrapManager } from "../game/traps"

export default function GameCanvas() {
  const wrapperRef = useRef(null);
  const appRef = useRef(null);
  const [assetsReady, setAssetsReady] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [runId, setRunId] = useState(0);
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      await Assets.load([
        { alias: "farMountains", src: farMountainsImg },
        { alias: "midMountains", src: midMountainsImg },
        { alias: "nearMountains", src: nearMountainsImg },
        { alias: "trees", src: treesImg },
        { alias: "sky", src: skyImg },
        { alias: "blanksky", src: blanksky },
        { alias: "heroSpriteSheet", src: heroSpriteSheet },
        { alias: "zombieSheet", src: zombieImg },
        { alias: "devilSheet", src: devilImg },
        { alias: "minotaurSheet", src: minotaurImg },
        { alias: "coinTex", src: coinImg },
        { alias: "rollerTex", src: rollerImg },
        { alias: "land", src: landImg },
        { alias: "home", src: homeImg },
      ]);

      if (!cancelled) setAssetsReady(true);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper || !assetsReady) return;

    let destroyed = false;

    const setup = async () => {
      const app = new Application();
      await app.init({
        backgroundAlpha: 1,
        backgroundColor: 0x020617,
        resizeTo: window,
        antialias: true,
        autoDensity: true,
        resolution: window.devicePixelRatio || 1,
      });

      if (destroyed) {
        app.destroy(true, { children: true });
        return;
      }

      appRef.current = app;
      wrapper.appendChild(app.canvas);
      app.stage.sortableChildren = true;

      const width = app.screen.width;
      const height = app.screen.height;
      const groundY = height * GAME_CONFIG.groundHeightRatio;

      const audio = createAudioManager();
      audio.startMusic();

      // sky (single moon)
      const skyTex = Assets.get("sky");
      const skySprite = new Sprite(skyTex);
      skySprite.anchor.set(0.5, 1);
      skySprite.x = width / 2;
      skySprite.y = groundY;
      skySprite.zIndex = -6;
      app.stage.addChild(skySprite);

      // parallax layers
      function createTiledLayer(alias, speedFactor, zIndex) {
        const tex = Assets.get(alias);
        if (!tex) return null;

        const texWidth = tex.width;
        const screenWidth = app.screen.width;
        const tiles = Math.ceil(screenWidth / texWidth) + 1;
        const sprites = [];

        for (let i = 0; i < tiles; i++) {
          const s = new Sprite(tex);
          s.y = groundY - s.height;
          s.x = i * texWidth;
          s.zIndex = zIndex;
          app.stage.addChild(s);
          sprites.push(s);
        }

        return { sprites, speedFactor, texWidth, tiles };
      }

      const layers = [
        createTiledLayer("farMountains", 0.2, -5),
        createTiledLayer("midMountains", 0.5, -4),
        createTiledLayer("nearMountains", 0.9, -6),
        createTiledLayer("trees", 1.1, -2),
        createTiledLayer("blanksky", 1.8, -10),
      ].filter(Boolean);

      // Static land at bottom
      const landTex = Assets.get("land");
      if (landTex) {
        const landSprite = new Sprite(landTex);

        // bottom center anchor so easily stick it to canvas bottom
        landSprite.anchor.set(0.5, 1);
        landSprite.x = width / 2;
        landSprite.y = height; // bottom of canvas

        // scale to full canvas width while keeping aspect ratio
        const landScale = width / landTex.width;
        landSprite.scale.set(landScale);

        landSprite.zIndex = -1; // above far background, below hero/ground
        app.stage.addChild(landSprite);
      }

      // ground
      const ground = new Graphics();
      ground.rect(0, groundY, width, height - groundY);
      ground.fill({ color: 0x0120701 });
      ground.zIndex = 0;
      app.stage.addChild(ground);

      const groundLine = new Graphics();
      groundLine.setStrokeStyle({ width: 3, color: 0x07de1d });
      groundLine.moveTo(0, groundY);
      groundLine.lineTo(width, groundY);
      groundLine.stroke();
      groundLine.zIndex = 1;
      app.stage.addChild(groundLine);

      // game entities
      const heroSheetTexture = Assets.get("heroSpriteSheet");
      const hero = createHero(app, groundY, heroSheetTexture, audio);
      const enemyManager = createEnemyManager(app, groundY);
      const coinManager = createCoinManager(app, groundY);
      const trapManager = createTrapManager(app, groundY);

      const keys = {};

      const onKeyDown = (e) => {
        keys[e.code] = true;
        hero.onKeyDown(e);
      };
      const onKeyUp = (e) => {
        keys[e.code] = false;
      };
      const onPointerDown = () => {
        hero.onPointerDown();
      };

      window.addEventListener("keydown", onKeyDown);
      window.addEventListener("keyup", onKeyUp);
      wrapper.addEventListener("pointerdown", onPointerDown);

      const loop = (delta) => {
        if (destroyed || gameOver) return;

        const scrollSpeed = GAME_CONFIG.baseScrollSpeed;
        const deltaMs = app.ticker.deltaMS; 

        
        layers.forEach((layer) => {
          const move = scrollSpeed * layer.speedFactor;
          layer.sprites.forEach((s) => {
            s.x -= move;
            if (s.x <= -layer.texWidth) {
              s.x += layer.texWidth * layer.tiles;
            }
          });
        });

        enemyManager.update(delta);                 
        coinManager.update(deltaMs, scrollSpeed);   
        trapManager.update(deltaMs);               

        const result = hero.update(delta, keys, {
          enemies: enemyManager.enemies,
          markEnemyKilled: enemyManager.markEnemyKilled,
          removeEnemy: enemyManager.removeEnemyImmediately,
          coins: coinManager.coins,
          removeCoin: coinManager.removeCoin,
          traps: trapManager.traps,
        });

        if (result.scoreDelta) {
          setScore((prev) => prev + result.scoreDelta);
        }

        if (result.dead && !gameOver) {
          setGameOver(true);
          audio.stopMusic();
        }
      };

      app.ticker.add(loop);

      return () => {
        app.ticker.remove(loop);
        audio.stopMusic();
        window.removeEventListener("keydown", onKeyDown);
        window.removeEventListener("keyup", onKeyUp);
        wrapper.removeEventListener("pointerdown", onPointerDown);
        app.destroy(true, { children: true });
      };
    };

    const cleanupPromise = setup();

    return () => {
      destroyed = true;
      if (cleanupPromise) {
        cleanupPromise.then?.(() => {});
      }
    };
  }, [assetsReady, runId, gameOver]);

  const handleRestart = () => {
    window.location.reload()
    setScore(0);
    setGameOver(false);
    setRunId((id) => id + 1); 
  };

  return (
  <>
    <div
      ref={wrapperRef}
      className="fixed inset-0 w-screen h-screen overflow-hidden bg-[#020617] z-0"
    />
    
    
    <div className="fixed top-0 left-0 w-full z-10 pointer-events-none">
      <div className="w-full max-w-6xl mx-auto px-4 pt-6">
       
        <div className="flex items-center justify-between mb-8">
          
          <div className="flex items-center gap-3 pointer-events-auto">
            <a 
              href="/" 
              className="bg-black/70 hover:bg-black/90 backdrop-blur-sm p-3 rounded-xl border-2 border-red-500/50 hover:border-red-500 transition-all duration-200 flex items-center gap-2 group"
            >
              <img 
                src={homeImg} 
                alt="Home" 
                className="w-10 h-10 object-contain" 
                onError={(e) => {
                  console.error("Failed to load home image");
                  e.target.style.display = 'none';
                }}
              />
              <span className="text-white font-pixel-game text-lg hidden sm:block group-hover:text-red-300 transition-colors">
                Home
              </span>
            </a>
          </div>

         
          <div className="text-center flex-1">
            <h1 className="font-pixel-game flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 font-bold leading-none tracking-wide text-3xl sm:text-4xl md:text-6xl">
              <span className="text-orange-500 font-pixel-game font-bold drop-shadow-[0_0_15px_rgba(255,255,255,0.9)]">
                HIGHWAY
              </span>
              <span className="text-yellow-500 font-pixel-game font-bold drop-shadow-[0_0_20px_rgba(239,68,68,0.9)]">
                TO
              </span>
              <span className="text-orange-600 font-pixel-game font-bold drop-shadow-[0_0_25px_rgba(251,191,36,1)]">
                HELL…
              </span>
            </h1>
          </div>

         
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/70 text-yellow-300 font-semibold text-lg pointer-events-auto">
            <div className="inline-flex items-center gap-1">
              <span
                className="inline-block h-5 w-5 bg-no-repeat [image-rendering:pixelated] animate-coin-spin"
                style={{ backgroundImage: `url(${coinImg})` }}
              />
              <span>{score * 5}</span>
            </div>
          </div>
        </div>

        
        <div className="text-center mt-4">
          <p className="text-slate-300 font-pixel-game text-sm sm:text-base">
            Use <span className="text-yellow-400">SPACE or TAP</span> to jump • Avoid hurdles and collect coins🔥🔥🔥
          </p>
        </div>
      </div>
    </div>

    
    {/* 
    <div className="fixed top-4 left-4 flex items-center gap-2 z-20 px-6 py-3 rounded-full bg-black/80 text-yellow-300 font-semibold text-xl pointer-events-auto">
      <div className="inline-flex items-center gap-1">
        <span
          className="inline-block h-4 w-4 bg-no-repeat [image-rendering:pixelated] animate-coin-spin"
          style={{ backgroundImage: `url(${coinImg})` }}
        />
        <span>{score*5}</span>
      </div>
    </div>
    */}

    {/* Game Over overlay */}
    {gameOver && (
      <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/70 pointer-events-auto">
        <div className="bg-slate-900 rounded-2xl px-10 py-8 text-center shadow-2xl border border-slate-700">
          <h2 className="text-3xl font-pixel-game font-bold text-red-400 mb-4">
            GAME OVER
          </h2>
          <p className="text-slate-300 mx-auto mb-6 text-lg">
            <span
              className="inline-block h-4 text-[1.3rem] w-4 bg-no-repeat [image-rendering:pixelated] animate-coin-spin"
              style={{ backgroundImage: `url(${coinImg})` }}
            /> 
            <span>Final Score: {score * 5}</span>
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={handleRestart}
              className="px-6 py-3 text-[1.3rem] font-pixel-game rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold text-lg transition-colors"
            >
              Restart
            </button>
            <a
              href="/"
              className="px-6 py-3 text-[1.3rem] font-pixel-game rounded-full bg-blue-500 hover:bg-blue-400 text-slate-900 font-semibold text-lg transition-colors flex items-center gap-2"
            >
              <img 
                src={homeImg} 
                alt="Home" 
                className="w-6 h-6 object-contain" 
              />
              Main Menu
            </a>
          </div>
        </div>
      </div>
    )}
  </>
);
}