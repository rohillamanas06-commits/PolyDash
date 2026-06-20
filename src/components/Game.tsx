import React, { useState, useEffect, useRef } from 'react';
import { Pause, Play } from 'lucide-react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { Plane, Box, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { playSound } from '../lib/audio';

interface GameProps {
  characterImage: string;
  bgColor: string;
  onExit: () => void;
}

interface Hurdle {
  id: number;
  lane: number; // 0, 1, 2
  z: number;
}

const HURDLE_SPEED = 0.6;
const SPAWN_RATE = 40;
const LANE_WIDTH = 5.0;

const HORIZON_PCT = 38;

function ResponsiveCamera() {
  const { camera, size } = useThree();

  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      const aspect = size.width / size.height;
      if (aspect < 0.8) {
        // Mobile portrait: Wider FOV and move camera back to fully fit the character
        camera.fov = 80;
        camera.position.set(0, 7, 16);
      } else {
        // Desktop landscape
        camera.fov = 60;
        camera.position.set(0, 5, 10);
      }
      camera.updateProjectionMatrix();
    }
  }, [camera, size]);

  return null;
}

interface GameSceneProps {
  characterImage: string;
  lane: number;
  isPaused: boolean;
  gameOver: boolean;
  onCrash: () => void;
  onScoreUpdate: (score: number) => void;
}

function GameScene({ characterImage, lane, isPaused, gameOver, onCrash, onScoreUpdate }: GameSceneProps) {
  const frameCount = useRef(0);
  const hurdleIdCounter = useRef(0);
  const texture = useLoader(THREE.TextureLoader, characterImage);

  const [hurdles, setHurdles] = useState<Hurdle[]>([]);
  const hurdlesRef = useRef<Hurdle[]>([]);
  const scoreRef = useRef(0);

  useEffect(() => {
    if (!gameOver) {
      hurdlesRef.current = [];
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHurdles([]);
      scoreRef.current = 0;
      frameCount.current = 0;
    }
  }, [gameOver]);

  useFrame(() => {
    if (gameOver || isPaused) return;

    frameCount.current += 1;

    if (frameCount.current % SPAWN_RATE === 0) {
      const newLane = Math.floor(Math.random() * 3);
      hurdlesRef.current.push({
        id: hurdleIdCounter.current++,
        lane: newLane,
        z: -80, // Spawn further back so they emerge from the fog
      });
    }

    const speed = HURDLE_SPEED + (scoreRef.current / 2000);
    hurdlesRef.current.forEach((h: Hurdle) => {
      h.z += speed;
    });

    hurdlesRef.current = hurdlesRef.current.filter((h: Hurdle) => h.z < 10);

    const playerZ = 0;
    const playerZRadius = 1;

    let crashed = false;
    for (const h of hurdlesRef.current) {
      if (h.lane === lane) {
        if (h.z > playerZ - playerZRadius && h.z < playerZ + playerZRadius) {
          crashed = true;
          break;
        }
      }
    }

    if (crashed) {
      playSound('crash');
      onCrash();
    } else {
      scoreRef.current += 1;
      if (scoreRef.current % 1000 === 0 && scoreRef.current > 0) {
        playSound('score');
      }
      onScoreUpdate(Math.floor(scoreRef.current / 10));
    }

    // Trigger re-render for hurdles
    setHurdles([...hurdlesRef.current]);
  });

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 20, 5]} intensity={1.5} castShadow />

      <Plane args={[60, 200]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, -40]} receiveShadow>
        <meshStandardMaterial color="#333" roughness={0.8} metalness={0.2} />
      </Plane>
      <Plane args={[0.2, 200]} rotation={[-Math.PI / 2, 0, 0]} position={[-LANE_WIDTH / 2, -0.49, -40]} receiveShadow>
        <meshBasicMaterial color="#fff" opacity={0.3} transparent />
      </Plane>
      <Plane args={[0.2, 200]} rotation={[-Math.PI / 2, 0, 0]} position={[LANE_WIDTH / 2, -0.49, -40]} receiveShadow>
        <meshBasicMaterial color="#fff" opacity={0.3} transparent />
      </Plane>

      <Billboard position={[(lane - 1) * LANE_WIDTH, 1.5, 0]} follow={true}>
        <Plane args={[3, 4]}>
          <meshBasicMaterial map={texture} transparent={true} />
        </Plane>
      </Billboard>

      {hurdles.map((h: Hurdle) => (
        <group key={h.id} position={[(h.lane - 1) * LANE_WIDTH, 0.5, h.z]}>
          <Box args={[LANE_WIDTH * 0.8, 1, 0.5]} castShadow>
            <meshStandardMaterial color="#f97316" />
          </Box>
          <Box args={[LANE_WIDTH * 0.8, 0.2, 0.6]} position={[0, 0, 0]} castShadow>
            <meshStandardMaterial color="#fff" />
          </Box>
        </group>
      ))}
    </>
  );
}

export default function Game({ characterImage, onExit }: GameProps) {
  const [lane, setLane] = useState(1);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    containerRef.current?.focus();
  }, [isPaused, gameOver]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
      e.stopPropagation();
      if (e.repeat) return;
      if (!gameOver) setIsPaused((prev) => !prev);
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

  const handleCrash = () => {
    setGameOver(true);
  };

  const resetGame = () => {
    setLane(1);
    setScore(0);
    setGameOver(false);
    setIsPaused(false);
  };

  const handleTouchLeft = () => {
    if (gameOver || isPaused) return;
    setLane(prev => {
      if (prev > 0) playSound('move');
      return Math.max(0, prev - 1);
    });
  };

  const handleTouchRight = () => {
    if (gameOver || isPaused) return;
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
      className="relative w-full h-screen overflow-hidden font-anton select-none touch-none outline-none"
    >
      {/* ---------- Background layers ---------- */}
      <div className="absolute inset-0 overflow-hidden pd-kenburns">
        {/* sky */}
        <div
          className="absolute inset-x-0 top-0"
          style={{
            height: `${HORIZON_PCT + 2}%`,
            background: 'linear-gradient(to bottom, #5fa8d3 0%, #8fc6e0 45%, #cfe6e2 100%)',
          }}
        />
        {/* clouds */}
        {[
          { top: '9%', left: '11%', w: 13 },
          { top: '17%', left: '61%', w: 10 },
          { top: '6%', left: '78%', w: 9 },
          { top: '21%', left: '31%', w: 8 },
        ].map((c, i) => (
          <div key={i} className="absolute" style={{ top: c.top, left: c.left, width: `${c.w}vw`, height: `${c.w * 0.42}vw`, opacity: 0.92 }}>
            <div className="absolute rounded-full bg-white" style={{ left: '0%', bottom: '0%', width: '60%', height: '78%' }} />
            <div className="absolute rounded-full bg-white" style={{ left: '32%', bottom: '20%', width: '68%', height: '80%' }} />
            <div className="absolute rounded-full bg-white" style={{ left: '58%', bottom: '5%', width: '46%', height: '62%' }} />
          </div>
        ))}
        {/* distant treeline silhouette */}
        <svg
          className="absolute inset-x-0"
          style={{ top: `${HORIZON_PCT - 5}%`, height: '7%', width: '100%' }}
          viewBox="0 0 100 10"
          preserveAspectRatio="none"
        >
          <polygon
            fill="#6e8f6a"
            opacity="0.55"
            points="0,10 0,6 5,4 9,6 14,3 19,5.5 24,2.5 30,5 35,3.5 41,6 46,3 52,5.5 58,2.8 64,5.5 70,3.5 76,6 82,4 88,6.5 94,4.5 100,6 100,10"
          />
        </svg>
        {/* ground */}
        <div
          className="absolute inset-x-0 bottom-0"
          style={{
            top: `${HORIZON_PCT}%`,
            background: 'linear-gradient(to bottom, #9bc77f 0%, #7cad5c 30%, #5c9244 70%, #4d8038 100%)',
          }}
        />
        {/* atmospheric haze near the horizon */}
        <div
          className="absolute inset-x-0 top-[38%] h-[20%]"
          style={{ background: 'linear-gradient(to bottom, rgba(225,232,238,0.45) 0%, rgba(225,232,238,0.15) 60%, rgba(225,232,238,0) 100%)' }}
        />
      </div>

      <div className="absolute inset-0 z-0">
        <Canvas shadows camera={{ position: [0, 5, 10], fov: 60, rotation: [-0.2, 0, 0] }}>
          <React.Suspense fallback={null}>
            <ResponsiveCamera />
            <GameScene
              characterImage={characterImage}
              lane={lane}
              isPaused={isPaused}
              gameOver={gameOver}
              onCrash={handleCrash}
              onScoreUpdate={setScore}
            />
          </React.Suspense>
        </Canvas>
      </div>

      <div className="absolute top-20 left-4 sm:top-6 sm:left-10 z-30 pointer-events-none flex flex-col gap-2">
        <div className="text-white text-3xl sm:text-5xl tracking-wide opacity-90 drop-shadow-md">
          SCORE: {score}
        </div>
      </div>

      <button
        onClick={(e) => { setIsPaused(!isPaused); e.currentTarget.blur(); }}
        className="absolute top-20 right-4 sm:top-6 sm:right-10 z-30 flex items-center justify-center w-12 h-12 rounded-full border-2 border-white/50 bg-black/20 text-white hover:bg-white hover:text-black transition-colors"
      >
        {isPaused ? <Play size={24} /> : <Pause size={24} />}
      </button>

      <div className="absolute bottom-0 inset-x-0 h-2/3 flex z-30 sm:hidden">
        <div className="flex-1" onPointerDown={handleTouchLeft} style={{ touchAction: 'none' }} />
        <div className="flex-1" onPointerDown={handleTouchRight} style={{ touchAction: 'none' }} />
      </div>

      {gameOver && (
        <div className="absolute inset-0 bg-black flex items-center justify-center z-50">
          <div className="text-center px-4">
            <h2 className="text-6xl sm:text-8xl text-red-500 mb-2 uppercase tracking-wider font-bold drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]">
              GAME OVER
            </h2>
            <p className="text-2xl sm:text-3xl text-slate-300 mb-10 font-sans font-medium">Final Score: {score}</p>
            <div className="flex flex-col gap-4 sm:flex-row justify-center">
              <button
                onClick={resetGame}
                className="px-8 py-4 bg-white text-black text-2xl rounded-full hover:scale-105 transition-transform uppercase cursor-pointer"
              >
                PLAY AGAIN
              </button>
              <button
                onClick={(e) => { onExit(); e.currentTarget.blur(); }}
                className="px-8 py-4 bg-transparent border-2 border-white text-white text-xl rounded-full hover:bg-white/10 transition-colors uppercase font-sans font-semibold cursor-pointer"
              >
                BACK TO MENU
              </button>
            </div>
          </div>
        </div>
      )}

      {isPaused && !gameOver && (
        <div className="absolute inset-0 bg-black flex items-center justify-center z-50">
          <div className="text-center px-4">
            <h2 className="text-6xl sm:text-8xl text-white mb-10 uppercase tracking-wider font-bold">
              PAUSED
            </h2>
            <div className="flex flex-col gap-4 sm:flex-row justify-center">
              <button
                onClick={(e) => { setIsPaused(false); e.currentTarget.blur(); }}
                className="px-8 py-4 bg-white text-black text-2xl rounded-full hover:scale-105 transition-transform uppercase cursor-pointer"
              >
                RESUME
              </button>
              <button
                onClick={onExit}
                className="px-8 py-4 bg-transparent border-2 border-white text-white text-xl rounded-full hover:bg-white/10 transition-colors uppercase font-sans font-semibold cursor-pointer"
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
