import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer } from '../utils/animations';

const About = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-primary-bg"
    >
      {/* Hero Section */}
      <section className="pt-32 pb-20 relative overflow-hidden bg-secondary-peach/20">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
        <div className="container mx-auto px-6 md:px-12 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-5xl md:text-7xl font-heading font-bold text-secondary-dark mb-6"
            >
              Crafting <span className="text-gradient">Impressions</span> Since 2010
            </motion.h1>
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-600 font-body leading-relaxed"
            >
              We are a team of passionate designers, printers, and gift curators dedicated to helping businesses express their unique identity through premium physical touchpoints.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Story & Image Gallery */}
      <section className="py-24">
        <div className="container mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-100px" }}
            >
              <motion.h2 variants={fadeInUp} className="text-4xl font-heading font-bold text-secondary-dark mb-6">Our Story</motion.h2>
              <motion.p variants={fadeInUp} className="text-gray-600 font-body mb-4 leading-relaxed">
                What started as a small boutique printing press has grown into a comprehensive corporate gifting and printing partner for over 5,000 businesses worldwide. 
              </motion.p>
              <motion.p variants={fadeInUp} className="text-gray-600 font-body mb-4 leading-relaxed">
                At Visit & Gift, we believe that in an increasingly digital world, a beautifully crafted visiting card or a thoughtfully personalized gift holds more power than ever. It's a tangible representation of your brand's commitment to quality.
              </motion.p>
              <motion.div variants={fadeInUp} className="mt-8 p-6 bg-secondary-lavender/30 rounded-2xl border-l-4 border-accent">
                <p className="font-heading italic text-xl text-secondary-dark">"Our mission is to elevate every corporate interaction from ordinary to unforgettable."</p>
                <p className="font-body text-sm font-semibold mt-4">— CEO, Visit & Gift</p>
              </motion.div>
            </motion.div>

            <div className="grid grid-cols-2 gap-4">
              <motion.img 
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                src="https://images.unsplash.com/photo-1572044162444-ad60f128bdea?q=80&w=600&auto=format&fit=crop" 
                alt="Printing Press" 
                loading="lazy"
                className="w-full h-64 object-cover rounded-2xl shadow-lg mt-8"
              />
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="w-full h-64 rounded-2xl shadow-lg bg-gradient-to-br from-accent/80 to-accent-dark/80 backdrop-blur-md border border-white/40 p-6 flex flex-col justify-center items-center text-center text-white"
              >
                <div className="w-16 h-16 mb-4 rounded-full bg-white/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <h3 className="font-heading font-bold text-xl mb-2">Master Craftsmanship</h3>
                <p className="font-body text-sm opacity-90">Precision foil stamping and luxury curation.</p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
};

export default About;
