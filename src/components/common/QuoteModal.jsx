import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuote } from '../../context/QuoteContext';
import PremiumButton from './PremiumButton';
import { FiX, FiCheckCircle } from 'react-icons/fi';

const QuoteModal = () => {
  const { isQuoteModalOpen, closeQuoteModal } = useQuote();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    businessName: '',
    requirement: 'Visiting Cards',
    quantity: '',
    message: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      closeQuoteModal();
      setFormData({
        name: '',
        phone: '',
        email: '',
        businessName: '',
        requirement: 'Visiting Cards',
        quantity: '',
        message: ''
      });
    }, 3000);
  };

  return (
    <AnimatePresence>
      {isQuoteModalOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div 
            className="absolute inset-0 bg-secondary-dark/60 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeQuoteModal}
          />

          {/* Modal Container */}
          <motion.div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-card rounded-2xl shadow-2xl bg-white/90 border border-white p-8"
            initial={{ y: 50, scale: 0.9, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 50, scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Close Button */}
            <button 
              onClick={closeQuoteModal}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-500 hover:text-accent hover:shadow-md transition-all z-10"
            >
              <FiX className="w-5 h-5" />
            </button>

            {submitted ? (
              <motion.div 
                className="flex flex-col items-center justify-center py-20"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <FiCheckCircle className="w-20 h-20 text-green-500 mb-6" />
                <h3 className="text-2xl font-heading font-bold text-secondary-dark text-center">
                  Quote Request Submitted Successfully!
                </h3>
                <p className="text-gray-500 mt-2 font-body text-center">
                  Our team will get back to you shortly.
                </p>
              </motion.div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-heading font-bold text-secondary-dark mb-2">Request a Quote</h2>
                  <p className="text-gray-500 font-body">Fill out the form below and we'll craft a custom proposal for you.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 font-body">Full Name</label>
                      <input 
                        required
                        type="text" 
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl bg-white/50 border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all font-body"
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 font-body">Phone Number</label>
                      <input 
                        required
                        type="tel" 
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl bg-white/50 border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all font-body"
                        placeholder="+91 98765 43210"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 font-body">Email Address</label>
                      <input 
                        required
                        type="email" 
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl bg-white/50 border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all font-body"
                        placeholder="john@company.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 font-body">Business Name</label>
                      <input 
                        type="text" 
                        name="businessName"
                        value={formData.businessName}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl bg-white/50 border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all font-body"
                        placeholder="Company Ltd."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 font-body">Requirement</label>
                      <select 
                        name="requirement"
                        value={formData.requirement}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl bg-white/50 border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all font-body text-gray-700"
                      >
                        <option>Premium Visiting Cards</option>
                        <option>Corporate Gift Boxes</option>
                        <option>Custom Engraving</option>
                        <option>Bulk Order</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 font-body">Quantity</label>
                      <input 
                        required
                        type="number" 
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleChange}
                        min="1"
                        className="w-full px-4 py-3 rounded-xl bg-white/50 border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all font-body"
                        placeholder="100"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 font-body">Message</label>
                    <textarea 
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows="4"
                      className="w-full px-4 py-3 rounded-xl bg-white/50 border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all font-body resize-none"
                      placeholder="Tell us about your specific requirements..."
                    ></textarea>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <PremiumButton type="submit" variant="gradient" className="flex-1">
                      Submit Quote
                    </PremiumButton>
                    <button 
                      type="button"
                      onClick={closeQuoteModal}
                      className="flex-1 py-4 px-8 rounded-full font-body font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default QuoteModal;
