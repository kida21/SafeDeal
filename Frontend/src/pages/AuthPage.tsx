import { motion } from 'framer-motion';
import { Shield, ArrowLeft } from 'lucide-react';
import AuthForm from '../components/AuthForm';
import { useLocation, useNavigate } from 'react-router-dom';
import GreenGirl from '../assets/GreenGirl.jpg';

const AuthPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const modeParam = params.get('mode') === 'register' ? 'register' : 'login';

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      <div
        className="hidden md:flex relative items-center justify-center p-12 bg-black"
        style={{ backgroundImage: `url(${GreenGirl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 max-w-xl text-white">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-teal-900 flex items-center justify-center shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-3xl font-semibold">SafeDeal</span>
          </div>
          <h1 className="text-4xl font-bold mb-3">Transfer with confidence</h1>
          <p className="text-gray-200">Secure deals from around the world</p>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 md:p-10 bg-gray-50">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <button
            onClick={() => navigate('/')}
            className="mb-8 px-6 py-2 rounded-lg border-2 border-gray-400 text-gray-700 hover:bg-primary-900 hover:text-white transition w-sm max-w-md flex items-center justify-center"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span>Back to Home</span>
          </button>
          <AuthForm initialMode={modeParam as 'login' | 'register'} />
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;


