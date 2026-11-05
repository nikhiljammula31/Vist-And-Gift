import React from 'react';
import { motion } from 'framer-motion';

const AppBackground = React.memo(() => {
  return (
    <div className="fixed inset-0 z-[-2] overflow-hidden pointer-events-none bg-[#FEFCF5]">
      {/* 1. Liquid Gradient Mesh Base - Oversized and translated instead of backgroundPosition */}
      <motion.div 
        className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] opacity-60 transform-gpu will-change-transform"
        style={{
          background: 'radial-gradient(circle at center, #FFFFFF 0%, #F8C8D8 30%, #FDE4EA 50%, #FFF2E6 70%, #F4EFFF 100%)',
        }}
        animate={{
          x: ['0%', '-25%', '0%', '25%', '0%'],
          y: ['0%', '25%', '0%', '-25%', '0%'],
          rotate: [0, 90, 180, 270, 360]
        }}
        transition={{
          duration: 45,
          repeat: Infinity,
          ease: "linear"
        }}
      />

      {/* 2. Large Glass Blobs */}
      <motion.div 
        animate={{ x: [0, 80, -40, 0], y: [0, -60, 40, 0], scale: [1, 1.1, 0.9, 1] }} 
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] bg-gradient-to-tr from-[#F8C8D8]/40 to-[#FFF2E6]/40 rounded-full mix-blend-multiply filter blur-[100px] transform-gpu will-change-transform"
      />
      <motion.div 
        animate={{ x: [0, -80, 50, 0], y: [0, 70, -50, 0], scale: [1, 1.2, 0.8, 1] }} 
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut", delay: -10 }}
        className="absolute bottom-[-10%] right-[-5%] w-[50vw] h-[50vw] max-w-[700px] max-h-[700px] bg-gradient-to-bl from-[#F4EFFF]/50 to-[#FDE4EA]/40 rounded-full mix-blend-multiply filter blur-[120px] transform-gpu will-change-transform"
      />

      {/* 3. Light Rays - Oversized and translated */}
      <motion.div
        className="absolute top-[-100%] left-[-100%] w-[300%] h-[300%] opacity-30 transform-gpu will-change-transform"
        style={{
          background: 'linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.8) 50%, transparent 60%)',
        }}
        animate={{
          x: ['-50%', '0%'],
          y: ['-50%', '0%']
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      
      {/* Second light ray going opposite */}
      <motion.div
        className="absolute top-[-100%] left-[-100%] w-[300%] h-[300%] opacity-20 transform-gpu will-change-transform"
        style={{
          background: 'linear-gradient(-45deg, transparent 40%, rgba(255,255,255,0.9) 50%, transparent 60%)',
        }}
        animate={{
          x: ['0%', '-50%'],
          y: ['0%', '-50%']
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
          delay: 5
        }}
      />

      {/* 4. Frosted Glass Layer to blend everything */}
      <div className="absolute inset-0 backdrop-blur-[40px] bg-white/10 pointer-events-none" />

      {/* 5. Floating Bubbles */}
      <div className="absolute inset-0 z-0">
        {[...Array(8)].map((_, i) => {
          const size = Math.random() * 80 + 20;
          return (
            <motion.div
              key={`bubble-${i}`}
              className="absolute rounded-full border border-white/40 bg-gradient-to-tr from-white/10 to-white/30 backdrop-blur-md shadow-[inset_0_0_20px_rgba(255,255,255,0.5)] transform-gpu will-change-transform"
              style={{
                width: size,
                height: size,
                left: `${Math.random() * 100}%`,
                bottom: '-20%',
              }}
              animate={{
                y: [0, -window.innerHeight - 200],
                x: [0, (Math.random() - 0.5) * 200],
                rotate: [0, 360]
              }}
              transition={{
                duration: Math.random() * 20 + 20,
                repeat: Infinity,
                ease: "linear",
                delay: Math.random() * -20
              }}
            >
              {/* Bubble reflection */}
              <div className="absolute top-[15%] left-[15%] w-[30%] h-[30%] bg-white/60 rounded-full blur-[2px] transform -rotate-45" />
            </motion.div>
          );
        })}
      </div>

      {/* 6. Sparkle Particles */}
      <div className="absolute inset-0 z-0">
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={`bg-sparkle-${i}`}
            className="absolute w-1 h-1 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,1)] transform-gpu will-change-transform"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
              y: [0, -30]
            }}
            transition={{
              duration: 3 + Math.random() * 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 5
            }}
          />
        ))}
      </div>

      {/* 7. Glass Reflection Sweep */}
      <motion.div
        className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] z-10 opacity-30 mix-blend-overlay pointer-events-none transform-gpu will-change-transform"
        style={{
          background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,1) 50%, transparent 60%)',
        }}
        animate={{
          x: ['-50%', '50%']
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          repeatDelay: 10,
          ease: "easeInOut"
        }}
      />
    </div>
  );
});

export default AppBackground;
