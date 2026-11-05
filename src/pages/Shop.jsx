import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiFilter, FiSearch } from 'react-icons/fi';
import ProductCard from '../components/ui/ProductCard';

const CATEGORIES = [
  "All", "Coffee Mugs", "Photo Frames", "Pens", "Keychains", 
  "Gift Boxes", "Corporate Hampers", "Customized Diaries", 
  "Trophies", "Flower Bouquets", "Greeting Cards", 
  "Personalized Gifts", "Wooden Crafts"
];

const PRODUCTS = [
  { id: 1, category: "Coffee Mugs", name: "Executive Coffee Mug", price: "₹199", rating: 4.8, image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?q=80&w=600&auto=format&fit=crop" },
  { id: 2, category: "Customized Diaries", name: "Premium Leather Diary", price: "₹349", rating: 5.0, image: "https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=600&auto=format&fit=crop" },
  { id: 3, category: "Pens", name: "Engraved Metal Pen", price: "₹299", rating: 4.9, image: "https://images.unsplash.com/photo-1585336261022-680e295ce3fe?q=80&w=600&auto=format&fit=crop" },
  { id: 4, category: "Corporate Hampers", name: "Corporate Gift Box", price: "₹1,299", rating: 5.0, image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=600&auto=format&fit=crop" },
  { id: 5, category: "Photo Frames", name: "Minimalist Photo Frame", price: "₹249", rating: 4.7, image: "https://images.unsplash.com/photo-1579762593175-20226054cad0?q=80&w=600&auto=format&fit=crop" },
  { id: 6, category: "Trophies", name: "Crystal Recognition Award", price: "₹599", rating: 4.9, image: "https://images.unsplash.com/photo-1563203369-26f2e4a5ccf7?q=80&w=600&auto=format&fit=crop" },
  { id: 7, category: "Keychains", name: "Engraved Leather Keychain", price: "₹149", rating: 4.5, image: "https://images.unsplash.com/photo-1590736969955-71cc94801759?q=80&w=600&auto=format&fit=crop" },
  { id: 8, category: "Wooden Crafts", name: "Handcrafted Desk Organizer", price: "₹499", rating: 4.8, image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=600&auto=format&fit=crop" },
];

const Shop = () => {
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredProducts = activeCategory === "All" 
    ? PRODUCTS 
    : PRODUCTS.filter(p => p.category === activeCategory);

  return (
    <div className="bg-primary-bg min-h-screen relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-secondary-lavender/30 rounded-full mix-blend-multiply filter blur-[100px] opacity-60"></div>
      <div className="absolute top-[40%] left-[-200px] w-[600px] h-[600px] bg-accent/20 rounded-full mix-blend-multiply filter blur-[120px] opacity-50"></div>

      {/* Hero Banner */}
      <section className="pt-32 pb-16 relative z-10">
        <div className="container mx-auto px-6 md:px-12">
          <div className="glass-card bg-gradient-to-r from-accent-light/50 to-secondary-skyblue/30 p-12 md:p-20 text-center relative overflow-hidden">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative z-10"
            >
              <h1 className="text-4xl md:text-6xl font-heading font-bold text-secondary-dark mb-6">
                Premium <span className="text-accent">Gift Collection</span>
              </h1>
              <p className="text-lg text-gray-700 font-body max-w-2xl mx-auto">
                Discover our curated selection of high-end corporate gifts, personalized items, and beautifully crafted accessories.
              </p>
            </motion.div>
            
            {/* Decorative mesh inside banner */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557682250-33bd709cbe85?q=80&w=2000&auto=format&fit=crop')] opacity-[0.03] mix-blend-overlay"></div>
          </div>
        </div>
      </section>

      <section className="pb-24 relative z-10">
        <div className="container mx-auto px-6 md:px-12">
          <div className="flex flex-col lg:flex-row gap-10">
            {/* Sidebar / Categories */}
            <div className="w-full lg:w-1/4">
              <div className="sticky top-32 glass-card p-6">
                <div className="flex items-center gap-2 mb-6 text-secondary-dark font-heading font-semibold text-xl">
                  <FiFilter /> <h2>Categories</h2>
                </div>
                
                <div className="relative mb-6">
                  <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search gifts..." 
                    className="w-full bg-white/50 border border-white/40 rounded-xl py-3 pl-12 pr-4 font-body text-sm focus:outline-none focus:border-accent transition-colors interactive"
                  />
                </div>

                <ul className="space-y-2">
                  {CATEGORIES.map(category => (
                    <li key={category}>
                      <button
                        onClick={() => setActiveCategory(category)}
                        className={`w-full text-left px-4 py-2.5 rounded-xl font-body text-sm transition-all duration-300 interactive ${
                          activeCategory === category 
                            ? 'bg-accent text-white font-semibold shadow-md' 
                            : 'text-gray-600 hover:bg-white/60 hover:text-secondary-dark'
                        }`}
                      >
                        {category}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Product Grid */}
            <div className="w-full lg:w-3/4">
              <div className="mb-6 flex justify-between items-center">
                <h3 className="font-heading text-2xl font-semibold text-secondary-dark">
                  {activeCategory === "All" ? "All Products" : activeCategory}
                </h3>
                <span className="font-body text-sm text-gray-500">{filteredProducts.length} Results</span>
              </div>

              <motion.div 
                layout
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
              >
                <AnimatePresence mode="popLayout">
                  {filteredProducts.map((product, index) => (
                    <motion.div
                      key={product.id}
                      layout
                      initial={{ opacity: 0, scale: 0.8, y: 50 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8, y: -50 }}
                      transition={{ 
                        type: "spring", 
                        bounce: 0.3,
                        duration: 0.6,
                        delay: index * 0.1 // stagger effect based on index
                      }}
                    >
                      <ProductCard {...product} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
              
              {filteredProducts.length === 0 && (
                <div className="text-center py-20">
                  <p className="text-gray-500 font-body text-lg">No products found in this category.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Shop;
