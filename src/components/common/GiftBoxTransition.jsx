import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const GiftBoxTransition = () => {
  const location = useLocation();
  const [isPresent, setIsPresent] = useState(false);

  useEffect(() => {
    // Show transition overlay on route change
    setIsPresent(true);
    const timer = setTimeout(() => {
      setIsPresent(false);
    }, 3000); // 3 seconds total transition

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <AnimatePresence>
      {isPresent && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Glass background overlay (Stage 1: Dims & Blurs) */}
          <motion.div 
            className="absolute inset-0 bg-white/60 backdrop-blur-xl"
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(20px)' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          />

          {/* Golden Particles (Stage 3) */}
          <motion.div 
            className="absolute inset-0 z-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={`gold-sparkle-${i}`}
                className="absolute w-2 h-2 rounded-full bg-yellow-300 shadow-[0_0_15px_rgba(253,224,71,0.8)]"
                style={{
                  top: '50%',
                  left: '50%',
                }}
                animate={{
                  x: [0, (Math.random() - 0.5) * 800],
                  y: [0, (Math.random() - 0.5) * 800 - 200],
                  opacity: [0, 1, 0],
                  scale: [0, 1.5, 0]
                }}
                transition={{
                  duration: 1.5 + Math.random(),
                  delay: 1.2 + Math.random() * 0.3,
                  ease: "easeOut"
                }}
              />
            ))}
          </motion.div>

          {/* Large Premium Gift Box */}
          <motion.div
            className="relative z-10 w-[80vw] max-w-[500px] aspect-[4/3] flex flex-col justify-end"
            initial={{ scale: 0.5, y: '50vh', opacity: 0 }}
            animate={{ scale: 1, y: '10vh', opacity: 1 }} // Stage 1: rises and bounces
            exit={{ opacity: 0, scale: 0.8, y: '20vh' }} // Stage 5: shrinks and fades
            transition={{ 
              type: 'spring', 
              stiffness: 150, 
              damping: 15,
              duration: 0.8,
              exit: { duration: 0.4, ease: "easeIn" }
            }}
          >
            {/* Warm white glow emerging from inside */}
            <motion.div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-[150%] bg-white/80 rounded-full blur-[80px] origin-bottom"
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              transition={{ delay: 1.2, duration: 1.5, ease: "easeOut" }} // Stage 3: glow
            />

            {/* Box Body */}
            <motion.div 
              className="absolute bottom-0 w-full h-[70%] bg-gradient-to-br from-[#F8C8D8] to-[#E891A7] rounded-b-[40px] shadow-[0_30px_60px_rgba(0,0,0,0.15)] overflow-hidden border-2 border-white/40 z-20"
            >
              {/* Glossy Reflection */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent opacity-60" />
              
              {/* Vertical Ribbon */}
              <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-16 bg-gradient-to-b from-white to-gray-100 shadow-[0_0_15px_rgba(0,0,0,0.1)] border-x border-yellow-500/20">
                 {/* Gold edges */}
                 <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-yellow-300 to-yellow-600" />
                 <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-yellow-300 to-yellow-600" />
              </div>
            </motion.div>

            {/* Box Lid (Opens upward in Stage 3) */}
            <motion.div 
              className="absolute bottom-[65%] left-[-2%] w-[104%] h-[25%] bg-gradient-to-br from-[#FDE4EA] to-[#F8C8D8] rounded-t-[30px] shadow-[0_15px_40px_rgba(0,0,0,0.1)] origin-bottom border-2 border-white/50 z-30"
              initial={{ rotateX: 0, y: 0 }}
              animate={{ rotateX: -100, y: -80, opacity: 0 }} // Stage 3: lid opens and disappears
              transition={{ delay: 1.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent opacity-80" />
              
              {/* Lid Ribbon horizontal */}
              <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-16 bg-gradient-to-b from-white to-gray-100 shadow-[0_0_15px_rgba(0,0,0,0.1)]">
                 <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-yellow-300 to-yellow-600" />
                 <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-yellow-300 to-yellow-600" />
              </div>
              
              {/* Bow (Loosens in Stage 2) */}
              <motion.div 
                className="absolute -top-16 left-1/2 -translate-x-1/2 flex items-end justify-center w-40 h-20"
                initial={{ y: 0, opacity: 1, scale: 1 }}
                animate={{ y: 20, opacity: 0, scale: 1.2 }} // Stage 2: unties and slides off
                transition={{ delay: 0.5, duration: 0.6, ease: "easeInOut" }}
              >
                {/* Left loop */}
                <div className="w-16 h-16 rounded-full border-[8px] border-white -mr-4 shadow-lg relative overflow-hidden">
                  <div className="absolute inset-0 border-2 border-yellow-400 rounded-full" />
                </div>
                {/* Right loop */}
                <div className="w-16 h-16 rounded-full border-[8px] border-white -ml-4 shadow-lg relative overflow-hidden">
                  <div className="absolute inset-0 border-2 border-yellow-400 rounded-full" />
                </div>
                {/* Center knot */}
                <div className="absolute bottom-2 w-8 h-8 rounded-full bg-white shadow-md border-2 border-yellow-400 z-10" />
              </motion.div>
            </motion.div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GiftBoxTransition;
