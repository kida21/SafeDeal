import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Shield, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  User,
  MessageCircle,
  CreditCard,
  Phone,
  X,
  FileText,
  ExternalLink
} from 'lucide-react';
import Layout from '../components/Layout';
import { useAuthStore } from '../store/authStore';
import { escrowApi, paymentApi } from '../lib/api';
import { formatCurrency, getStatusColor } from '../lib/utils';
import { Escrow, EscrowPayment } from '../types';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import RealTimeChat from '../components/RealTimeChat';
import PaymentModal from '../components/PaymentModal';
import { motion, AnimatePresence } from 'framer-motion';

const formatDateSafe = (date: string | number | Date | null | undefined) => {
  if (!date) return "Unknown date";

  let d: Date;

  if (typeof date === "string") {
    // Convert "2025-09-14 12:49:29.00232+00" → "2025-09-14T12:49:29.002+00"
    const normalized = date
      .replace(" ", "T")
      .replace(/(\.\d{3})\d+/, "$1"); // trim microseconds
    d = new Date(normalized);
  } else {
    d = new Date(date);
  }

  if (isNaN(d.getTime())) return "Unknown date";

  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const EscrowDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const [escrow, setEscrow] = useState<Escrow | null>(null);
  const [payment, setPayment] = useState<EscrowPayment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    if (id) {
      fetchEscrowDetails();
    }
  }, [id]);

  const fetchEscrowDetails = async (retryCount = 0) => {
    if (!id) return;

    // Don't show loading spinner on retries to make it seamless
    if (retryCount === 0) {
      setIsLoading(true);
    }

    try {
      const response = await escrowApi.getById(parseInt(id));
      setEscrow(response.data);
      // If it succeeds on a retry, clear any potential error messages
      if (retryCount > 0) {
        toast.success('Escrow details updated successfully!');
      }
    } catch (error: any) {
      // If it's a server error and we haven't retried too many times, try again
      if (error?.response?.status === 500 && retryCount < 2) {
        const delay = 1000 * (retryCount + 1); // Exponential backoff (1s, 2s)
        console.debug(`Backend busy. Retrying escrow fetch in ${delay}ms... (Attempt ${retryCount + 1})`);
        toast.loading(`Server is busy, retrying... (Attempt ${retryCount + 1})`, { id: 'retry-toast' });
        
        setTimeout(() => {
          toast.dismiss('retry-toast');
          fetchEscrowDetails(retryCount + 1);
        }, delay);
        return; // Important: exit the function to avoid showing a final error prematurely
      }

      // Handle final error after all retries have failed
      toast.dismiss('retry-toast');
      const errorMessage = error.response?.data?.error || 'Failed to fetch escrow details.';
      if (error.response?.status === 500) {
        toast.error(`🔧 Server Error: ${errorMessage} Please try refreshing the page.`);
      } else if (error.response?.status === 404) {
        toast.error('❌ Escrow not found.');
      } else {
        toast.error(`Error: ${errorMessage}`);
      }
      console.error('Failed to fetch escrow details after all retries:', error);

    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async () => {
    const escrowId = Number(id);
    if (!Number.isFinite(escrowId) || escrowId <= 0) {
      toast.error('Invalid escrow ID');
      return;
    }
    
    setIsProcessing(true);
    try {
      await escrowApi.accept(escrowId);
      toast.success('Escrow accepted successfully!');
      
      // Add delay before refreshing to give backend time to process
      setTimeout(() => {
        fetchEscrowDetails();
      }, 1500);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || error?.response?.data?.message || 'Failed to accept escrow');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmReceipt = async () => {
    const escrowId = Number(id);
    if (!Number.isFinite(escrowId) || escrowId <= 0) {
      toast.error('Invalid escrow ID');
      return;
    }
    
    setIsProcessing(true);
    try {
      await escrowApi.confirmReceipt(escrowId);
      toast.success('Receipt confirmed! Funds will be released to the seller.');
      
      // Add delay before refreshing to give backend time to process
      setTimeout(() => {
        fetchEscrowDetails();
      }, 1500);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || error?.response?.data?.message || 'Failed to confirm receipt');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInitiatePayment = async () => {
    const escrowId = Number(id);
    if (!Number.isFinite(escrowId) || escrowId <= 0) {
      toast.error('Invalid escrow ID');
      return;
    }
    
    // Ensure phone number is available (required by payment provider)
    let profile: any = {};
    try { profile = JSON.parse(localStorage.getItem('user_profile') || '{}'); } catch {}
    let phone = profile?.phone_number as string | undefined;
    if (!phone || typeof phone !== 'string' || phone.trim().length < 7) {
      setPhoneNumber('');
      setShowPhoneModal(true);
      return;
    }

    setIsProcessing(true);
    try {
      const response = await paymentApi.initiateEscrowPayment(escrowId, {
        email: user?.email,
        first_name: user?.first_name,
        last_name: user?.last_name,
        phone_number: phone,
      });
      setPayment(response.data);
      setShowPayment(true);
      toast.success('Payment initiated! Please complete the payment.');
    } catch (error: any) {
      toast.error(error?.response?.data?.error || error?.response?.data?.message || 'Failed to initiate payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentComplete = () => {
    setShowPayment(false);
    toast.success('Payment completed successfully!');
    
    // Add a slightly longer delay before refreshing to give backend time to process
    setTimeout(() => {
      console.log('Payment complete. Fetching updated escrow details after delay...');
      fetchEscrowDetails();
    }, 2500); // Increased to 2.5 seconds
  };

  const handlePhoneSubmit = async () => {
    if (!phoneNumber || phoneNumber.trim().length < 10) {
      toast.error('Please enter a valid phone number (at least 10 digits)');
      return;
    }

    const escrowId = Number(id);
    if (!Number.isFinite(escrowId) || escrowId <= 0) {
      toast.error('Invalid escrow ID');
      return;
    }

    // Save phone number for future use
    try {
      const profile = JSON.parse(localStorage.getItem('user_profile') || '{}');
      const nextProfile = { ...profile, phone_number: phoneNumber.trim() };
      localStorage.setItem('user_profile', JSON.stringify(nextProfile));
    } catch {}

    setShowPhoneModal(false);
    setIsProcessing(true);
    
    try {
      const response = await paymentApi.initiateEscrowPayment(escrowId, {
        email: user?.email,
        first_name: user?.first_name,
        last_name: user?.last_name,
        phone_number: phoneNumber.trim(),
      });
      setPayment(response.data);
      setShowPayment(true);
      toast.success('Payment initiated! Please complete the payment.');
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.response?.data?.message || 'Failed to initiate payment';
      
      // Enhanced error handling for bank details compatibility
      if (errorMessage.toLowerCase().includes('bank') || errorMessage.toLowerCase().includes('account')) {
        if (errorMessage.toLowerCase().includes('buyer') || errorMessage.toLowerCase().includes('your')) {
          toast.error(`❌ Your Bank Details Issue: ${errorMessage}`, {
            duration: 6000,
            style: {
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              color: '#DC2626',
            },
          });
        } else if (errorMessage.toLowerCase().includes('seller')) {
          toast.error(`❌ Seller Bank Details Issue: ${errorMessage}`, {
            duration: 6000,
            style: {
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              color: '#DC2626',
            },
          });
        } else {
          toast.error(`❌ Bank Details Issue: ${errorMessage}`, {
            duration: 6000,
            style: {
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              color: '#DC2626',
            },
          });
        }
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDisputeSubmit = async () => {
    if (!disputeReason || disputeReason.trim().length < 10) {
      toast.error('Please provide a detailed reason for the dispute (at least 10 characters)');
      return;
    }

    const escrowId = Number(id);
    if (!Number.isFinite(escrowId) || escrowId <= 0) {
      toast.error('Invalid escrow ID');
      return;
    }

    setShowDisputeModal(false);
    setIsProcessing(true);
    
    try {
      await escrowApi.dispute(escrowId, disputeReason.trim());
      toast.success('Dispute created successfully');
      
      // Send AI arbitrator message to chat
      await sendArbitratorMessage(escrowId, disputeReason.trim());
      
      // Add delay before refreshing to give backend time to process
      setTimeout(() => {
        fetchEscrowDetails();
      }, 1500);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || error?.response?.data?.message || 'Failed to create dispute');
    } finally {
      setIsProcessing(false);
    }
  };

  const sendArbitratorMessage = async (escrowId: number, reason: string) => {
    try {
      // Simulate sending a message from AI arbitrator to the chat
      // In a real implementation, this would be handled by the backend
      const arbitratorMessage = {
        content: `🤖 **AI Arbitrator**: A dispute has been created for this escrow.\n\n**Dispute Reason:** ${reason}\n\nI will review the case and provide a resolution within 24-48 hours. Both parties will be notified of the decision. Please provide any additional evidence or information that may help resolve this dispute.`,
        type: 'message',
        escrow_id: escrowId,
        sender_id: 0, // Special ID for AI arbitrator
        sender: {
          id: 0,
          first_name: 'AI',
          last_name: 'Arbitrator',
          email: 'arbitrator@safedeal.com',
          activated: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          profession: 'AI Arbitrator'
        }
      };
      
      // This would typically be sent via WebSocket or API call
      // For now, we'll just show a toast
      toast.success('AI Arbitrator has been notified and will join the chat shortly');
    } catch (error) {
      // Handle error silently
    }
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
                Created on {formatDateSafe(escrow.created_at)}
              </p>
            </div>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(escrow.status)}`}>
              {getStatusIcon(escrow.status)}
              <span className="ml-2">{escrow.status}</span>
            </div>
          </div>
        </div>

        {/* Transaction Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Transaction Info */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Transaction Details
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Amount</label>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatCurrency(escrow.amount)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(escrow.status)}
                      <span className="font-medium">{escrow.status}</span>
                    </div>
                  </div>
                </div>
                
                {escrow.conditions && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Conditions</label>
                    <p className="text-gray-900 mt-1">{escrow.conditions}</p>
                  </div>
                )}

                {escrow.blockchain_tx_hash && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Blockchain Transaction</label>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm font-mono text-gray-900 break-all flex-1 mr-3">
                        {escrow.blockchain_tx_hash}
                      </p>
                      <a
                        href={`https://sepolia.etherscan.io/tx/${escrow.blockchain_tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline btn-sm flex-shrink-0"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Etherscan
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Actions
              </h3>
              <div className="space-y-4">
                {isBuyer && escrow.status === 'Pending' && (
                  <button
                    onClick={handleInitiatePayment}
                    disabled={isProcessing}
                    className="btn btn-primary btn-lg w-full"
                  >
                    <CreditCard className="h-5 w-5 mr-2" />
                    {isProcessing ? 'Initiating...' : 'Make Payment'}
                  </button>
                )}

                {isSeller && escrow.status === 'Pending' && (
                  <button
                    onClick={handleAccept}
                    disabled={isProcessing}
                    className="btn btn-primary btn-lg w-full"
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    {isProcessing ? 'Accepting...' : 'Accept Escrow'}
                  </button>
                )}
                
                {isSeller && escrow.status === 'Funded' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                      <span className="text-green-800 font-medium">Escrow Accepted</span>
                    </div>
                    <p className="text-green-700 text-sm mt-1">
                      You have successfully accepted this escrow. Waiting for buyer to confirm receipt.
                    </p>
                  </div>
                )}

                {isBuyer && escrow.status === 'Funded' && (
                  <button
                    onClick={handleConfirmReceipt}
                    disabled={isProcessing}
                    className="btn btn-success btn-lg w-full"
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    {isProcessing ? 'Confirming...' : 'Confirm Receipt'}
                  </button>
                )}

                {(isBuyer || isSeller) && escrow.status === 'Funded' && (
                  <button
                    onClick={() => {
                      setDisputeReason('');
                      setShowDisputeModal(true);
                    }}
                    disabled={isProcessing}
                    className="btn btn-outline btn-lg w-full"
                  >
                    <AlertCircle className="h-5 w-5 mr-2" />
                    {isProcessing ? 'Creating Dispute...' : 'Create Dispute'}
                  </button>
                )}

                <button
                  onClick={() => setShowChat(true)}
                  disabled={escrow.status === 'Pending'}
                  className={`btn btn-lg w-full ${
                    escrow.status === 'Pending' 
                      ? 'btn-disabled cursor-not-allowed opacity-50' 
                      : 'btn-outline'
                  }`}
                  title={escrow.status === 'Pending' ? 'Chat will be available after escrow is accepted' : 'Open chat'}
                >
                  <MessageCircle className="h-5 w-5 mr-2" />
                  {escrow.status === 'Pending' ? 'Chat (Pending Acceptance)' : 'Open Chat'}
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Participants */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Participants
              </h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Buyer</p>
                    <p className="text-sm text-gray-600">You</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Seller</p>
                    <p className="text-sm text-gray-600">User #{escrow.seller_id}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Transaction Timeline */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Timeline
              </h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Escrow Created</p>
                    <p className="text-xs text-gray-600">
                      {formatDateSafe(escrow.created_at)}
                    </p>
                  </div>
                </div>
                {escrow.status !== 'Pending' && (
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Escrow Accepted</p>
                      <p className="text-xs text-gray-600">Status updated</p>
                    </div>
                  </div>
                )}
                {escrow.status === 'Released' && (
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Funds Released</p>
                      <p className="text-xs text-gray-600">Transaction completed</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modals */}
        <RealTimeChat
          isOpen={showChat}
          onClose={() => setShowChat(false)}
          escrowId={Number(id)}
        />

        <PaymentModal
          isOpen={showPayment}
          onClose={() => setShowPayment(false)}
          amount={escrow.amount}
          paymentUrl={payment?.payment_url}
          onPaymentComplete={handlePaymentComplete}
        />

        {/* Phone Number Modal */}
        <AnimatePresence>
          {showPhoneModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
              onClick={() => setShowPhoneModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-2xl w-full max-w-md shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary-100 rounded-full">
                      <Phone className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Phone Number Required
                      </h3>
                      <p className="text-sm text-gray-600">
                        Enter your phone number to proceed with payment
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPhoneModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Body */}
                <div className="p-6">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="e.g., +1234567890 or 08012345678"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      autoFocus
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This will be used for payment verification and saved for future transactions
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                  <button
                    onClick={() => setShowPhoneModal(false)}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePhoneSubmit}
                    disabled={!phoneNumber || phoneNumber.trim().length < 10}
                    className="btn btn-primary"
                  >
                    Continue Payment
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dispute Reason Modal */}
        <AnimatePresence>
          {showDisputeModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
              onClick={() => setShowDisputeModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-2xl w-full max-w-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-100 rounded-full">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Create Dispute
                      </h3>
                      <p className="text-sm text-gray-600">
                        Provide a detailed reason for this dispute
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDisputeModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Body */}
                <div className="p-6">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dispute Reason *
                    </label>
                    <textarea
                      value={disputeReason}
                      onChange={(e) => setDisputeReason(e.target.value)}
                      placeholder="Please provide a detailed explanation of the issue. Include any relevant information that will help the AI arbitrator understand the situation..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                      rows={6}
                      autoFocus
                    />
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-gray-500">
                        Minimum 10 characters required
                      </p>
                      <p className={`text-xs ${disputeReason.length >= 10 ? 'text-green-600' : 'text-gray-400'}`}>
                        {disputeReason.length}/10
                      </p>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <FileText className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-medium text-yellow-800 mb-1">
                          Important Information
                        </h4>
                        <ul className="text-xs text-yellow-700 space-y-1">
                          <li>• An AI arbitrator will review your case within 24-48 hours</li>
                          <li>• Both parties will be notified of the decision</li>
                          <li>• Provide as much detail as possible for a fair resolution</li>
                          <li>• The arbitrator will join the chat to gather more information if needed</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                  <button
                    onClick={() => setShowDisputeModal(false)}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDisputeSubmit}
                    disabled={!disputeReason || disputeReason.trim().length < 10}
                    className="btn btn-primary bg-red-600 hover:bg-red-700 border-red-600 hover:border-red-700"
                  >
                    Create Dispute
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
};

export default EscrowDetails;
