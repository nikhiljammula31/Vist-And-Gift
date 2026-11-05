import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiMapPin, FiPhone, FiMail, FiClock } from 'react-icons/fi';
import PremiumButton from '../components/common/PremiumButton';
import { fadeInUp, staggerContainer } from '../utils/animations';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const [focusedInput, setFocusedInput] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real app, integrate with Formspree or EmailJS here
    console.log(formData);
    alert('Thank you for your message! We will get back to you soon.');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const contactInfo = [
    { icon: FiMapPin, title: "Our Location", text: "Visit & Gift, MG Road, Bengaluru, Karnataka, India" },
    { icon: FiPhone, title: "Phone Number", text: "+91 98765 43210" },
    { icon: FiMail, title: "Email Address", text: "contact@visitandgift.in" },
    { icon: FiClock, title: "Working Hours", text: "Mon - Sat: 9:00 AM - 6:00 PM" }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-primary-bg min-h-screen pt-32 pb-24"
    >
      <div className="container mx-auto px-6 md:px-12">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-5xl font-heading font-bold text-secondary-dark mb-6"
          >
            Get In <span className="text-gradient">Touch</span>
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-600 font-body"
          >
            Have a question about bulk orders or custom designs? We're here to help you make the best impression.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Contact Form */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="bg-white p-10 rounded-[30px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100"
          >
            <h3 className="text-3xl font-heading font-bold text-secondary-dark mb-8">Send a Message</h3>
            <form onSubmit={handleSubmit} className="space-y-6 font-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Your Name</label>
                  <input 
                    type="text" 
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    onFocus={() => setFocusedInput('name')}
                    onBlur={() => setFocusedInput(null)}
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none transition-all duration-300 interactive"
                    style={{
                      boxShadow: focusedInput === 'name' ? '0 0 0 3px rgba(248,184,200,0.3)' : 'none',
                      borderColor: focusedInput === 'name' ? '#F8B8C8' : '#e5e7eb'
                    }}
                    required
                  />
                </div>
                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onFocus={() => setFocusedInput('email')}
                    onBlur={() => setFocusedInput(null)}
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none transition-all duration-300 interactive"
                    style={{
                      boxShadow: focusedInput === 'email' ? '0 0 0 3px rgba(248,184,200,0.3)' : 'none',
                      borderColor: focusedInput === 'email' ? '#F8B8C8' : '#e5e7eb'
                    }}
                    required
                  />
                </div>
              </div>
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                <input 
                  type="text" 
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  onFocus={() => setFocusedInput('subject')}
                  onBlur={() => setFocusedInput(null)}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none transition-all duration-300 interactive"
                  style={{
                    boxShadow: focusedInput === 'subject' ? '0 0 0 3px rgba(248,184,200,0.3)' : 'none',
                    borderColor: focusedInput === 'subject' ? '#F8B8C8' : '#e5e7eb'
                  }}
                  required
                />
              </div>
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
                <textarea 
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  onFocus={() => setFocusedInput('message')}
                  onBlur={() => setFocusedInput(null)}
                  rows="5"
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none transition-all duration-300 interactive resize-none"
                  style={{
                    boxShadow: focusedInput === 'message' ? '0 0 0 3px rgba(248,184,200,0.3)' : 'none',
                    borderColor: focusedInput === 'message' ? '#F8B8C8' : '#e5e7eb'
                  }}
                  required
                ></textarea>
              </div>
              <PremiumButton variant="gradient" className="w-full" icon={false}>
                Send Message
              </PremiumButton>
            </form>
          </motion.div>

          {/* Contact Information */}
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {contactInfo.map((info, idx) => (
                <motion.div 
                  key={idx} 
                  variants={fadeInUp}
                  className="bg-secondary-skyblue/10 p-8 rounded-2xl border border-secondary-skyblue/20 hover:bg-secondary-skyblue/20 transition-colors"
                >
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-accent mb-6 shadow-sm">
                    <info.icon className="w-5 h-5" />
                  </div>
                  <h4 className="font-heading font-semibold text-xl text-secondary-dark mb-2">{info.title}</h4>
                  <p className="font-body text-gray-600">{info.text}</p>
                </motion.div>
              ))}
            </div>

            <motion.div variants={fadeInUp} className="w-full h-[300px] rounded-2xl overflow-hidden shadow-lg mt-auto">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d193595.2528000654!2d-74.14483031080351!3d40.69766374865767!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c24fa5d33f083b%3A0xc80b8f06e177fe62!2sNew%20York%2C%20NY%2C%20USA!5e0!3m2!1sen!2s!4v1700000000000!5m2!1sen!2s" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen="" 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                className="grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
              ></iframe>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default Contact;
