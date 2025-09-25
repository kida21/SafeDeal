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
import { formatCurrency, getStatusColor } from '../lib/utils';
import { Escrow, EscrowPayment } from '../types';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import RealTimeChat from '../components/RealTimeChat';
import PaymentModal from '../components/PaymentModal';

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
    const escrowId = Number(id);
    if (!Number.isFinite(escrowId) || escrowId <= 0) {
      toast.error('Invalid escrow ID');
      return;
    }
    
    setIsProcessing(true);
    try {
      await escrowApi.accept(escrowId);
      toast.success('Escrow accepted successfully!');
      fetchEscrowDetails();
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
      fetchEscrowDetails();
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
      const entered = prompt('Enter your phone number for payment (required):');
      if (!entered || entered.trim().length < 7) {
        toast.error('A valid phone number is required to proceed.');
        return;
      }
      phone = entered.trim();
      // Persist for next time
      try {
        const nextProfile = { ...profile, phone_number: phone };
        localStorage.setItem('user_profile', JSON.stringify(nextProfile));
      } catch {}
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
                    <p className="text-sm font-mono text-gray-900 break-all">
                      {escrow.blockchain_tx_hash}
                    </p>
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

                {isSeller && escrow.status === 'Funded' && (
                  <button
                    onClick={handleAccept}
                    disabled={isProcessing}
                    className="btn btn-primary btn-lg w-full"
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    {isProcessing ? 'Accepting...' : 'Accept Escrow'}
                  </button>
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
                      const escrowId = Number(id);
                      if (!Number.isFinite(escrowId) || escrowId <= 0) {
                        toast.error('Invalid escrow ID');
                        return;
                      }
                      const reason = prompt('Please provide a reason for the dispute:');
                      if (!reason) return;
                      escrowApi
                        .dispute(escrowId, reason)
                        .then(() => {
                          toast.success('Dispute created successfully');
                          fetchEscrowDetails();
                        })
                        .catch((error) => {
                          toast.error(error?.response?.data?.error || error?.response?.data?.message || 'Failed to create dispute');
                        });
                    }}
                    className="btn btn-outline btn-lg w-full"
                  >
                    <AlertCircle className="h-5 w-5 mr-2" />
                    Create Dispute
                  </button>
                )}

                <button
                  onClick={() => setShowChat(true)}
                  className="btn btn-outline btn-lg w-full"
                >
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Open Chat
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
      </div>
    </Layout>
  );
};

export default EscrowDetails;
