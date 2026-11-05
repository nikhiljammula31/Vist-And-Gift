import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const CustomCursor = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hoverState, setHoverState] = useState(null); // 'button', 'card', 'image', or null

  useEffect(() => {
    const updateMousePosition = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseOver = (e) => {
      const target = e.target;
      if (target.tagName === 'BUTTON' || target.closest('button') || target.tagName === 'A' || target.closest('a')) {
        setHoverState('button');
      } else if (target.closest('.glass-card') || target.closest('.group.interactive')) {
        setHoverState('card');
      } else if (target.tagName === 'IMG') {
        setHoverState('image');
      } else {
        setHoverState(null);
      }
    };

    window.addEventListener('mousemove', updateMousePosition);
    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, []);

  const variants = {
    default: {
      scale: 1,
      backgroundColor: 'rgba(248, 184, 200, 0.4)',
      boxShadow: '0 0 10px rgba(248, 184, 200, 0.5)',
      opacity: 1
    },
    button: {
      scale: 2.5,
      backgroundColor: 'rgba(248, 184, 200, 0.2)',
      boxShadow: '0 0 20px rgba(248, 184, 200, 0.8)',
      opacity: 1
    },
    card: {
      scale: 1.5,
      backgroundColor: 'rgba(248, 184, 200, 0.3)',
      boxShadow: '0 0 30px rgba(248, 184, 200, 1)',
      opacity: 1
    },
    image: {
      scale: 0.5,
      backgroundColor: 'rgba(248, 184, 200, 0.8)',
      boxShadow: '0 0 15px rgba(248, 184, 200, 0.6)',
      opacity: 1
    }
  };

  return (
    <motion.div
      className="fixed top-0 left-0 w-8 h-8 rounded-full pointer-events-none z-[9999]"
      animate={{
        x: mousePosition.x - 16,
        y: mousePosition.y - 16,
        ...variants[hoverState || 'default']
      }}
      transition={{
        type: 'spring',
        stiffness: 500,
        damping: 28,
        mass: 0.5
      }}
    />
  );
};

export default CustomCursor;
