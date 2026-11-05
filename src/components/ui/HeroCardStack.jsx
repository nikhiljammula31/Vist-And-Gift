import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CARDS = [
  { id: 1, color: 'bg-white', text: 'Visit & Gift', subtext: 'Premium Connections', textCol: 'text-secondary-dark' },
  { id: 2, color: 'bg-secondary-dark', text: 'Acme Corp', subtext: 'Innovative Solutions', textCol: 'text-white' },
  { id: 3, color: 'bg-accent', text: 'Studio Blanc', subtext: 'Design Agency', textCol: 'text-white' },
  { id: 4, color: 'bg-secondary-lavender', text: 'Aura', subtext: 'Wellness Spa', textCol: 'text-secondary-dark' },
  { id: 5, color: 'bg-secondary-cream', text: 'Lumina', subtext: 'Photography', textCol: 'text-secondary-dark' },
  { id: 6, color: 'bg-secondary-skyblue', text: 'Horizon', subtext: 'Financial Services', textCol: 'text-secondary-dark' },
];

const HeroCardStack = () => {
  const [cards, setCards] = useState(CARDS);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      setCards((prevCards) => {
        const newCards = [...prevCards];
        const lastCard = newCards.pop();
        newCards.unshift(lastCard);
        return newCards;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    
    // Calculate tilt based on mouse position relative to center of screen
    const x = (clientX / innerWidth - 0.5) * 20; // max 10 degrees tilt
    const y = (clientY / innerHeight - 0.5) * -20; // inverted Y for natural feel
    
    setMousePosition({ x, y });
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="relative w-full h-[600px] flex items-center justify-center perspective-1000">
      <motion.div 
        className="relative w-80 h-48 preserve-3d"
        animate={{
          rotateY: mousePosition.x,
          rotateX: mousePosition.y,
          y: [-10, 10, -10] // slight vertical float
        }}
        transition={{
          y: { duration: 6, repeat: Infinity, ease: "easeInOut" },
          rotateX: { type: 'spring', stiffness: 100, damping: 30 },
          rotateY: { type: 'spring', stiffness: 100, damping: 30 }
        }}
      >
        <AnimatePresence>
          {cards.map((card, index) => {
            const isFront = index === cards.length - 1;
            return (
              <motion.div
                key={card.id}
                layout
                initial={{ 
                  opacity: 0, 
                  scale: 0.8, 
                  z: -100,
                  y: -50
                }}
                animate={{
                  opacity: 1 - (cards.length - 1 - index) * 0.15,
                  scale: 1 - (cards.length - 1 - index) * 0.05,
                  z: index * 20, // stack depth
                  y: (cards.length - 1 - index) * -15, // vertical offset for perspective
                  rotateZ: (cards.length - 1 - index) * (index % 2 === 0 ? -2 : 2) // slight rotation
                }}
                exit={{
                  opacity: 0,
                  scale: 0.8,
                  z: -200,
                  y: 50,
                  rotateZ: 10
                }}
                transition={{
                  duration: 0.8,
                  ease: "easeInOut"
                }}
                className={`absolute inset-0 rounded-xl shadow-2xl flex flex-col items-center justify-center border border-white/20 backface-hidden ${card.color}`}
                style={{
                  boxShadow: isFront 
                    ? '0 30px 60px rgba(0,0,0,0.15), 0 0 40px rgba(248,184,200,0.2)' 
                    : '0 10px 30px rgba(0,0,0,0.1)',
                }}
              >
                <div className={`text-center ${card.textCol}`}>
                  <h3 className="font-heading text-2xl font-bold mb-2">{card.text}</h3>
                  <p className="font-body text-xs tracking-widest uppercase opacity-80">{card.subtext}</p>
                </div>
                {/* Simulated shiny foil/texture effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-50 mix-blend-overlay rounded-xl"></div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default HeroCardStack;
