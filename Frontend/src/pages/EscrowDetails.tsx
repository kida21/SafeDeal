import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Shield, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  User,
  DollarSign,
  FileText,
  MessageCircle,
  CreditCard,
  ExternalLink
} from 'lucide-react';
import Layout from '../components/Layout';
import { useAuthStore } from '../store/authStore';
import { escrowApi, paymentApi } from '../lib/api';
import { formatCurrency, formatDate, getStatusColor } from '../lib/utils';
import { Escrow, EscrowPayment } from '../types';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import ChatModal from '../components/ChatModal';
import PaymentModal from '../components/PaymentModal';

const EscrowDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const [escrow, setEscrow] = useState<Escrow | null>(null);
  const [payment, setPayment] = useState<EscrowPayment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    if (id) {
      fetchEscrowDetails();
    }
  }, [id]);

  const fetchEscrowDetails = async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      const response = await escrowApi.getById(parseInt(id));
      setEscrow(response.data);
    } catch (error) {
      toast.error('Failed to fetch escrow details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!escrow) return;
    
    setIsProcessing(true);
    try {
      await escrowApi.accept(escrow.id);
      toast.success('Escrow accepted successfully!');
      fetchEscrowDetails();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to accept escrow');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmReceipt = async () => {
    if (!escrow) return;
    
    setIsProcessing(true);
    try {
      await escrowApi.confirmReceipt(escrow.id);
      toast.success('Receipt confirmed! Funds will be released to the seller.');
      fetchEscrowDetails();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to confirm receipt');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInitiatePayment = async () => {
    if (!escrow) return;
    
    setIsProcessing(true);
    try {
      const response = await paymentApi.initiateEscrowPayment(escrow.id);
      setPayment(response.data);
      setShowPayment(true);
      toast.success('Payment initiated! Please complete the payment.');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to initiate payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentComplete = () => {
    setShowPayment(false);
    fetchEscrowDetails();
    toast.success('Payment completed successfully!');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Clock className="h-5 w-5" />;
      case 'Funded':
        return <Shield className="h-5 w-5" />;
      case 'Released':
        return <CheckCircle className="h-5 w-5" />;
      case 'Disputed':
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  const isBuyer = user?.id === escrow?.buyer_id;
  const isSeller = user?.id === escrow?.seller_id;

  if (isLoading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  if (!escrow) {
    return (
      <Layout>
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Escrow not found</h3>
          <p className="text-gray-600 mb-4">The escrow you're looking for doesn't exist.</p>
          <Link to="/dashboard" className="btn btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Escrow #{escrow.id}
              </h1>
              <p className="text-gray-600 mt-2">
                Created on {formatDate(escrow.created_at)}
              </p>
            </div>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(escrow.status)}`}>
              {getStatusIcon(escrow.status)}
              <span className="ml-2">{escrow.status}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Transaction Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Transaction Details
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-600">Amount</span>
                  </div>
                  <span className="font-semibold text-lg">
                    {formatCurrency(escrow.amount)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-600">Buyer</span>
                  </div>
                  <span className="font-medium">
                    {isBuyer ? 'You' : `User #${escrow.buyer_id}`}
                  </span>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-600">Seller</span>
                  </div>
                  <span className="font-medium">
                    {isSeller ? 'You' : `User #${escrow.seller_id}`}
                  </span>
                </div>

                {escrow.conditions && (
                  <div className="py-3">
                    <div className="flex items-start space-x-3">
                      <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <span className="text-gray-600 block mb-2">Conditions</span>
                        <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                          {escrow.conditions}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Actions
              </h3>
              <div className="space-y-4">
                {escrow.status === 'Pending' && isSeller && (
                  <button
                    onClick={handleAccept}
                    disabled={isProcessing}
                    className="btn btn-primary btn-lg w-full"
                  >
                    {isProcessing ? 'Processing...' : 'Accept Escrow'}
                  </button>
                )}

                {escrow.status === 'Pending' && isBuyer && (
                  <button
                    onClick={handleInitiatePayment}
                    disabled={isProcessing}
                    className="btn btn-primary btn-lg w-full"
                  >
                    {isProcessing ? 'Processing...' : 'Make Payment'}
                  </button>
                )}

                {escrow.status === 'Funded' && isBuyer && (
                  <button
                    onClick={handleConfirmReceipt}
                    disabled={isProcessing}
                    className="btn btn-primary btn-lg w-full"
                  >
                    {isProcessing ? 'Processing...' : 'Confirm Receipt'}
                  </button>
                )}

                {escrow.status === 'Funded' && isSeller && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                      <div>
                        <h4 className="text-sm font-medium text-green-900">
                          Payment Received
                        </h4>
                        <p className="text-sm text-green-700 mt-1">
                          The buyer has made the payment. Waiting for receipt confirmation.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {escrow.status === 'Released' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-blue-600 mr-3" />
                      <div>
                        <h4 className="text-sm font-medium text-blue-900">
                          Transaction Completed
                        </h4>
                        <p className="text-sm text-blue-700 mt-1">
                          The escrow has been completed and funds have been released.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Chat Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Communication
                </h3>
                <button 
                  onClick={() => setShowChat(true)}
                  className="btn btn-outline btn-sm"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Open Chat
                </button>
              </div>
              <p className="text-gray-600">
                Communicate with the other party about this transaction.
              </p>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Status */}
            {payment && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="card p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Payment Status
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`font-medium ${getStatusColor(payment.status)}`}>
                      {payment.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reference:</span>
                    <span className="font-mono text-sm">
                      {payment.transaction_ref.slice(0, 8)}...
                    </span>
                  </div>
                  {payment.payment_url && (
                    <a
                      href={payment.payment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline btn-sm w-full"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Complete Payment
                    </a>
                  )}
                </div>
              </motion.div>
            )}

            {/* Blockchain Info */}
            {escrow.blockchain_tx_hash && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="card p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Blockchain Record
                </h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-gray-600 text-sm">Transaction Hash:</span>
                    <p className="font-mono text-sm bg-gray-100 p-2 rounded mt-1">
                      {escrow.blockchain_tx_hash}
                    </p>
                  </div>
                  {escrow.blockchain_escrow_id && (
                    <div>
                      <span className="text-gray-600 text-sm">Escrow ID:</span>
                      <p className="font-mono text-sm">
                        #{escrow.blockchain_escrow_id}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Help */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="card p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Need Help?
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Having issues with this transaction? Our support team is here to help.
              </p>
              <button className="btn btn-outline btn-sm w-full">
                Contact Support
              </button>
            </motion.div>
          </div>
        </div>

        {/* Chat Modal */}
        {showChat && (
          <ChatModal
            isOpen={showChat}
            onClose={() => setShowChat(false)}
            escrowId={escrow.id}
          />
        )}

        {/* Payment Modal */}
        {showPayment && payment && (
          <PaymentModal
            isOpen={showPayment}
            onClose={() => setShowPayment(false)}
            amount={payment.amount}
            paymentUrl={payment.payment_url}
            onPaymentComplete={handlePaymentComplete}
          />
        )}
      </div>
    </Layout>
  );
};

export default EscrowDetails;
