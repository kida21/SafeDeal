import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Globe, 
  Send, 
  Wifi, 
  User, 
  ArrowRight, 
  Lock,
 
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

  const features = [
    {
      icon: <Zap className="h-8 w-8 text-primary-600" />,
      title: "Instant Deals",
      description: "Create and launch escrow transactions in just a few clicks. SafeDeal supports instant payments without delays."
    },
    {
      icon: <Globe className="h-8 w-8 text-primary-600" />,
      title: "Global Accessibility",
      description: "Work with anyone, anywhere. SafeDeal supports transactions across multiple currencies, so deals aren't limited by borders."
    },
    {
      icon: <Send className="h-8 w-8 text-primary-600" />,
      title: "Dispute Resolution",
      description: "Stay protected when things don't go as planned. SafeDeal offers a fair dispute resolution, ensuring both parties are treated in case of conflicts."
    }
  ];

  const benefits = [
    {
      icon: <Wifi className="h-6 w-6 text-primary-600" />,
      text: "You can withdraw funds instantly once deals are completed"
    },
    {
      icon: (
        <div className="flex items-center space-x-1">
          <User className="h-4 w-4 text-primary-600" />
          <ArrowRight className="h-4 w-4 text-primary-600" />
          <Lock className="h-4 w-4 text-primary-600" />
        </div>
      ),
      text: "Holds payments safely until both sides fulfill the agreement"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="relative z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <img src={Logo} alt="SafeDeal Logo" className="h-32 w-auto" />
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
<section className="relative overflow-hidden py-6 lg:py-12">
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
    <div className="grid lg:grid-cols-2 gap-12 items-center">
      {/* Left Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-white"
      >
        <h1 className="text-6xl lg:text-7xl font-medium leading-tight mb-6 text-black">
          Secure Escrow
        </h1>
        <h2 className="text-4xl lg:text-6xl leading-tight mb-6 text-black" >
          Made Simple
        </h2>
        <p className="text-xl text-gray-600 mb-8">
        The world's most trusted escrow platform. Secure your deals, and trade with confidence.
        </p>

        <Link
            to="/login?mode=register"
            className="btn bg-[#005356] text-white hover:bg-[#005356]/80 btn-lg w-auto h-12"
          >
            Get Started
          </Link>
<div className="flex items-center gap-8 opacity-60 mt-8">
  <img src={ChapaLogo} alt="Chapa" className="h-16 sm:h-16 w-auto text-black" />
  <div className="flex space-x-2 h-8 sm:h-7 w-auto">
  <img src={GeminiLogo1} alt="Gemini1" />
  <img src={GeminiLogo} alt="Gemini" />
  </div>
  <img src={EthereumLogo} alt="Ethereum" className="h-8 sm:h-10 w-auto" />
</div>

      </motion.div>

      {/* Right Content */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="space-y-8"
      >
        {/* Main Content Card */}
        <img src={PhoneNum} alt="" className='border-2 border-transparent rounded-2xl w-auto h-80 relative left-[275px] top-[60px] z-10' />

        {/* Transfer Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          
        >
          <img src={Transfer} alt="" className='border-2 border-transparent rounded-2xl w-auto h-[450px] relative bottom-[155px] left-10' />
        </motion.div>
      </motion.div>
    </div>
  </div>
</section>



      {/* Future Transaction Section */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Future Transaction
            </p>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Experience that grows with your scale
            </h2>
            {/* <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Our blockchain-based smart contracts ensure secure, transparent, and automated escrow transactions. 
              With multi-signature logic and immutable records, your deals are protected by cutting-edge technology.
            </p> */}
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="flex justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why SafeDeal Section */}
      <section id="why-safedeal" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Why Us
            </p>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Why they prefer SafeDeal
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    {benefit.icon}
                  </div>
                  <p className="text-gray-700">
                    {benefit.text}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Fair Handling Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Fair Handling
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            SafeDeal provides transparent and secure fund management, ensuring that all parties 
            are treated fairly throughout the transaction process. Our smart contracts eliminate 
            the need for trust by automating the release of funds based on predefined conditions.
          </p>
          <Link
            to="/login?mode=register"
            className="btn bg-[#005356] text-white hover:bg-[#005356]/80 btn-lg"
          >
            Start Your First Deal
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="flex items-center justify-center w-8 h-8 bg-primary-600 rounded-lg">
                <Lock className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold">SafeDeal</span>
            </div>
            <p className="text-gray-400">
              © 2024 SafeDeal. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* No inline auth modal; navigation handled via /login */}
    </div>
  );
};

export default LandingPage;
