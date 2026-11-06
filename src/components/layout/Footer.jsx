import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { FiFacebook, FiInstagram, FiLinkedin, FiMapPin, FiPhone, FiMail, FiClock, FiShield } from 'react-icons/fi';
import { FaWhatsapp, FaTwitter } from 'react-icons/fa';
import PremiumButton from '../common/PremiumButton';

const Footer = () => {
  const footerVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.98 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut",
        when: "beforeChildren",
        staggerChildren: 0.15
      }
    }
  };

  const columnVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  return (
    <motion.footer 
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.1 }}
      variants={footerVariants}
      className="relative overflow-hidden mt-20 z-10"
      style={{
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        background: 'rgba(255,255,255,0.18)',
        borderTop: '1px solid rgba(255,255,255,0.35)',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.08)'
      }}
    >
      {/* Background Animation inside Footer */}
      <div className="absolute inset-0 z-[-1] pointer-events-none overflow-hidden rounded-t-[40px]">
        {/* Liquid gradient mesh */}
        <motion.div 
          className="absolute inset-0 opacity-40"
          style={{
            background: 'linear-gradient(45deg, transparent, rgba(248,200,216,0.2), rgba(255,255,255,0.4), transparent)',
            backgroundSize: '200% 200%'
          }}
          animate={{ backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        />
        {/* Floating blurred rose milk pink blobs */}
        <motion.div 
          className="absolute top-[-50px] left-[-50px] w-64 h-64 bg-[#F8C8D8]/30 rounded-full mix-blend-multiply filter blur-[50px]"
          animate={{ x: [0, 30, 0], y: [0, 20, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-[-50px] right-[-50px] w-80 h-80 bg-[#FDE4EA]/40 rounded-full mix-blend-multiply filter blur-[60px]"
          animate={{ x: [0, -40, 0], y: [0, -30, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        {/* Tiny glowing particles */}
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={`footer-particle-${i}`}
            className="absolute w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
            animate={{ y: [0, -20], opacity: [0, 1, 0] }}
            transition={{ duration: 2 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 2 }}
          />
        ))}
      </div>

      <div className="container mx-auto px-6 md:px-12 pt-20 pb-8 rounded-t-[40px]">
        {/* 4 Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Column 1 - Company */}
          <motion.div variants={columnVariants}>
            <h2 className="text-3xl font-heading font-bold mb-6 text-secondary-dark">
              Visit <span className="text-accent">&</span> Gift
            </h2>
            <p className="text-gray-600 font-body mb-8 leading-relaxed">
              Premium Visiting Cards, Customized Gifts, Corporate Branding & Gift Decoration Solutions across India.
            </p>
          </motion.div>
          
          {/* Column 2 - Quick Links */}
          <motion.div variants={columnVariants}>
            <h3 className="text-xl font-heading font-semibold mb-6 text-secondary-dark">Quick Links</h3>
            <ul className="space-y-4 font-body text-gray-600">
              {['Home', 'Services', 'Shop Gifts', 'About', 'Contact'].map((item) => {
                const path = item === 'Home' ? '/' : item === 'Shop Gifts' ? '/shop' : `/${item.toLowerCase()}`;
                return (
                  <li key={item}>
                    <NavLink to={path} className="relative inline-flex hover:text-accent transition-colors duration-300 group interactive">
                      {item}
                      <span className="absolute left-0 bottom-[-2px] w-0 h-[2px] bg-accent transition-all duration-300 group-hover:w-full shadow-[0_0_8px_rgba(248,200,216,0.6)]"></span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </motion.div>
          
          {/* Column 3 - Contact Details */}
          <motion.div variants={columnVariants}>
            <h3 className="text-xl font-heading font-semibold mb-6 text-secondary-dark">Contact Details</h3>
            <ul className="space-y-5 font-body text-gray-600 text-sm">
              <li className="flex items-start gap-3">
                <FiMapPin className="w-5 h-5 text-accent shrink-0 mt-1" />
                <span>Visit & Gift<br/>MG Road<br/>Bengaluru<br/>Karnataka – 560001<br/>India</span>
              </li>
              <li className="flex items-center gap-3">
                <FiPhone className="w-5 h-5 text-accent shrink-0" />
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-center gap-3">
                <FiMail className="w-5 h-5 text-accent shrink-0" />
                <span>contact@visitandgift.in</span>
              </li>
              <li className="flex items-center gap-3">
                <FiClock className="w-5 h-5 text-accent shrink-0" />
                <span>Mon – Sat<br/>9:00 AM – 7:00 PM</span>
              </li>
            </ul>
          </motion.div>
          
          {/* Column 4 - Follow Us */}
          <motion.div variants={columnVariants}>
            <h3 className="text-xl font-heading font-semibold mb-6 text-secondary-dark">Follow Us</h3>
            <div className="flex flex-wrap gap-4">
              {[FiFacebook, FiInstagram, FaTwitter, FiLinkedin].map((Icon, idx) => (
                <motion.a
                  key={idx}
                  href="#"
                  className="w-12 h-12 rounded-full bg-white/40 border border-white/60 flex items-center justify-center text-secondary-dark hover:bg-accent hover:text-white transition-colors interactive relative group shadow-sm"
                  whileHover={{ scale: 1.15, rotate: 5, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="absolute inset-0 rounded-full bg-accent/0 group-hover:bg-accent/20 group-hover:shadow-[0_0_20px_rgba(248,184,200,0.6)] transition-all duration-300" />
                  <Icon className="w-5 h-5 relative z-10" />
                </motion.a>
              ))}
              {/* WhatsApp Icon */}
              <motion.a
                href="https://wa.me/919876543210"
                target="_blank"
                rel="noreferrer"
                className="w-12 h-12 rounded-full bg-white/40 border border-white/60 flex items-center justify-center text-secondary-dark hover:bg-green-500 hover:text-white transition-colors interactive relative group shadow-sm"
                whileHover={{ scale: 1.15, rotate: 5, y: -5 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="absolute inset-0 rounded-full bg-green-500/0 group-hover:bg-green-500/20 group-hover:shadow-[0_0_20px_rgba(34,197,94,0.6)] transition-all duration-300" />
                <FaWhatsapp className="w-6 h-6 relative z-10" />
              </motion.a>
            </div>
          </motion.div>
          
        </div>
        
        {/* Newsletter Section */}
        <motion.div variants={columnVariants} className="max-w-md mx-auto text-center mb-16 relative">
           <h3 className="text-2xl font-heading font-bold mb-6 text-secondary-dark">Stay Updated</h3>
           <form className="flex flex-col sm:flex-row gap-3">
             <input 
               type="email" 
               placeholder="Enter your email" 
               className="flex-grow bg-white/50 border border-white/60 rounded-full px-6 py-4 font-body text-sm focus:outline-none focus:border-accent focus:bg-white transition-all focus:shadow-[0_0_20px_rgba(248,184,200,0.3)] interactive text-secondary-dark placeholder-gray-500"
               required
             />
             <PremiumButton variant="gradient" className="rounded-full py-4 px-8" icon={false}>
               Subscribe
             </PremiumButton>
           </form>
        </motion.div>

        {/* Footer Bottom */}
        <motion.div variants={columnVariants} className="border-t border-secondary-dark/10 pt-8 flex flex-col md:flex-row justify-between items-center text-gray-500 font-body text-sm gap-4">
          <p>© 2026 Visit & Gift. All Rights Reserved.</p>
          <div className="flex flex-wrap items-center gap-6">
            {['Privacy Policy', 'Terms & Conditions', 'Return Policy'].map((link) => (
              <a key={link} href="#" className="relative inline-flex hover:text-accent transition-colors duration-300 group interactive">
                {link}
                <span className="absolute left-0 bottom-[-2px] w-0 h-[1px] bg-accent transition-all duration-300 group-hover:w-full"></span>
              </a>
            ))}
            <NavLink
              to="/login?mode=admin"
              className="relative inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-accent transition-colors duration-300 group interactive"
              title="Staff & Administrator Portal"
            >
              <FiShield className="w-3.5 h-3.5 text-gray-400 group-hover:text-accent transition-colors" />
              <span>Admin Access</span>
            </NavLink>
          </div>
        </motion.div>
      </div>
    </motion.footer>
  );
};

export default Footer;
