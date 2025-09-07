import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Plus, 
  TrendingUp, 
  Shield, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ArrowRight,
  Wallet,
  CreditCard
} from 'lucide-react';
import Layout from '../components/Layout';
import { useAuthStore } from '../store/authStore';
import { useEscrowStore } from '../store/escrowStore';
import { formatCurrency, formatRelativeTime, getStatusColor } from '../lib/utils';
import { Escrow } from '../types';
import { toast } from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useAuthStore();
  const { escrows } = useEscrowStore();
  const [stats, setStats] = useState({
    totalEscrows: 0,
    activeEscrows: 0,
    completedEscrows: 0,
    totalAmount: 0,
  });

  useEffect(() => {
    // Escrow list endpoint is not available in the backend yet.
    // We'll show the dashboard with available info only.
  }, []);

  // Note: When the backend exposes a list endpoint, we can fetch and compute stats here.

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Clock className="h-4 w-4" />;
      case 'Funded':
        return <Shield className="h-4 w-4" />;
      case 'Released':
        return <CheckCircle className="h-4 w-4" />;
      case 'Disputed':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="gradient-primary rounded-2xl p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                Welcome back, {user?.first_name}!
              </h2>
              <p className="text-primary-100">
                Manage your secure transactions and escrow deals
              </p>
            </div>
            <Link
              to="/create-escrow"
              className="btn bg-white text-[#014d46] hover:bg-gray-100 btn-lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Escrow
            </Link>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Escrows</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalEscrows}</p>
              </div>
              <div className="p-3 bg-[#e6f7f4] rounded-full">
                <TrendingUp className="h-6 w-6 text-[#014d46]" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Deals</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeEscrows}</p>
              </div>
              <div className="p-3 bg-[#e6f7f4] rounded-full">
                <Shield className="h-6 w-6 text-[#02665c]" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedEscrows}</p>
              </div>
              <div className="p-3 bg-[#e6f7f4] rounded-full">
                <CheckCircle className="h-6 w-6 text-[#014d46]" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Volume</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.totalAmount)}
                </p>
              </div>
              <div className="p-3 bg-[#e6f7f4] rounded-full">
                <CreditCard className="h-6 w-6 text-[#02665c]" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Recent Escrows */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card"
        >
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Recent Escrows</h3>
              <Link
                to="/escrows"
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
              >
                View all
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </div>
          <div className="card-content">
            {escrows.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No escrows yet</h4>
                <p className="text-gray-600 mb-4">
                  Create your first secure escrow transaction
                </p>
                <Link
                  to="/create-escrow"
                  className="btn btn-primary btn-md"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Escrow
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {escrows.slice(0, 5).map((escrow) => (
                  <div
                    key={escrow.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-full ${getStatusColor(escrow.status)}`}>
                        {getStatusIcon(escrow.status)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          Escrow #{escrow.id}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatRelativeTime(escrow.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(escrow.amount)}
                      </p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(escrow.status)}`}>
                        {escrow.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <div className="card p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-primary-100 rounded-full">
                <Wallet className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Wallet Management</h4>
                <p className="text-sm text-gray-600">
                  Manage your Ethereum wallet and view transactions
                </p>
              </div>
            </div>
            <Link
              to="/profile"
              className="btn btn-outline btn-sm mt-4"
            >
              Manage Wallet
            </Link>
          </div>

          <div className="card p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-full">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Security Center</h4>
                <p className="text-sm text-gray-600">
                  Review your account security and settings
                </p>
              </div>
            </div>
            <Link
              to="/profile"
              className="btn btn-outline btn-sm mt-4"
            >
              Security Settings
            </Link>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Dashboard;
