import { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectCards } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-cards';
import PremiumButton from '../components/common/PremiumButton';
import ServiceCard from '../components/ui/ServiceCard';
import HeroCardStack from '../components/ui/HeroCardStack';
import HeroGiftBoxes from '../components/ui/HeroGiftBoxes';
import { staggerContainer, fadeInUp, slideInLeft } from '../utils/animations';
import { useQuote } from '../context/QuoteContext';
import { useAuth } from '../context/AuthContext';

gsap.registerPlugin(ScrollTrigger);

const Home = () => {
  const navigate = useNavigate();
  const { openQuoteModal } = useQuote();
  const { currentUser, isEmailVerified, loading } = useAuth();
  const heroRef = useRef(null);

  // Authenticated and verified customer status
  const isAuthedAndVerified = Boolean(!loading && currentUser && isEmailVerified);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  const yBg = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  useEffect(() => {
    // GSAP Scroll Animations for stats
    const counters = document.querySelectorAll('.counter-val');
    counters.forEach(counter => {
      gsap.from(counter, {
        scrollTrigger: {
          trigger: counter,
          start: "top 80%",
        },
        textContent: 0,
        duration: 2,
        ease: "power1.out",
        snap: { textContent: 1 },
        stagger: 1,
      });
    });
  }, []);

  return (
    <div className="bg-primary-bg relative">
      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center pt-24 overflow-hidden bg-white">
        {/* Animated Background Blobs & Particles (Glassmorphism bg) */}
        <div className="absolute inset-0 bg-gradient-to-br from-white via-secondary-lavender/10 to-accent-light/20 z-0"></div>
        <motion.div 
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }} 
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-20 -left-20 w-[600px] h-[600px] bg-accent/20 rounded-full mix-blend-multiply filter blur-[100px] opacity-70"
        ></motion.div>
        <motion.div 
          animate={{ x: [0, -60, 0], y: [0, -40, 0] }} 
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-40 -right-20 w-[500px] h-[500px] bg-secondary-skyblue/30 rounded-full mix-blend-multiply filter blur-[80px] opacity-70"
        ></motion.div>
        
        {/* Floating Particles (using small divs) */}
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute rounded-full bg-white/40 backdrop-blur-md shadow-[0_0_10px_rgba(255,255,255,0.8)]"
            style={{
              width: Math.random() * 20 + 10 + 'px',
              height: Math.random() * 20 + 10 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
            }}
            animate={{
              y: [0, -100, 0],
              x: [0, Math.random() * 50 - 25, 0],
              rotate: [0, 360]
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        ))}

        <div className="container mx-auto px-6 md:px-12 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="max-w-2xl"
              style={{ opacity }}
            >
              <motion.div variants={slideInLeft} className="inline-block px-4 py-2 rounded-full glass-card text-accent-dark font-body text-sm font-semibold mb-6">
                Premium Visiting Card & Gift Solutions
              </motion.div>
              <motion.h1 variants={slideInLeft} className="text-5xl md:text-7xl font-heading font-bold text-secondary-dark mb-6 leading-tight">
                Create Professional <span className="text-gradient">Connections</span> That Leave Lasting Impressions
              </motion.h1>
              <motion.p variants={fadeInUp} className="text-lg text-gray-600 font-body mb-8 leading-relaxed max-w-xl">
                Elevate your corporate identity with our meticulously crafted premium visiting cards and curated personalized gifts. 
                Designed for those who appreciate true luxury.
              </motion.p>
              <motion.div variants={fadeInUp} className="flex flex-wrap gap-4">
                <PremiumButton variant="gradient" onClick={() => navigate('/services')}>
                  Explore Services
                </PremiumButton>
                {isAuthedAndVerified && (
                  <PremiumButton variant="primary" onClick={() => navigate('/shop')}>
                    Shop Gifts
                  </PremiumButton>
                )}
              </motion.div>
            </motion.div>

            <motion.div 
              className="relative hidden lg:block h-full w-full"
              style={{ y: yBg }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, type: "spring", delay: 0.4 }}
            >
              <HeroGiftBoxes />
              <div className="relative z-10 w-full h-full">
                <HeroCardStack />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services Preview Section */}
      <section className="py-24 bg-secondary-peach/10">
        <div className="container mx-auto px-6 md:px-12">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-heading font-bold text-secondary-dark mb-4">Our Premium Services</h2>
            <p className="text-gray-600 font-body">Discover our range of bespoke solutions tailored for your business needs.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <ServiceCard 
              title="Premium Visiting Cards" 
              description="Leave a lasting mark with our ultra-thick, textured, and foil-stamped corporate cards."
              image="https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=800&auto=format&fit=crop"
            />
            <ServiceCard 
              title="Corporate Gifting" 
              description="Curated luxury gift boxes designed to impress clients and reward exceptional employees."
              image="https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=800&auto=format&fit=crop"
            />
            <ServiceCard 
              title="Gift Customization" 
              description="Personalize every item with precision engraving, embossing, and custom packaging."
              image="https://images.unsplash.com/photo-1607344645866-009c320b63e0?q=80&w=800&auto=format&fit=crop"
            />
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-20 bg-secondary-dark text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557682250-33bd709cbe85?q=80&w=2000&auto=format&fit=crop')] opacity-10 bg-cover bg-center mix-blend-overlay"></div>
        <div className="container mx-auto px-6 md:px-12 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { val: '10000', label: 'Visiting Cards Printed', suffix: '+' },
              { val: '5000', label: 'Happy Customers', suffix: '+' },
              { val: '2500', label: 'Gift Orders', suffix: '+' },
              { val: '99', label: 'Client Satisfaction', suffix: '%' }
            ].map((stat, idx) => (
              <div key={idx} className="p-6 rounded-2xl glass-card border-none hover:bg-white/10 transition-colors">
                <div className="text-4xl md:text-5xl font-heading font-bold text-accent mb-2 flex justify-center items-center">
                  <span className="counter-val">{stat.val}</span>
                  <span>{stat.suffix}</span>
                </div>
                <div className="font-body text-sm text-gray-300 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-secondary-skyblue/10 overflow-hidden">
        <div className="container mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center gap-16">
          <div className="w-full md:w-1/3">
            <h2 className="text-4xl font-heading font-bold text-secondary-dark mb-6">What Our Clients Say</h2>
            <p className="text-gray-600 font-body mb-8">
              Don't just take our word for it. Read how we've helped businesses elevate their corporate gifting and branding.
            </p>
          </div>
          
          <div className="w-full md:w-2/3 max-w-sm mx-auto">
            <Swiper
              effect={'cards'}
              grabCursor={true}
              modules={[EffectCards, Autoplay]}
              autoplay={{ delay: 3000, disableOnInteraction: false }}
              className="w-full"
            >
              {[1, 2, 3].map((_, idx) => (
                <SwiperSlide key={idx} className="glass-card p-8 shadow-xl">
                  <div className="flex gap-1 text-accent mb-6">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="font-body text-gray-700 text-lg mb-8 italic">
                    "The quality of the visiting cards we received was outstanding. The foil stamping details were perfect. Highly recommended for premium corporate needs."
                  </p>
                  <div className="flex items-center gap-4">
                    <img src={`https://i.pravatar.cc/150?img=${idx + 10}`} alt="User" loading="lazy" className="w-12 h-12 rounded-full object-cover shadow-md" />
                    <div>
                      <h5 className="font-heading font-semibold text-secondary-dark">Sarah Jenkins</h5>
                      <span className="font-body text-xs text-gray-500">Marketing Director</span>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="container mx-auto glass-card overflow-hidden relative p-12 md:p-24 text-center">
          <div className="absolute inset-0 bg-gradient-to-r from-accent to-secondary-lavender opacity-80 z-0"></div>
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1606857521015-7f9fcf423740?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay z-0 opacity-40"></div>
          
          <div className="relative z-10 max-w-3xl mx-auto text-white">
            <h2 className="text-4xl md:text-5xl font-heading font-bold mb-6">Ready to Make an Impression?</h2>
            <p className="font-body text-lg mb-10 opacity-90">
              Get in touch with us today for a free quote on bulk orders, custom designs, and corporate gifting solutions.
            </p>
            {isAuthedAndVerified && (
              <PremiumButton variant="primary" className="bg-white text-accent hover:text-white px-10 py-5 text-lg shadow-2xl" onClick={openQuoteModal}>
                Request Free Quote
              </PremiumButton>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
