import { useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

const HeroGiftBoxes = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for parallax
  const springConfig = { damping: 25, stiffness: 150 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  // Parallax transforms for each box
  const parallaxX1 = useTransform(smoothX, [-0.5, 0.5], [-20, 20]);
  const parallaxY1 = useTransform(smoothY, [-0.5, 0.5], [-20, 20]);

  const parallaxX2 = useTransform(smoothX, [-0.5, 0.5], [-35, 35]);
  const parallaxY2 = useTransform(smoothY, [-0.5, 0.5], [-35, 35]);

  const parallaxX3 = useTransform(smoothX, [-0.5, 0.5], [-15, 15]);
  const parallaxY3 = useTransform(smoothY, [-0.5, 0.5], [-15, 15]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth) - 0.5;
      const y = (e.clientY / window.innerHeight) - 0.5;
      mouseX.set(x);
      mouseY.set(y);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div className="absolute inset-0 pointer-events-none z-0">
      {/* Sparkles around boxes */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={`hero-sparkle-${i}`}
          className="absolute w-2 h-2 rounded-full bg-white shadow-[0_0_8px_#fff]"
          style={{
            top: `${10 + Math.random() * 40}%`,
            right: `${-10 + Math.random() * 40}%`,
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1.2, 0],
            y: [0, -20]
          }}
          transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
        />
      ))}

      {/* Floating Confetti/Ribbons */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={`hero-confetti-${i}`}
          className="absolute w-4 h-4 border-2 border-accent/40 rounded-full border-b-transparent"
          style={{
            top: `${20 + Math.random() * 30}%`,
            right: `${-20 + Math.random() * 50}%`,
          }}
          animate={{
            rotate: [0, 360],
            y: [0, -30, 0]
          }}
          transition={{ duration: 10 + Math.random() * 5, repeat: Infinity, ease: "linear" }}
        />
      ))}

      {/* 1. Large Gift Box (Rose Milk Pink) */}
      <motion.div
        className="absolute top-[10%] right-[-5%] w-48 h-48 drop-shadow-2xl"
        style={{ x: parallaxX1, y: parallaxY1 }}
        animate={{ y: ['0%', '-5%', '0%'], rotate: [-2, 2, -2] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="relative w-full h-full">
          {/* Box Body */}
          <div className="absolute bottom-0 w-full h-32 bg-gradient-to-br from-[#F8C8D8] to-[#E891A7] rounded-xl shadow-xl overflow-hidden border border-white/40">
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-8 bg-white shadow-md border-x border-gray-100/50" />
            <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-8 bg-white shadow-md border-y border-gray-100/50" />
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent" />
          </div>
          {/* Box Lid */}
          <div className="absolute top-8 left-[-2%] w-[104%] h-12 bg-gradient-to-br from-[#FDE4EA] to-[#F8C8D8] rounded-xl shadow-lg border border-white/50 z-10">
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-8 bg-white shadow-md" />
            {/* Bow */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex">
              <div className="w-8 h-8 rounded-full border-[4px] border-white -mr-2 shadow-sm" />
              <div className="w-8 h-8 rounded-full border-[4px] border-white -ml-2 shadow-sm" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent" />
          </div>
        </div>
      </motion.div>

      {/* 2. Medium Gift Box (White + Gold) */}
      <motion.div
        className="absolute top-[35%] right-[25%] w-32 h-32 drop-shadow-xl z-20"
        style={{ x: parallaxX2, y: parallaxY2 }}
        animate={{ y: ['0%', '-8%', '0%'], rotate: [2, -2, 2] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      >
        <div className="relative w-full h-full">
          {/* Box Body */}
          <div className="absolute bottom-0 w-full h-24 bg-gradient-to-br from-white to-gray-100 rounded-lg shadow-lg overflow-hidden border border-white">
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-6 bg-gradient-to-b from-yellow-200 to-yellow-500 shadow-sm" />
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/60 to-transparent" />
          </div>
          {/* Box Lid */}
          <div className="absolute top-4 left-[-2%] w-[104%] h-8 bg-gradient-to-br from-white to-gray-50 rounded-lg shadow-md border border-white z-10">
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-6 bg-gradient-to-b from-yellow-200 to-yellow-500" />
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex">
              <div className="w-6 h-6 rounded-full border-[3px] border-yellow-400 -mr-1" />
              <div className="w-6 h-6 rounded-full border-[3px] border-yellow-400 -ml-1" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* 3. Small Gift Box (Peach + Cream) */}
      <motion.div
        className="absolute top-[5%] right-[20%] w-24 h-24 drop-shadow-lg"
        style={{ x: parallaxX3, y: parallaxY3 }}
        animate={{ y: ['0%', '10%', '0%'], rotate: [-4, 4, -4] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      >
        <div className="relative w-full h-full">
          {/* Box Body */}
          <div className="absolute bottom-0 w-full h-16 bg-gradient-to-br from-[#FFF2E6] to-[#FFE5CC] rounded-lg shadow-md overflow-hidden border border-white/60">
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-4 bg-[#F4EFFF] shadow-sm" />
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent" />
          </div>
          {/* Box Lid */}
          <div className="absolute top-4 left-[-2%] w-[104%] h-6 bg-gradient-to-br from-[#FFF8F2] to-[#FFF2E6] rounded-lg shadow-sm border border-white/60 z-10">
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-4 bg-[#F4EFFF]" />
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex">
              <div className="w-4 h-4 rounded-full border-[2px] border-[#F4EFFF] -mr-1" />
              <div className="w-4 h-4 rounded-full border-[2px] border-[#F4EFFF] -ml-1" />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default HeroGiftBoxes;
