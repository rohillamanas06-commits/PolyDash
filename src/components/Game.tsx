import { useState, useEffect, useRef } from 'react';
import { Pause, Play } from 'lucide-react';

interface GameProps {
  characterImage: string;
  onExit: () => void;
}

interface Hurdle {
  id: number;
  lane: number;
  y: number; // 0 to 100 representing percentage from top
}

const HURDLE_SPEED = 1.0; // slightly slower for 3D perspective
const SPAWN_RATE = 50; 

const playSound = (type: 'move' | 'crash' | 'score') => {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return;
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  if (type === 'move') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } else if (type === 'crash') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } else if (type === 'score') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.setValueAtTime(800, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  }
};

export default function Game({ characterImage, onExit }: GameProps) {
  const [lane, setLane] = useState(1);
  const [hurdles, setHurdles] = useState<Hurdle[]>([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const requestRef = useRef<number>(0);
  const frameCount = useRef(0);
  const hurdleIdCounter = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Keep the game container focused so it can receive keyboard events
    containerRef.current?.focus();
  }, [isPaused, gameOver]);

  const gameState = useRef({
    lane: 1,
    hurdles: [] as Hurdle[],
    gameOver: false,
    isPaused: false,
    score: 0,
  });

  useEffect(() => {
    gameState.current.lane = lane;
    gameState.current.gameOver = gameOver;
    gameState.current.isPaused = isPaused;
  }, [lane, gameOver, isPaused]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
      e.stopPropagation();
      if (e.repeat) return;
      
      if (!gameOver) {
        setIsPaused((prev) => !prev);
      }
      return;
    }

    if (gameOver || isPaused) return;
    if (e.key === 'ArrowLeft' || e.key === 'a') {
      setLane((prev) => {
        if (prev > 0) playSound('move');
        return Math.max(0, prev - 1);
      });
    } else if (e.key === 'ArrowRight' || e.key === 'd') {
      setLane((prev) => {
        if (prev < 2) playSound('move');
        return Math.min(2, prev + 1);
      });
    }
  };

  const resetGame = () => {
    setLane(1);
    setHurdles([]);
    setScore(0);
    setGameOver(false);
    setIsPaused(false);
    frameCount.current = 0;
    gameState.current = { lane: 1, hurdles: [], gameOver: false, isPaused: false, score: 0 };
  };

  const gameLoop = () => {
    if (gameState.current.gameOver || gameState.current.isPaused) return;

    frameCount.current++;
    
    if (frameCount.current % SPAWN_RATE === 0) {
      const newLane = Math.floor(Math.random() * 3);
      gameState.current.hurdles.push({
        id: hurdleIdCounter.current++,
        lane: newLane,
        y: -10,
      });
    }

    gameState.current.hurdles = gameState.current.hurdles.map(h => ({
      ...h,
      y: h.y + HURDLE_SPEED + (gameState.current.score / 2000)
    })).filter(h => h.y < 120);

    const playerLane = gameState.current.lane;
    const playerTop = 85; 
    const playerBottom = 100;

    let crashed = false;
    for (const h of gameState.current.hurdles) {
      if (h.lane === playerLane) {
        const hurdleTop = h.y;
        const hurdleBottom = h.y + 10;
        
        if (hurdleBottom > playerTop && hurdleTop < playerBottom) {
          crashed = true;
          break;
        }
      }
    }

    if (crashed) {
      playSound('crash');
      setGameOver(true);
      gameState.current.gameOver = true;
    } else {
      gameState.current.score += 1;
      if (gameState.current.score % 1000 === 0) {
        playSound('score');
      }
      setHurdles([...gameState.current.hurdles]);
      setScore(Math.floor(gameState.current.score / 10));
      requestRef.current = requestAnimationFrame(gameLoop);
    }
  };

  useEffect(() => {
    if (!gameOver && !isPaused) {
      requestRef.current = requestAnimationFrame(gameLoop);
    }
    return () => cancelAnimationFrame(requestRef.current!);
  }, [gameOver, isPaused]);

  const handleTouchLeft = () => {
    if (gameState.current.gameOver || gameState.current.isPaused) return;
    setLane(prev => {
      if (prev > 0) playSound('move');
      return Math.max(0, prev - 1);
    });
  };
  const handleTouchRight = () => {
    if (gameState.current.gameOver || gameState.current.isPaused) return;
    setLane(prev => {
      if (prev < 2) playSound('move');
      return Math.min(2, prev + 1);
    });
  };

  return (
    <div 
      ref={containerRef}
      tabIndex={0}
      onKeyDownCapture={handleKeyDown}
      className="relative w-full h-screen overflow-hidden font-anton select-none touch-none bg-cover bg-center bg-no-repeat outline-none"
      style={{ backgroundImage: 'url(/overcast.png)' }}
    >
      <style>{`
        @keyframes pan-bg {
          from { background-position: 0 -100px; }
          to { background-position: 0 0; }
        }
      `}</style>

      {/* 3D Track Container */}
      <div 
        className="absolute inset-x-0 bottom-0 h-full w-full pointer-events-none" 
        style={{ perspective: '800px', transformStyle: 'preserve-3d' }}
      >
        <div 
          className="absolute bottom-0 w-[160%] -left-[30%] h-[200%] origin-bottom"
          style={{ 
            transform: 'rotateX(65deg)', 
            transformStyle: 'preserve-3d' 
          }}
        >





          {/* 3D Realistic Hurdles */}
          {hurdles.map(h => (
            <div
              key={h.id}
              className="absolute w-[24%] flex flex-col justify-end items-center z-10"
              style={{
                height: '15%',
                left: `calc(${h.lane * 33.33}% + 4.66%)`,
                top: `${h.y}%`,
                // Rotate back to stand up perfectly towards camera
                transform: 'rotateX(-65deg) translateY(-50%)',
                transformOrigin: 'bottom center',
                transition: 'none'
              }}
            >
              {/* Barricade Board */}
              <div className="w-full h-[40%] bg-white border-[3px] border-orange-500 rounded-sm relative overflow-hidden shadow-2xl mb-1">
                <div 
                  className="absolute inset-0 opacity-90"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(45deg, #f97316, #f97316 20px, #ffffff 20px, #ffffff 40px)'
                  }}
                />
              </div>
              {/* Barricade Legs */}
              <div className="flex w-full justify-between px-[15%] h-[60%]">
                <div className="w-[15%] h-full bg-gray-900 rounded-t-sm shadow-lg border-x border-gray-700" />
                <div className="w-[15%] h-full bg-gray-900 rounded-t-sm shadow-lg border-x border-gray-700" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Player Character */}
      <div 
        className="absolute bottom-[2%] w-[25%] h-[35%] flex items-end justify-center transition-all duration-200 ease-out z-20"
        style={{ left: `calc(${lane * 33.33}% + 4.16%)` }}
      >
        <img 
          src={characterImage} 
          alt="Player" 
          className="h-full object-contain filter drop-shadow-[0_20px_30px_rgba(0,0,0,0.8)]"
          draggable={false}
        />
      </div>



      {/* UI Overlay */}
      <div className="absolute top-6 left-6 sm:left-10 z-30">
        <div className="text-white text-3xl sm:text-5xl tracking-wide opacity-90 drop-shadow-md">
          SCORE: {score}
        </div>
      </div>
      
      <button 
        onClick={(e) => { setIsPaused(!isPaused); e.currentTarget.blur(); }}
        className="absolute top-6 right-6 sm:right-10 z-30 flex items-center justify-center w-12 h-12 rounded-full border-2 border-white/50 text-white hover:bg-white hover:text-black transition-colors backdrop-blur-sm"
      >
        {isPaused ? <Play size={24} /> : <Pause size={24} />}
      </button>



      {/* Mobile Controls (Invisible Tap Zones) */}
      <div className="absolute bottom-0 inset-x-0 h-2/3 flex z-30 sm:hidden">
        <div className="flex-1" onTouchStart={handleTouchLeft} onClick={handleTouchLeft} />
        <div className="flex-1" onTouchStart={handleTouchRight} onClick={handleTouchRight} />
      </div>

      {/* Game Over Screen */}
      {gameOver && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-md">
          <div className="text-center px-4">
            <h2 className="text-6xl sm:text-8xl text-red-500 mb-2 uppercase tracking-wider font-bold drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]">
              CRASHED!
            </h2>
            <p className="text-2xl sm:text-3xl text-slate-300 mb-10 font-sans font-medium">Final Score: {score}</p>
            <div className="flex flex-col gap-4 sm:flex-row justify-center">
              <button 
                onClick={resetGame}
                className="px-8 py-4 bg-white text-black text-2xl rounded-full hover:scale-105 transition-transform uppercase"
              >
                PLAY AGAIN
              </button>
              <button 
                onClick={(e) => { onExit(); e.currentTarget.blur(); }}
                className="px-8 py-4 bg-transparent border-2 border-white text-white text-xl rounded-full hover:bg-white/10 transition-colors uppercase font-sans font-semibold"
              >
                BACK TO MENU
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Pause Screen */}
      {isPaused && !gameOver && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-md">
          <div className="text-center px-4">
            <h2 className="text-6xl sm:text-8xl text-white mb-10 uppercase tracking-wider font-bold">
              PAUSED
            </h2>
            <div className="flex flex-col gap-4 sm:flex-row justify-center">
              <button 
                onClick={(e) => { setIsPaused(false); e.currentTarget.blur(); }}
                className="px-8 py-4 bg-white text-black text-2xl rounded-full hover:scale-105 transition-transform uppercase"
              >
                RESUME
              </button>
              <button 
                onClick={onExit}
                className="px-8 py-4 bg-transparent border-2 border-white text-white text-xl rounded-full hover:bg-white/10 transition-colors uppercase font-sans font-semibold"
              >
                QUIT GAME
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
