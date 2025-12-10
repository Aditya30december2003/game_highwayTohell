import { useState, useEffect, useRef } from "react";
import {
  Application,
  Assets,
  Sprite,
  AnimatedSprite,
  Texture,
  Graphics,
  Container,
} from "pixi.js";

import Planet from "../assets/planet.gif";
import Space from "../assets/space_bg.gif";


import ship1Img from "../assets/Space Pack/Ships/Spaceship_1.png";
import ship2Img from "../assets/Space Pack/Ships/Spaceship_2.png";
import ship3Img from "../assets/Space Pack/Ships/Spaceship_3.png";
import ship4Img from "../assets/Space Pack/Ships/Spaceship_4.png";


import tunnel1Img from "../assets/Space Pack/Turrets/Base_1.png";
import tunnel2Img from "../assets/Space Pack/Turrets/Base_2.png";


import eviEye1Img from "../assets/Space Pack/Enemies/EvilEye_1.png";
import eviEye2Img from "../assets/Space Pack/Enemies/EvilEye_2.png";

import intro from '../assets/sounds/intro.mp3'

const useAudioManager = () => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  
  useEffect(() => {
   
    const audio = new Audio();
    
    
    audio.src = intro;
    
    audio.loop = true;
    audio.volume = 0.3; // 30% volume
    audio.preload = "auto";
    
    audioRef.current = audio;

    // Cleanup
    return () => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, []);

  const playMusic = () => {
    if (audioRef.current && !isPlaying) {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn("Audio playback failed:", err);
          
        });
    }
  };

  const pauseMusic = () => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const stopMusic = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const setVolume = (volume) => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, volume));
    }
  };

  return {
    playMusic,
    pauseMusic,
    stopMusic,
    setVolume,
    isPlaying,
  };
};

function AnimatedBackground() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let destroyed = false;

    const setup = async () => {
      const app = new Application();
      await app.init({
        backgroundAlpha: 0,
        resizeTo: container,
        antialias: true,
        autoDensity: true,
        resolution: window.devicePixelRatio || 1,
      });

      if (destroyed) {
        app.destroy(true, { children: true });
        return;
      }

      container.appendChild(app.canvas);

      
      try {
        await Assets.load([
          { alias: "ship1", src: ship1Img },
          { alias: "ship2", src: ship2Img },
          { alias: "ship3", src: ship3Img },
          { alias: "ship4", src: ship4Img },
          { alias: "tunnel1", src: tunnel1Img },
          { alias: "tunnel2", src: tunnel2Img },
          { alias: "eviEye1", src: eviEye1Img },
          { alias: "eviEye2", src: eviEye2Img },
        ]);
        console.log("✅ All assets loaded successfully");
      } catch (e) {
        console.warn("⚠️ Some assets failed to load", e);
      }

      const elements = [];

      
      const createFallbackSprite = (color = 0xff0000, width = 40, height = 40) => {
        const gfx = new Graphics();
        gfx.rect(-width / 2, -height / 2, width, height);
        gfx.fill({ color });
        gfx.stroke({ color: 0xffffff, width: 2 });
        return gfx;
      };

      
      const createEviEye = (x, y, scale = 0.5) => {
        let sprite;
        try {
          const asset1 = Assets.get("eviEye1");
          const asset2 = Assets.get("eviEye2");
          
          if (asset1?.source && asset2?.source) {
            const frames = [
              new Texture({ source: asset1.source }),
              new Texture({ source: asset2.source }),
            ];
            sprite = new AnimatedSprite(frames);
            sprite.animationSpeed = 0.12;
            sprite.play();
          } else {
            throw new Error("Eye assets missing");
          }
        } catch (e) {
          console.warn("Creating fallback evil eye", e);
          sprite = createFallbackSprite(0xff6600, 50, 50);
        }

        sprite.anchor.set(0.5);
        sprite.x = x;
        sprite.y = y;
        sprite.scale.set(scale);
        sprite.alpha = 1;
        sprite.zIndex = 50;
        app.stage.addChild(sprite);

        const speed = 1.5;
        const amplitude = 60;
        let t = Math.random() * Math.PI * 2;
        const baseY = y;

        elements.push({
          sprite,
          update: (delta) => {
            t += 0.02 * delta;
            sprite.x += speed * delta;
            sprite.y = baseY + Math.sin(t) * amplitude;
            if (sprite.x > app.screen.width + 100) {
              sprite.x = -100;
              sprite.y = app.screen.height * (0.15 + Math.random() * 0.7);
            }
          },
        });
      };

      
      const createShip = (name, yFrac, speed, scale = 0.6) => {
        let sprite;
        try {
          const asset = Assets.get(name);
          if (asset?.source) {
            sprite = new Sprite(asset);
          } else {
            throw new Error(`Ship asset ${name} missing`);
          }
        } catch (e) {
          console.warn(`Creating fallback ship for ${name}`, e);
          sprite = createFallbackSprite(0x00ff88, 60, 40);
        }

        sprite.anchor.set(0.5);
        sprite.y = app.screen.height * yFrac;
        sprite.x = -100;
        sprite.scale.set(scale);
        sprite.alpha = 1;
        sprite.zIndex = 40;
        app.stage.addChild(sprite);

        elements.push({
          sprite,
          update: (delta) => {
            sprite.x += speed * delta;
            sprite.rotation += 0.001 * delta;
            if (sprite.x > app.screen.width + 100) {
              sprite.x = -100;
              sprite.y = app.screen.height * (0.15 + Math.random() * 0.7);
            }
          },
        });
      };

      
      const createTunnel = (name, yFrac, speed, scale = 0.4) => {
        let sprite;
        try {
          const asset = Assets.get(name);
          if (asset?.source) {
            sprite = new Sprite(asset);
          } else {
            throw new Error(`Tunnel asset ${name} missing`);
          }
        } catch (e) {
          console.warn(`Creating fallback tunnel for ${name}`, e);
          sprite = createFallbackSprite(0xff3366, 70, 70);
        }

        sprite.anchor.set(0.5);
        sprite.y = app.screen.height * yFrac;
        sprite.x = -100;
        sprite.scale.set(scale);
        sprite.alpha = 1;
        sprite.zIndex = 30;
        sprite.rotation = Math.random() * Math.PI * 2;
        app.stage.addChild(sprite);

        const rotSpeed = (Math.random() - 0.5) * 0.03;

        elements.push({
          sprite,
          update: (delta) => {
            sprite.x += speed * delta;
            sprite.rotation += rotSpeed * delta;
            if (sprite.x > app.screen.width + 100) {
              sprite.x = -100;
              sprite.y = app.screen.height * (0.15 + Math.random() * 0.7);
              sprite.rotation = Math.random() * Math.PI * 2;
            }
          },
        });
      };

      
      const stars = [];
      for (let i = 0; i < 80; i++) {
        const star = new Graphics();
        const size = Math.random() * 2 + 0.8;
        star.circle(0, 0, size);
        star.fill({ color: 0xffffff });
        star.x = Math.random() * app.screen.width;
        star.y = Math.random() * app.screen.height;
        star.alpha = 0.5 + Math.random() * 0.5;
        star.zIndex = 5;
        app.stage.addChild(star);
        stars.push({
          sprite: star,
          baseAlpha: star.alpha,
          twinkleSpeed: 0.005 + Math.random() * 0.01,
        });
      }

      
      createShip("ship1", 0.15, 2.2, 0.6);
      createShip("ship2", 0.32, 1.8, 0.65);
      createShip("ship3", 0.52, 2.0, 0.7);
      createShip("ship4", 0.72, 2.4, 0.55);

      
      createTunnel("tunnel1", 0.25, 1.1, 0.4);
      createTunnel("tunnel2", 0.50, 1.3, 0.45);
      createTunnel("tunnel1", 0.70, 0.9, 0.38);

      // Place evil eyes
      createEviEye(app.screen.width * 0.2, app.screen.height * 0.25, 0.5);
      createEviEye(app.screen.width * 0.6, app.screen.height * 0.50, 0.45);
      createEviEye(app.screen.width * 0.35, app.screen.height * 0.68, 0.5);

      const tick = (delta) => {
        elements.forEach((e) => e.update?.(delta));
        
        stars.forEach((starObj) => {
          starObj.sprite.alpha =
            starObj.baseAlpha +
            Math.sin(Date.now() * starObj.twinkleSpeed) * 0.3;
        });

        app.stage.sortableChildren = true;
      };

      app.ticker.add(tick);

      return () => {
        app.ticker.remove(tick);
        elements.forEach((e) => {
          if (e.sprite && !e.sprite.destroyed) app.stage.removeChild(e.sprite);
        });
        stars.forEach((s) => {
          if (s.sprite && !s.sprite.destroyed) app.stage.removeChild(s.sprite);
        });
        app.destroy(true, { children: true });
      };
    };

    let cleanup;
    setup().then((fn) => {
      cleanup = fn;
    });

    return () => {
      destroyed = true;
      if (cleanup) cleanup();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-0"
    />
  );
}

export default function RetroHome() {
  const [showGame, setShowGame] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const audioManager = useAudioManager();

  
  useEffect(() => {
    
    audioManager.playMusic();
    
   
    const timeout = setTimeout(() => {
      if (!audioManager.isPlaying) {
        console.log("Music autoplay blocked - showing manual play button");
      } else {
        setMusicEnabled(true);
      }
    }, 1000);

    return () => {
      clearTimeout(timeout);
      audioManager.stopMusic();
    };
  }, []);

  const toggleMusic = () => {
    if (musicEnabled) {
      audioManager.pauseMusic();
    } else {
      audioManager.playMusic();
    }
    setMusicEnabled(!musicEnabled);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    audioManager.setVolume(newVolume);
  };

  const handleNewGame = () => {
    
    audioManager.stopMusic();
    setShowGame(true);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      
      <div
        className="fixed inset-0 bg-cover bg-center -z-30"
        style={{ backgroundImage: `url(${Space})` }}
      />

      
      <AnimatedBackground />

      
      <div className="fixed top-4 right-4 z-30 flex items-center gap-3">
        
        <button
          onClick={toggleMusic}
          className="p-3 rounded-full bg-black/70 backdrop-blur-sm border border-amber-400/30 hover:border-amber-400 transition-all group"
          title={musicEnabled ? "Pause Music" : "Play Music"}
        >
          <svg
            className={`w-6 h-6 ${musicEnabled ? 'text-amber-400' : 'text-gray-400'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {musicEnabled ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.536 8.464a5 5 0 010 7.072M9 12h6m5 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
              />
            )}
          </svg>
        </button>

        
        <div className="hidden group-hover:flex items-center gap-2 bg-black/70 backdrop-blur-sm px-4 py-2 rounded-full border border-amber-400/30">
          <svg
            className="w-5 h-5 text-amber-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.536 8.464a5 5 0 010 7.072M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m5 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            className="w-24 accent-amber-400"
          />
          <span className="text-amber-300 text-sm font-mono">
            {Math.round(volume * 100)}%
          </span>
        </div>
      </div>

      
      <div className="relative z-20 flex flex-col items-center justify-center min-h-screen px-4">
        <div className="relative max-w-[420px] w-full flex flex-col items-center">
          {/* Glow rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[18rem] h-[18rem] md:w-[22rem] md:h-[22rem] rounded-full border-4 border-amber-400/25 blur-lg" />
            <div className="absolute w-[22rem] h-[22rem] md:w-[26rem] md:h-[26rem] rounded-full border-2 border-orange-500/15 blur-xl" />
          </div>

          
          <img
            src={Planet}
            alt="Planet"
            className="relative w-[14rem] h-[14rem] md:w-[18rem] md:h-[18rem] object-contain drop-shadow-[0_0_35px_rgba(251,191,36,0.9)] animate-float"
          />

          
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
            <h1 className="font-pixel-game font-bold leading-none tracking-wide mb-4 text-4xl sm:text-5xl md:text-6xl">
              <span className="block font-pixel-game text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.9)]">
                HIGHWAY
              </span>
              <span className="block font-pixel-game text-green-700 drop-shadow-[0_0_20px_rgba(239,68,68,0.9)] mt-1">
                TO
              </span>
              <span className="block font-pixel-game  text-amber-400 drop-shadow-[0_0_25px_rgba(251,191,36,1)] mt-1">
                HELL…
              </span>
            </h1>

            <button
              onClick={handleNewGame}
              className="mt-5 px-8 py-3 rounded-2xl font-pixel-game font-bold text-xl sm:text-2xl bg-gradient-to-r from-red-700 via-orange-600 to-amber-500 text-white border-2 border-amber-300/60 shadow-[0_0_35px_rgba(239,68,68,0.8)] transition-transform transition-shadow duration-300 hover:scale-110 hover:shadow-[0_0_55px_rgba(239,68,68,1)] active:scale-95 animate-bounce-slow"
            >
              <a href="/game" className="font-pixel-game">PLAY THE GAME</a>
            </button>
          </div>
        </div>

        
        <div className="mt-12 text-center space-y-1">
          <p className="font-pixel-game text-sm sm:text-base md:text-lg text-amber-300/80 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]">
            ← → MOVE • SPACE JUMP • J SLASH
          </p>
          <p className="font-pixel-game text-xs sm:text-sm text-gray-400">
            Dodge the logs • Slice the demons • Stack those coins
          </p>
          
         
          {!musicEnabled && (
            <p className="mt-2 font-pixel-game text-xs text-amber-400/60">
              🔊 Click the music icon to enable soundtrack
            </p>
          )}
        </div>
      </div>

     

     
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-16px); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-bounce-slow {
          animation: bounce-slow 2.2s ease-in-out infinite;
        }
        
        /* Custom range slider styling */
        input[type="range"] {
          -webkit-appearance: none;
          background: transparent;
        }
        
        input[type="range"]::-webkit-slider-runnable-track {
          height: 4px;
          background: linear-gradient(90deg, rgba(251,191,36,0.3) 0%, rgba(251,191,36,1) 100%);
          border-radius: 2px;
        }
        
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #fbbf24;
          border: 2px solid #ffffff;
          cursor: pointer;
          margin-top: -6px;
        }
      `}</style>
    </div>
  );
}