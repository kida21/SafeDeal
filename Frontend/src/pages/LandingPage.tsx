import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Send, 
  Wifi, 
  User, 
  ArrowRight, 
  Lock,
  Shield,
  Users,
  CheckCircle,
  Star,
  Clock,
  Award,
  Zap,
  Globe,
  Smartphone,
  CreditCard,
  Eye,
  TrendingUp,
  Sparkles,
  Heart,
  MessageCircle,
  Github,
  Twitter,
  Linkedin,
  Mail
} from 'lucide-react';
 
import Logo from "../assets/Logo.png";
import LandingBackground from "../assets/LandingBackground.jpg";
import PhoneNum from "../assets/PhoneNum.png";
import Transfer from "../assets/Transfer.png";
import ChapaLogo from "../assets/chapa.svg";
import EthereumLogo from "../assets/ethereum-eth-logo-full-horizontal.svg";
import GeminiLogo from "../assets/gemini-text.svg";
import GeminiLogo1 from "../assets/gemini.svg";


const LandingPage = () => {

  const steps = [
    {
      step: "STEP 1",
      title: "Create a contract between parties",
      description: "Set up your escrow agreement with clear terms and conditions for both buyer and seller.",
      icon: <CheckCircle className="h-6 w-6 text-[#005356]" />
    },
    {
      step: "STEP 2",
      title: "Buyer pays to the escrow",
      description: "Funds are securely held in escrow until all conditions are met by both parties.",
      icon: <Clock className="h-6 w-6 text-[#005356]" />
    },
    {
      step: "STEP 3",
      title: "Service or item gets delivered",
      description: "Seller delivers the agreed service or product according to the contract terms.",
      icon: <Send className="h-6 w-6 text-[#005356]" />
    },
    {
      step: "STEP 4",
      title: "Client releases the payment",
      description: "Once satisfied, buyer confirms delivery and funds are automatically released to seller.",
      icon: <Award className="h-6 w-6 text-[#005356]" />
    }
  ];

  const whyChooseUs = [
    {
      icon: <Zap className="h-8 w-8 text-[#005356]" />,
      title: "Lightning Fast",
      description: "Instant transactions and real-time updates"
    },
    {
      icon: <Shield className="h-8 w-8 text-[#005356]" />,
      title: "Bank-Level Security",
      description: "Military-grade encryption and smart contracts"
    },
    {
      icon: <Heart className="h-8 w-8 text-[#005356]" />,
      title: "Trusted by Thousands",
      description: "Join our growing community of satisfied users"
    },
    {
      icon: <MessageCircle className="h-8 w-8 text-[#005356]" />,
      title: "24/7 Support",
      description: "Get help whenever you need it"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Freelance Designer",
      content: "SafeDeal gave me the confidence to work with international clients. Payments are secure and instant!",
      rating: 5
    },
    {
      name: "Michael Chen",
      role: "E-commerce Seller",
      content: "The dispute resolution is fair and transparent. I've never felt more secure in my online transactions.",
      rating: 5
    },
    {
      name: "Emma Davis",
      role: "Digital Marketer",
      content: "Simple, fast, and reliable. SafeDeal has become essential for my business operations.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <img src={Logo} alt="SafeDeal Logo" className="h-20 md:h-32 w-auto" />
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8 items-center">
              <a href="#why-safedeal" className="text-gray-600 hover:text-gray-900 transition-colors">
                Why SafeDeal?
              </a>
              <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors">
                How It Works
              </a>
            </nav>

            {/* Sign In Button */}
            <Link to="/login?mode=login" className="btn bg-[#005356] text-white hover:bg-[#005356]/80 btn-md">
              Sign in
            </Link>
          </div>
        </div>
      </header>
{/* Hero Section */}
<section className="relative overflow-hidden py-[267px] lg:py-48">
  {/* Background Image Effect */}
  <div 
  className="absolute inset-0"
  style={{
    backgroundImage: `url(${LandingBackground})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  }}
  />

  <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ">
    <div className="grid lg:grid-cols-2 lg:gap-12 items-center">
      {/* Left Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-white text-center lg:text-left"
      >
        <h1 className="text-4xl lg:text-7xl font-semibold leading-tight mb-2 lg:mb-6 text-black">
          Secure Escrow
        </h1>
        <h2 className="text-3xl md:text-4xl lg:text-6xl leading-tight mb-4 lg:mb-6 text-black" >
          Made Simple
        </h2>
        <p className="text-sm md:text-xl text-gray-600 mb-8 mx-8 lg:mx-0">
        The world's most trusted escrow platform. Secure your deals, and trade with confidence.
        </p>

        <Link
            to="/login?mode=register"
            className="btn bg-[#005356] text-white hover:bg-[#005356]/80 btn-lg w-1/2 sm:w-auto h-12"
          >
            Get Started
          </Link>
<div className="flex flex-wrap items-center justify-center sm:justify-start gap-0 md:gap-8 opacity-60 mt-8">
  <img src={ChapaLogo} alt="Chapa" className="h-10 md:h-16 w-auto text-black" />
  <div className="flex space-x-2 h-5 md:h-8 w-auto">
  <img src={GeminiLogo1} alt="Gemini1" />
  <img src={GeminiLogo} alt="Gemini" />
  </div>
  <img src={EthereumLogo} alt="Ethereum" className="h-6 md:h-8 w-auto" />
</div>

      </motion.div>

      {/* Right Content */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="relative h-[400px] md:h-[500px] lg:h-[600px] hidden sm:block"
      >
        <img src={PhoneNum} alt="" className='border-2 border-transparent rounded-2xl w-auto h-80 relative left-[275px] top-[60px] z-10' />

        <img src={Transfer} alt="" className='border-2 border-transparent rounded-2xl w-auto h-[450px] relative bottom-[155px] left-10' />
      </motion.div>
    </div>
  </div>
</section>



      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-[#005356]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-[#005356]" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">1,458+</div>
              <div className="text-sm text-gray-600">Transactions</div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-[#005356]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-[#005356]" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">850+</div>
              <div className="text-sm text-gray-600">Active Users</div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-[#005356]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-[#005356]" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">100%</div>
              <div className="text-sm text-gray-600">Secure</div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-[#005356]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Globe className="h-8 w-8 text-[#005356]" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">24/7</div>
              <div className="text-sm text-gray-600">Available</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Visual Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              What is SafeDeal?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Next-generation escrow platform powered by blockchain
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-3xl p-8 text-center shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-[#005356] to-[#007a7d] rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Shield className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Secure</h3>
              <p className="text-gray-600">Military-grade encryption protects every transaction</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-white rounded-3xl p-8 text-center shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-[#005356] to-[#007a7d] rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Zap className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Fast</h3>
              <p className="text-gray-600">Instant transactions with automated smart contracts</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white rounded-3xl p-8 text-center shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-[#005356] to-[#007a7d] rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Globe className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Global</h3>
              <p className="text-gray-600">Trade with anyone, anywhere in the world</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section className="py-20 bg-gradient-to-br from-gray-900 via-[#005356] to-gray-900 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              See SafeDeal in Action
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Experience the future of secure transactions
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left - Interactive Elements */}
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Smartphone className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Mobile First</h3>
                    <p className="text-gray-300 text-sm">Trade on the go</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Instant Payments</h3>
                    <p className="text-gray-300 text-sm">Lightning fast transfers</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Eye className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Full Transparency</h3>
                    <p className="text-gray-300 text-sm">Track every step</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right - Visual Demo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="relative w-80 h-80 mx-auto">
                {/* Animated circles */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-2 border-white/20 rounded-full"
                />
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-8 border-2 border-white/30 rounded-full"
                />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-16 border-2 border-white/40 rounded-full"
                />
                
                {/* Center content */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4"
                    >
                      <Shield className="h-10 w-10 text-[#005356]" />
                    </motion.div>
                    <p className="text-lg font-semibold">Secured by</p>
                    <p className="text-sm text-gray-300">Blockchain Technology</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works - Visual Process */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              How SafeDeal Works?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Simple, secure, and transparent in 4 steps
            </p>
          </div>

          <div className="relative">
            {/* Connection Line */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-[#005356]/20 via-[#005356] to-[#005356]/20 transform -translate-y-1/2"></div>
            
            <div className="grid lg:grid-cols-4 gap-8 relative">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  className="text-center relative"
                >
                  {/* Step Circle */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: index * 0.2 + 0.3 }}
                    className="w-20 h-20 bg-gradient-to-br from-[#005356] to-[#007a7d] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg relative z-10"
                  >
                    <span className="text-white font-bold text-xl">{index + 1}</span>
                  </motion.div>
                  
                  {/* Icon */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.2 + 0.5 }}
                    className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  >
                    {step.icon}
                  </motion.div>
                  
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {step.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="text-center mt-16"
          >
            <Link
              to="/login?mode=register"
              className="btn bg-[#005356] text-white hover:bg-[#005356]/80 btn-lg shadow-lg hover:shadow-xl transition-all"
            >
              Start Your First Deal
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Why Choose SafeDeal Section */}
      <section id="why-safedeal" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Why Choose SafeDeal?
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Join thousands who trust SafeDeal for secure transactions
              </p>
            </motion.div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {whyChooseUs.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
              >
                <div className="w-16 h-16 bg-[#005356]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  {item.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Loved by Users Worldwide
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                See what our community has to say about SafeDeal
              </p>
            </motion.div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-gray-50 rounded-2xl p-8 relative"
              >
                {/* Quote decoration */}
                <div className="absolute top-4 right-4 text-[#005356]/20">
                  <Sparkles className="h-8 w-8" />
                </div>
                
                {/* Rating stars */}
                <div className="flex space-x-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                
                <p className="text-gray-700 mb-6 italic">
                  "{testimonial.content}"
                </p>
                
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-[#005356] rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 bg-gradient-to-r from-[#005356] to-[#007a7d]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Ready to Start Trading Safely?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Join thousands of users who trust SafeDeal for secure, transparent transactions
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/login?mode=register"
                className="btn bg-white text-[#005356] hover:bg-gray-100 btn-lg font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Get Started Free
              </Link>
              <Link
                to="#how-it-works"
                className="btn btn-outline border-white text-white hover:bg-white hover:text-[#005356] btn-lg"
              >
                Learn More
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            {/* Brand Section */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-[#005356] rounded-2xl flex items-center justify-center">
                  <Lock className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold">SafeDeal</span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                The world's most trusted escrow platform. Secure your deals and trade with confidence using blockchain technology.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-[#005356] transition-colors">
                  <Twitter className="h-5 w-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-[#005356] transition-colors">
                  <Linkedin className="h-5 w-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-[#005356] transition-colors">
                  <Github className="h-5 w-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-[#005356] transition-colors">
                  <Mail className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-3">
                <li><a href="#how-it-works" className="text-gray-400 hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#why-safedeal" className="text-gray-400 hover:text-white transition-colors">Why SafeDeal</a></li>
                <li><Link to="/login?mode=register" className="text-gray-400 hover:text-white transition-colors">Get Started</Link></li>
                <li><Link to="/login?mode=login" className="text-gray-400 hover:text-white transition-colors">Sign In</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 mb-4 md:mb-0">
                © 2024 SafeDeal. All rights reserved.
              </p>
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2 text-gray-400">
                  <Shield className="h-4 w-4" />
                  <span className="text-sm">Secured by Blockchain</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-400">
                  <Globe className="h-4 w-4" />
                  <span className="text-sm">Available Worldwide</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* No inline auth modal; navigation handled via /login */}
    </div>
  );
};

export default LandingPage;
