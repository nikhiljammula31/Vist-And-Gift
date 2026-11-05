import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiFilter, FiSearch, FiX } from 'react-icons/fi';
import ProductCard from '../components/ui/ProductCard';
import { CATEGORIES, PRODUCTS } from '../data/products';

const Shop = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = PRODUCTS.filter((p) => {
    const matchesCategory = activeCategory === "All" || p.category === activeCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase().trim()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="bg-primary-bg min-h-screen relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-secondary-lavender/30 rounded-full mix-blend-multiply filter blur-[100px] opacity-60 pointer-events-none" />
      <div className="absolute top-[40%] left-[-200px] w-[600px] h-[600px] bg-accent/20 rounded-full mix-blend-multiply filter blur-[120px] opacity-50 pointer-events-none" />

      {/* Hero Banner */}
      <section className="pt-32 pb-16 relative z-10">
        <div className="container mx-auto px-6 md:px-12">
          <div
            className="bg-gradient-to-r from-accent-light/50 to-secondary-skyblue/30 p-12 md:p-20 text-center relative overflow-hidden rounded-[32px] backdrop-blur-md"
            style={{
              border: '1px solid rgba(255, 160, 185, 0.20)',
              boxShadow: '0 12px 35px rgba(225, 145, 170, 0.08)',
            }}
          >
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
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557682250-33bd709cbe85?q=80&w=2000&auto=format&fit=crop')] opacity-[0.03] mix-blend-overlay pointer-events-none" />
          </div>
        </div>
      </section>

      <section className="pb-24 relative z-10">
        <div className="container mx-auto px-6 md:px-12">
          <div className="flex flex-col lg:flex-row gap-10 items-start">
            {/* Sidebar / Categories */}
            <div className="w-full lg:w-1/4">
              <div
                className="sticky top-32 p-6 rounded-[28px] bg-white/85 backdrop-blur-xl border transition-all duration-300"
                style={{
                  border: '1px solid rgba(255, 160, 185, 0.20)',
                  boxShadow: '0 12px 35px rgba(225, 145, 170, 0.06)',
                }}
              >
                <div className="flex items-center gap-2 mb-6 text-secondary-dark font-heading font-semibold text-xl">
                  <FiFilter className="text-accent-dark" /> <h2>Categories</h2>
                </div>

                {/* Search Gifts Input */}
                <div className="relative mb-6">
                  <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search gifts..."
                    className="w-full bg-white/80 border border-pink-100 rounded-xl py-3 pl-11 pr-9 font-body text-sm text-secondary-dark placeholder-gray-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                    >
                      <FiX className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <ul className="space-y-2">
                  {CATEGORIES.map((category) => (
                    <li key={category}>
                      <button
                        onClick={() => setActiveCategory(category)}
                        className={`w-full text-left px-4 py-2.5 rounded-xl font-body text-sm transition-all duration-300 cursor-pointer ${
                          activeCategory === category
                            ? 'bg-accent text-white font-semibold shadow-sm shadow-accent/25'
                            : 'text-gray-600 hover:bg-pink-50/60 hover:text-secondary-dark'
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
                <span className="font-body text-sm text-gray-500">
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'Result' : 'Results'}
                </span>
              </div>

              <motion.div
                layout
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-7 items-stretch"
              >
                <AnimatePresence mode="popLayout">
                  {filteredProducts.map((product, index) => (
                    <motion.div
                      key={product.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9, y: 30 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: -30 }}
                      transition={{
                        type: "spring",
                        bounce: 0.25,
                        duration: 0.5,
                        delay: Math.min(index * 0.06, 0.3),
                      }}
                      className="h-full"
                    >
                      <ProductCard {...product} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>

              {filteredProducts.length === 0 && (
                <div className="text-center py-20 px-6 rounded-3xl bg-white/60 border border-pink-100/60 my-6">
                  <p className="text-secondary-dark font-heading font-semibold text-xl mb-2">
                    No products found
                  </p>
                  <p className="text-gray-500 font-body text-sm max-w-sm mx-auto mb-5">
                    We couldn&apos;t find any gifts matching your criteria. Try adjusting your search query or category filter.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCategory("All");
                      setSearchQuery("");
                    }}
                    className="py-2.5 px-6 rounded-xl bg-accent text-white font-body text-xs font-semibold shadow-sm hover:shadow-md transition-all cursor-pointer"
                  >
                    Reset Filters
                  </button>
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
