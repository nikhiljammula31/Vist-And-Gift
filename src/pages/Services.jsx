import { motion } from 'framer-motion';
import ServiceCard from '../components/ui/ServiceCard';

const Services = () => {
  const services = [
    {
      title: "Premium Visiting Cards",
      description: "Our ultra-thick, luxury textured cards with foil stamping and embossed details set you apart from the crowd.",
      image: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=800&auto=format&fit=crop"
    },
    {
      title: "Corporate Branding",
      description: "Comprehensive branding solutions including letterheads, envelopes, and complete office stationery.",
      image: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=800&auto=format&fit=crop"
    },
    {
      title: "Printing Services",
      description: "High-quality offset and digital printing for marketing collateral, brochures, and catalogs.",
      image: "https://images.unsplash.com/photo-1562240020-ce31ccb0fa7d?q=80&w=800&auto=format&fit=crop"
    },
    {
      title: "Gift Customization",
      description: "State-of-the-art laser engraving and embossing to personalize gifts with names, logos, or messages.",
      image: "https://images.unsplash.com/photo-1607344645866-009c320b63e0?q=80&w=800&auto=format&fit=crop"
    },
    {
      title: "Bulk Orders",
      description: "Efficient handling of large-scale corporate orders with dedicated account managers and fast turnaround.",
      image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=800&auto=format&fit=crop"
    },
    {
      title: "Gift Shop",
      description: "A curated collection of premium corporate gifts perfect for client appreciation and employee recognition.",
      image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=800&auto=format&fit=crop"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    show: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: "spring", bounce: 0.4, duration: 0.8 } 
    }
  };

  return (
    <div className="pt-32 pb-24 bg-gradient-to-br from-secondary-lavender/20 via-white to-secondary-skyblue/10 min-h-screen relative">
      {/* Decorative background elements */}
      <div className="absolute top-40 left-10 w-96 h-96 bg-accent/10 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary-peach/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>

      <div className="container mx-auto px-6 md:px-12 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h1 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-5xl font-heading font-bold text-secondary-dark mb-6"
          >
            Our Premium <span className="text-gradient">Services</span>
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-lg text-gray-600 font-body"
          >
            We blend cutting-edge technology with artisanal craftsmanship to deliver printing and gifting solutions that exceed expectations.
          </motion.p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10"
        >
          {services.map((service, index) => (
            <motion.div key={index} variants={cardVariants} className="h-full">
               <ServiceCard {...service} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default Services;
