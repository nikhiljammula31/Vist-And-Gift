import { useLocation, useOutlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import CustomCursor from '../common/CustomCursor';
import ScrollProgress from '../common/ScrollProgress';
import GiftBoxTransition from '../common/GiftBoxTransition';
import QuoteModal from '../common/QuoteModal';
import AuthRequiredModal from '../common/AuthRequiredModal';
import { useEffect } from 'react';
import Lenis from '@studio-freight/lenis';
import { AnimatePresence, motion } from 'framer-motion';

const Layout = () => {
  const location = useLocation();
  const currentOutlet = useOutlet();

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), 
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    // Scroll to top on route change without breaking animations
    window.scrollTo(0, 0);

    return () => {
      lenis.destroy();
    };
  }, [location.pathname]);

  // Premium transition using a massive folding/unrolling 3D effect (for /services)
  const premiumVariants = {
    initial: { 
      opacity: 0,
      scale: 0.8,
      y: '50%',
      rotateX: -45,
      transformPerspective: 2000
    },
    enter: { 
      opacity: 1,
      scale: 1,
      y: 0,
      rotateX: 0,
      transformPerspective: 2000,
      transition: {
        duration: 1.2,
        ease: [0.16, 1, 0.3, 1],
        delay: 1.8 // Perfectly timed with the GiftBox opening stage
      }
    },
    exit: { 
      opacity: 0,
      scale: 0.95,
      y: '-10%',
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  // Lightweight standard transition for other pages
  const standardVariants = {
    initial: {
      opacity: 0,
      scale: 0.98,
      y: 20,
    },
    enter: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeInOut"
      }
    },
    exit: {
      opacity: 0,
      scale: 0.98,
      y: -20,
      transition: {
        duration: 0.35,
        ease: "easeInOut"
      }
    }
  };

  const isServicesRoute = location.pathname === '/services';
  const currentVariants = isServicesRoute ? premiumVariants : standardVariants;

  return (
    <>
      <CustomCursor />
      <ScrollProgress />
      <Navbar />
      
      {/* 
        The background is now managed globally in App.jsx.
        Gift Box sequence will overlay above the background but below the modal.
      */}
      {isServicesRoute && <GiftBoxTransition key={`giftbox-${location.pathname}`} />}

      <main className="min-h-screen relative z-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial="initial"
            animate="enter"
            exit="exit"
            variants={currentVariants}
            className="w-full h-full transform-gpu origin-bottom"
          >
            {currentOutlet}
          </motion.div>
        </AnimatePresence>
      </main>
      
      <Footer />
      <QuoteModal />
      <AuthRequiredModal />
    </>
  );
};

export default Layout;
