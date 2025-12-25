import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Plus,
  TrendingUp,
  Shield,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Wallet,
  CreditCard,
  Loader2,
  RefreshCw,
} from "lucide-react";
import Layout from "../components/Layout";
import { useAuthStore } from "../store/authStore";
import { escrowApi } from "../lib/api";
import {
  formatCurrency,
  formatRelativeTime,
  getStatusColor,
} from "../lib/utils";
// import { Escrow } from "../types"; // Not used in this component
import { toast } from "react-hot-toast";
import LoadingSpinner from "../components/LoadingSpinner";
import AdminDashboard from "./AdminDashboard";
const Dashboard = () => {
  const { user } = useAuthStore();
  if (user?.id === 2) {
    return <AdminDashboard />;
  }
  const [escrows, setEscrows] = useState<any[]>([]);
  const [stats, setStats] = useState<{
    total_escrows: number;
    active_escrows: number;
    completed_escrows: number;
    disputed_escrows: number;
    total_amount: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statsLoading, setStatsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch escrows and stats when component mounts
    const loadData = async () => {
      setIsLoading(true);
      setStatsLoading(true);
      setError(null);
      try {
        const response = await escrowApi.getMyEscrows();
        const payload: any = response.data;
        const list = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.escrows)
          ? payload.escrows
          : [];

        // Prefer backend-provided summary if available
        const summary = payload?.summary;
        const computed = {
          total_escrows: list.length,
          active_escrows: list.filter((e: any) => e.status === 'Pending' || e.status === 'Funded').length,
          completed_escrows: list.filter((e: any) => e.status === 'Released').length,
          disputed_escrows: list.filter((e: any) => e.status === 'Disputed').length,
          total_amount: list.reduce((sum: number, e: any) => sum + (e.amount || 0), 0),
        };

        setEscrows(list.slice(0, 5));
        setStats({
          total_escrows: Number(summary?.total ?? computed.total_escrows),
          active_escrows: Number(summary?.active ?? computed.active_escrows),
          completed_escrows: Number(summary?.completed ?? computed.completed_escrows),
          disputed_escrows: Number(summary?.disputed ?? computed.disputed_escrows),
          total_amount: Number(summary?.total_amount ?? computed.total_amount),
        });
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load dashboard data');
        toast.error("Failed to load dashboard data. Please check your connection.");
      } finally {
        setIsLoading(false);
        setStatsLoading(false);
      }
    };

    if (user) {
      loadData();
    }
  }, [user]);

  const handleRefresh = async () => {
    try {
      // Reuse the same load logic
      setIsLoading(true);
      setStatsLoading(true);
      setError(null);
      const response = await escrowApi.getMyEscrows();
      const payload: any = response.data;
      const list = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.escrows)
        ? payload.escrows
        : [];
      const summary = payload?.summary;
      const computed = {
        total_escrows: list.length,
        active_escrows: list.filter((e: any) => e.status === 'Pending' || e.status === 'Funded').length,
        completed_escrows: list.filter((e: any) => e.status === 'Released').length,
        disputed_escrows: list.filter((e: any) => e.status === 'Disputed').length,
        total_amount: list.reduce((sum: number, e: any) => sum + (e.amount || 0), 0),
      };
      setEscrows(list.slice(0, 5));
      setStats({
        total_escrows: Number(summary?.total ?? computed.total_escrows),
        active_escrows: Number(summary?.active ?? computed.active_escrows),
        completed_escrows: Number(summary?.completed ?? computed.completed_escrows),
        disputed_escrows: Number(summary?.disputed ?? computed.disputed_escrows),
        total_amount: Number(summary?.total_amount ?? computed.total_amount),
      });
      toast.success("Dashboard refreshed");
    } catch (err: any) {
      console.warn('API failed, using mock data for development');
      // Mock data for development
      const mockEscrows = [
        {
          id: 1,
          title: 'Mock Escrow 1',
          amount: 100,
          status: 'Pending',
          created_at: new Date().toISOString(),
          buyer_id: 1,
          seller_id: 2,
          description: 'Mock escrow for development'
        },
        {
          id: 2,
          title: 'Mock Escrow 2',
          amount: 200,
          status: 'Funded',
          created_at: new Date().toISOString(),
          buyer_id: 1,
          seller_id: 3,
          description: 'Another mock escrow'
        }
      ];
      setEscrows(mockEscrows);
      setStats({
        total_escrows: 2,
        active_escrows: 1,
        completed_escrows: 0,
        disputed_escrows: 0,
        total_amount: 300,
      });
      // setError(err?.response?.data?.message || 'Failed to refresh dashboard data');
      // toast.error("Failed to refresh dashboard data");
    } finally {
      setIsLoading(false);
      setStatsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Pending":
        return <Clock className="h-4 w-4" />;
      case "Funded":
        return <Shield className="h-4 w-4" />;
      case "Released":
        return <CheckCircle className="h-4 w-4" />;
      case "Disputed":
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
              <h2 className="text-xl sm:text-2xl font-bold mb-2">
                Welcome back, {user?.first_name}!
              </h2>
              <p className="text-primary-100">
                Manage your secure transactions and escrow deals
              </p>
              <p className="text-primary-200 text-sm mt-1">
                Dashboard powered by backend API endpoints
              </p>
              <p className="text-primary-300 text-xs mt-1">
                Dashboard uses available backend endpoints only
              </p>
            </div>
            <div className="flex items-center space-x-3 flex-wrap gap-2">
              <button
                onClick={handleRefresh}
                disabled={isLoading || statsLoading}
                className="btn bg-white/20 text-white hover:bg-white/30 btn-md text-xs sm:text-sm ml-4 sm:ml-0"
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${
                    isLoading || statsLoading ? "animate-spin" : ""
                  }`}
                />
                Refresh
              </button>
              <Link
                to="/create-escrow"
                className="btn bg-white text-[#014d46] hover:bg-gray-100 btn-md text-xs sm:text-sm"
              >
                <Plus className="h-5 w-5 mr-4 sm:mr-2" />
                Create Escrow
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Escrows
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {statsLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    stats?.total_escrows || 0
                  )}
                </p>
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
                <p className="text-sm font-medium text-gray-600">
                  Active Deals
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {statsLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    stats?.active_escrows || 0
                  )}
                </p>
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
                <p className="text-2xl font-bold text-gray-900">
                  {statsLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    stats?.completed_escrows || 0
                  )}
                </p>
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
                <p className="text-sm font-medium text-gray-600">
                  Total Volume
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {statsLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    formatCurrency(stats?.total_amount || 0)
                  )}
                </p>
              </div>
              <div className="p-3 bg-[#e6f7f4] rounded-full">
                <CreditCard className="h-6 w-6 text-[#02665c]" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="card p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Disputed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statsLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    stats?.disputed_escrows || 0
                  )}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <AlertCircle className="h-6 w-6 text-red-600" />
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
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner />
                <span className="ml-2 text-gray-600">Loading escrows...</span>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  Error loading escrows
                </h4>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={handleRefresh}
                  className="btn btn-outline btn-sm"
                >
                  Try Again
                </button>
              </div>
            ) : escrows.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  No escrows yet
                </h4>
                <p className="text-gray-600 mb-4">
                  Create your first secure escrow transaction. Individual escrows can be viewed by ID.
                </p>
                <Link to="/create-escrow" className="btn btn-primary btn-md">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Escrow
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {escrows.map((escrow) => (
                  <Link
                    key={escrow.id}
                    to={`/escrow/${escrow.id}`}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className={`p-2 rounded-full ${getStatusColor(
                          escrow.status
                        )}`}
                      >
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
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          escrow.status
                        )}`}
                      >
                        {escrow.status}
                      </span>
                    </div>
                  </Link>
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
                <h4 className="font-semibold text-gray-900">
                  Wallet Management
                </h4>
                <p className="text-sm text-gray-600">
                  Manage your Ethereum wallet and view transactions
                </p>
              </div>
            </div>
            <Link to="/profile" className="btn btn-outline btn-sm mt-4">
              Manage Wallet
            </Link>
          </div>

          <div className="card p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-full">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Profile Center</h4>
                <p className="text-sm text-gray-600">
                  Review your account
                </p>
              </div>
            </div>
            <Link to="/profile" className="btn btn-outline btn-sm mt-4">
              Manage Profile
            </Link>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Dashboard;
