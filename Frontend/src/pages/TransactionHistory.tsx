import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  Search,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import Layout from '../components/Layout';
import { paymentApi } from '../lib/api';
import { formatCurrency, formatRelativeTime } from '../lib/utils';
import { TransactionHistory as TransactionHistoryType } from '../types';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState<TransactionHistoryType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await paymentApi.getTransactionHistory();
      const list = (response.data as any)?.transactions;
      setTransactions(Array.isArray(list) ? list : []);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch transactions');
      toast.error('Failed to load transaction history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    await fetchTransactions();
    toast.success('Transaction history refreshed');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Clock className="h-4 w-4" />;
      case 'Completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'Failed':
        return <XCircle className="h-4 w-4" />;
      case 'Refunded':
        return <RotateCcw className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Failed':
        return 'bg-red-100 text-red-800';
      case 'Refunded':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.transaction_ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.escrow_id.toString().includes(searchTerm) ||
      transaction.amount.toString().includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link
              to="/dashboard"
              className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Transaction History</h1>
            <p className="text-gray-600 mt-2">
              View all your payment transactions
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="btn btn-outline btn-md"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="card p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by transaction ref, escrow ID, or amount..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10 w-full"
                />
              </div>
            </div>
            <div className="md:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input w-full"
              >
                <option value="all">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
                <option value="Failed">Failed</option>
                <option value="Refunded">Refunded</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="card p-6">
            <div className="text-center">
              <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Error loading transactions
              </h4>
              <p className="text-gray-600 mb-4">{error}</p>
              <button onClick={fetchTransactions} className="btn btn-outline btn-sm">
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredTransactions.length === 0 && (
          <div className="card p-12">
            <div className="text-center">
              <CreditCard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h4 className="text-xl font-medium text-gray-900 mb-2">
                {searchTerm || statusFilter !== 'all' ? 'No matching transactions' : 'No transactions yet'}
              </h4>
              <p className="text-gray-600 mb-6">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Your payment transactions will appear here once you start making payments.'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Link to="/dashboard" className="btn btn-primary btn-lg">
                  Go to Dashboard
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Transactions List */}
        {!isLoading && !error && filteredTransactions.length > 0 && (
          <div className="space-y-4">
            {filteredTransactions.map((transaction) => (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div
                      className={`p-3 rounded-full ${getStatusColor(transaction.status)}`}
                    >
                      {getStatusIcon(transaction.status)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Transaction #{transaction.transaction_ref}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Escrow #{transaction.escrow_id} • {formatRelativeTime(transaction.created_at)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {transaction.currency} • {transaction.status}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900">
                      {formatCurrency(transaction.amount)}
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          transaction.status
                        )}`}
                      >
                        {getStatusIcon(transaction.status)}
                        <span className="ml-1">{transaction.status}</span>
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 mt-3">
                      <Link
                        to={`/escrow/${transaction.escrow_id}`}
                        className="btn btn-outline btn-sm"
                      >
                        View Escrow
                      </Link>
                      {transaction.payment_url && transaction.status === 'Pending' && (
                        <a
                          href={transaction.payment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-primary btn-sm"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Pay
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Stats Summary */}
        {!isLoading && !error && transactions.length > 0 && (
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{transactions.length}</p>
                <p className="text-sm text-gray-600">Total Transactions</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {transactions.filter(t => t.status === 'Completed').length}
                </p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">
                  {transactions.filter(t => t.status === 'Pending').length}
                </p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(transactions.reduce((sum, t) => sum + t.amount, 0))}
                </p>
                <p className="text-sm text-gray-600">Total Amount</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TransactionHistory;
