import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const IMAGES = [
  { src: 'https://fifth-gentle-45902158.figma.site/_components/v2/4de492f6d9cf8244ad5293233e5c6f52407d42fc/1.02464a56.png', bg: '#F4845F', panel: '#F79B7F', desc: 'Dash through vibrant streets, dodge obstacles, and collect coins in this fast-paced endless runner. Show off your agility as the fearless trailblazer. Play now!' },
  { src: 'https://fifth-gentle-45902158.figma.site/_components/v2/4de492f6d9cf8244ad5293233e5c6f52407d42fc/2.b977faab.png', bg: '#6BBF7A', panel: '#85CC92', desc: 'Leap over hurdles and sprint through neon alleys. Stay quick on your feet with our swift green speedster. Can you reach the top score? Dash now!' },
  { src: 'https://fifth-gentle-45902158.figma.site/_components/v2/4de492f6d9cf8244ad5293233e5c6f52407d42fc/3.4df853b4.png', bg: '#E882B4', panel: '#ED9DC4', desc: 'Style meets speed in this endless runner. Glide past obstacles and grab power-ups with undeniable flair. Take on the ultimate dash challenge today!' },
  { src: 'https://fifth-gentle-45902158.figma.site/_components/v2/4de492f6d9cf8244ad5293233e5c6f52407d42fc/4.4457fbce.png', bg: '#6EB5FF', panel: '#8DC4FF', desc: 'Keep cool under pressure as you race down the futuristic track. Master sharp turns and sudden drops with the coolest runner in the crew. Start your run!' },
];

const grainSvg = `data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E`;

interface CarouselProps {
  onPlay: (characterImage: string) => void;
}

export default function Carousel({ onPlay }: CarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 640);
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    IMAGES.forEach((img) => {
      const image = new Image();
      image.src = img.src;
    });
  }, []);

  const navigate = (dir: 'next' | 'prev') => {
    if (isAnimating) return;
    setIsAnimating(true);
    if (dir === 'next') {
      setActiveIndex((prev) => (prev + 1) % 4);
    } else {
      setActiveIndex((prev) => (prev + 3) % 4);
    }
    setTimeout(() => {
      setIsAnimating(false);
    }, 650);
  };

  const getRoleStyle = (index: number) => {
    const center = activeIndex;
    const left = (activeIndex + 3) % 4;
    const right = (activeIndex + 1) % 4;
    const back = (activeIndex + 2) % 4;

    const baseStyle = {
      transition: 'transform 650ms cubic-bezier(0.4,0,0.2,1), filter 650ms cubic-bezier(0.4,0,0.2,1), opacity 650ms cubic-bezier(0.4,0,0.2,1), left 650ms cubic-bezier(0.4,0,0.2,1), bottom 650ms cubic-bezier(0.4,0,0.2,1), height 650ms cubic-bezier(0.4,0,0.2,1)',
      willChange: 'transform, filter, opacity, left, bottom, height',
    };

    if (index === center) {
      return {
        ...baseStyle,
        transform: `translateX(-50%) scale(${isMobile ? 1.25 : 1.68})`,
        filter: 'blur(0px)',
        opacity: 1,
        zIndex: 20,
        left: '50%',
        height: isMobile ? '60%' : '92%',
        bottom: isMobile ? '22%' : '0',
      };
    } else if (index === left) {
      return {
        ...baseStyle,
        transform: `translateX(-50%) scale(1)`,
        filter: 'blur(2px)',
        opacity: 0.85,
        zIndex: 10,
        left: isMobile ? '20%' : '30%',
        height: isMobile ? '16%' : '28%',
        bottom: isMobile ? '32%' : '12%',
      };
    } else if (index === right) {
      return {
        ...baseStyle,
        transform: `translateX(-50%) scale(1)`,
        filter: 'blur(2px)',
        opacity: 0.85,
        zIndex: 10,
        left: isMobile ? '80%' : '70%',
        height: isMobile ? '16%' : '28%',
        bottom: isMobile ? '32%' : '12%',
      };
    } else if (index === back) {
      return {
        ...baseStyle,
        transform: `translateX(-50%) scale(1)`,
        filter: 'blur(4px)',
        opacity: 1,
        zIndex: 5,
        left: '50%',
        height: isMobile ? '13%' : '22%',
        bottom: isMobile ? '32%' : '12%',
      };
    }

    return baseStyle;
  };

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        backgroundColor: IMAGES[activeIndex].bg,
        transition: 'background-color 650ms cubic-bezier(0.4,0,0.2,1)',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div className="relative w-full h-screen overflow-hidden">
        {/* Grain overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-50"
          style={{
            opacity: 0.4,
            backgroundImage: `url("${grainSvg}")`,
            backgroundSize: '200px 200px',
            backgroundRepeat: 'repeat',
          }}
        />

        {/* Giant ghost text */}
        <div
          className="absolute inset-x-0 flex items-center justify-center pointer-events-none select-none z-[2] font-anton"
          style={{
            top: '18%',
            fontSize: 'clamp(90px, 28vw, 380px)',
            fontWeight: 900,
            color: 'white',
            opacity: 1,
            lineHeight: 1,
            textTransform: 'uppercase',
            letterSpacing: '-0.02em',
            whiteSpace: 'nowrap',
          }}
        >
          POLY DASH
        </div>

        {/* Top-left brand label */}
        <div className="absolute top-6 left-4 sm:left-8 z-60 text-xs font-semibold uppercase text-white opacity-90 tracking-[0.18em] z-[60]">
          POLY DASH
        </div>

        {/* Carousel items */}
        <div className="absolute inset-0 z-[3]">
          {IMAGES.map((img, index) => (
            <div
              key={index}
              className="absolute"
              style={{
                aspectRatio: '0.6 / 1',
                ...getRoleStyle(index),
              }}
            >
              <img
                src={img.src}
                alt={`Figurine ${index + 1}`}
                draggable={false}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  objectPosition: 'bottom center',
                }}
              />
            </div>
          ))}
        </div>

        {/* Bottom-left text + nav buttons */}
        <div className="absolute bottom-4 left-4 sm:bottom-10 sm:left-24 z-[60] max-w-[305px]">

          <p className="hidden sm:block text-xs sm:text-sm text-white opacity-85 leading-[1.6] mb-4 sm:mb-5 transition-opacity duration-300">
            {IMAGES[activeIndex].desc}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('prev')}
              className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 border-white text-white hover:scale-105 hover:bg-white/10 transition-all duration-150"
              style={{ transition: 'transform 150ms, background-color 150ms' }}
              aria-label="Previous"
            >
              <ArrowLeft size={26} strokeWidth={2.25} />
            </button>
            <button
              onClick={() => navigate('next')}
              className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 border-white text-white hover:scale-105 hover:bg-white/10 transition-all duration-150"
              style={{ transition: 'transform 150ms, background-color 150ms' }}
              aria-label="Next"
            >
              <ArrowRight size={26} strokeWidth={2.25} />
            </button>
          </div>
        </div>

        {/* Bottom-right link */}
        <button
          onClick={() => onPlay(IMAGES[activeIndex].src)}
          className="absolute bottom-6 right-4 sm:bottom-20 sm:right-10 z-[60] flex items-center text-white opacity-95 hover:opacity-100 transition-opacity duration-200 font-anton uppercase no-underline cursor-pointer"
          style={{
            fontSize: 'clamp(20px, 4vw, 56px)',
            fontWeight: 400,
            letterSpacing: '-0.02em',
            lineHeight: 1,
            background: 'none',
            border: 'none',
            padding: 0,
          }}
        >
          DASH NOW
          <ArrowRight
            className="ml-2 w-5 h-5 sm:w-8 sm:h-8"
            strokeWidth={2.25}
          />
        </button>
      </div>
    </div>
  );
}
