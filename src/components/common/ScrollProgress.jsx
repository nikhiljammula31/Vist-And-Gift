import { motion, useScroll } from "framer-motion";

const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 z-[100] origin-left bg-gradient-to-r from-accent to-secondary-skyblue"
      style={{ scaleX: scrollYProgress }}
    />
  );
};

export default ScrollProgress;
