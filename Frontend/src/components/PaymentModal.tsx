import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Shield, CheckCircle, ExternalLink } from 'lucide-react';
import { formatCurrency } from '../lib/utils';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  paymentUrl?: string;
  onPaymentComplete?: () => void;
}

const PaymentModal = ({ isOpen, onClose, amount, paymentUrl, onPaymentComplete }: PaymentModalProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'completed' | 'failed'>('pending');

  const handlePayment = async () => {
    if (!paymentUrl) return;
    
    setIsProcessing(true);
    setPaymentStatus('processing');
    
    // Open payment URL in new tab
    const paymentWindow = window.open(paymentUrl, '_blank', 'width=800,height=600');
    
    // Listen for payment completion via polling (in a real app, use webhooks)
    const checkPaymentStatus = setInterval(() => {
      if (paymentWindow?.closed) {
        clearInterval(checkPaymentStatus);
        // When the payment window is closed, assume payment is complete
        // In a real implementation, you would verify the payment status with your backend
        setPaymentStatus('completed');
        setIsProcessing(false);
        onPaymentComplete?.();
      }
    }, 1000);
    
    // Cleanup interval if component unmounts
    return () => clearInterval(checkPaymentStatus);
  };

  const handleClose = () => {
    if (paymentStatus === 'completed') {
      onPaymentComplete?.();
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-primary-100 rounded-full">
                  <CreditCard className="h-8 w-8 text-primary-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Complete Payment
              </h3>
              <p className="text-gray-600">
                Secure payment through Chapa
              </p>
            </div>

            {/* Payment Details */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Amount:</span>
                <span className="font-semibold text-lg">
                  {formatCurrency(amount)}
                </span>
              </div>
              <div className="flex justify-between items-center border-t pt-2">
                <span className="text-gray-600">Total Amount:</span>
                <span className="font-bold text-lg">
                  {formatCurrency(amount)}
                </span>
              </div>
            </div>

            {/* Payment Status */}
            {paymentStatus === 'pending' && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <Shield className="h-5 w-5 text-blue-600 mr-3" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-900">
                        Secure Payment
                      </h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Your payment is processed securely through Chapa's encrypted system.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className="btn btn-primary btn-lg w-full"
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  Pay with Chapa
                </button>
              </div>
            )}

            {paymentStatus === 'processing' && (
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Processing Payment
                  </h4>
                  <p className="text-sm text-gray-600">
                    Please complete the payment in the new window...
                  </p>
                </div>
              </div>
            )}

            {paymentStatus === 'completed' && (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="p-3 bg-green-100 rounded-full">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Payment Successful!
                  </h4>
                  <p className="text-sm text-gray-600">
                    Your payment has been processed successfully. The escrow is now funded.
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="btn btn-primary w-full"
                >
                  Continue
                </button>
              </div>
            )}

            {paymentStatus === 'failed' && (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="p-3 bg-red-100 rounded-full">
                    <X className="h-8 w-8 text-red-600" />
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Payment Failed
                  </h4>
                  <p className="text-sm text-gray-600">
                    There was an issue processing your payment. Please try again.
                  </p>
                </div>
                <button
                  onClick={() => setPaymentStatus('pending')}
                  className="btn btn-primary w-full"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Security Notice */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center text-xs text-gray-500">
                <Shield className="h-3 w-3 mr-1" />
                <span>Your payment information is encrypted and secure</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PaymentModal;
