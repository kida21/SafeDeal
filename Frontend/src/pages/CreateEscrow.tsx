import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { ArrowLeft, User as UserIcon, DollarSign, Shield } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { escrowApi, userApi } from '../lib/api';
import { toast } from 'react-hot-toast';
import { CreateEscrowRequest } from '../types';
import { formatCurrency } from '../lib/utils';
import { useAuthStore } from '../store/authStore';

const CreateEscrow = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CreateEscrowRequest & { seller_name: string; seller_id: string }>();

  const watchedAmount = watch('amount');

  // Pre-fill seller name/id if coming from search
  useEffect(() => {
    const sellerName = searchParams.get('seller');
    const sellerId = searchParams.get('seller_id');
    if (sellerName) {
      (document.querySelector('input[name="seller_name"]') as HTMLInputElement | null)?.setAttribute('value', sellerName);
    }
    if (sellerId) {
      (document.querySelector('input[name="seller_id"]') as HTMLInputElement | null)?.setAttribute('value', sellerId);
    }
  }, [searchParams]);

  const onSubmit = async (data: CreateEscrowRequest & { seller_name: string; seller_id: string }) => {
    setIsLoading(true);
    try {
      // Check authentication status
      console.log('User authenticated:', isAuthenticated);
      console.log('User:', user);
      
      // Debug: Check if token exists
      const token = localStorage.getItem('access_token');
      console.log('Token exists:', !!token);
      console.log('Token value:', token ? token.substring(0, 20) + '...' : 'No token');
      
      if (!isAuthenticated || !user) {
        toast.error('You must be logged in to create an escrow');
        navigate('/login');
        return;
      }
      
      // Test API call to verify token is working
      try {
        console.log('Testing API call with profile endpoint...');
        const profileResponse = await userApi.getProfile();
        console.log('Profile API call successful:', profileResponse.data);
      } catch (profileError) {
        console.error('Profile API call failed:', profileError);
        toast.error('Authentication failed. Please log in again.');
        navigate('/login');
        return;
      }
      
      // Validate seller ID
      if (!data.seller_id || isNaN(Number(data.seller_id))) {
        toast.error('Please enter a valid seller ID.');
        return;
      }

      const sellerId = parseInt(data.seller_id);
      console.log('Using seller ID:', sellerId);

      // Validate amount
      if (!data.amount || data.amount <= 0) {
        toast.error('Please enter a valid amount');
        return;
      }

      // The backend expects the full Escrow model structure
      // Note: buyer_id is set by the backend from the authenticated user
      const escrowData = {
        seller_id: sellerId,
        amount: parseFloat(data.amount.toString()), // Ensure it's a number
        conditions: data.conditions || "",
        status: "Pending", // Required by backend - must be one of the EscrowStatus values
        // Don't include active - it has a default value
        // Don't include buyer_id - it's set by the backend
        // Don't include blockchain fields - they're set later
      };

      console.log('Creating escrow with data:', escrowData);
      console.log('Data type:', typeof escrowData);
      console.log('Data stringified:', JSON.stringify(escrowData));
      console.log('Current user (buyer):', user);
      console.log('Seller ID being used:', escrowData.seller_id);
      
      const response = await escrowApi.create(escrowData);
      console.log('Escrow created successfully:', response.data);
      toast.success('Escrow created successfully!');
      navigate(`/escrow/${response.data.id}`);
    } catch (error: any) {
      console.error('Error creating escrow:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || error.response?.data?.error || 'Failed to create escrow');
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { number: 1, title: 'Seller Details', icon: UserIcon },
    { number: 2, title: 'Amount & Conditions', icon: DollarSign },
    { number: 3, title: 'Review & Create', icon: Shield },
  ];

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
          <h1 className="text-3xl font-bold text-gray-900">Create New Escrow</h1>
          <p className="text-gray-600 mt-2">
            Set up a secure escrow transaction to protect your deal
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((stepItem, index) => {
              const Icon = stepItem.icon;
              const isActive = step >= stepItem.number;
              const isCompleted = step > stepItem.number;
              
              return (
                <div key={stepItem.number} className="flex items-center">
                  <div className="flex items-center">
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                        isCompleted
                          ? 'bg-primary-600 border-primary-600 text-white'
                          : isActive
                          ? 'border-primary-600 text-primary-600'
                          : 'border-gray-300 text-gray-400'
                      }`}
                    >
                      {isCompleted ? (
                        <Shield className="h-5 w-5" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>
                    <div className="ml-3">
                      <p className={`text-sm font-medium ${
                        isActive ? 'text-primary-600' : 'text-gray-500'
                      }`}>
                        {stepItem.title}
                      </p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-4 ${
                      step > stepItem.number ? 'bg-primary-600' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-8"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Step 1: Seller Details */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Seller Information
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Search for the seller or enter their ID
                  </p>
                </div>

                <div>
                  <div className="mb-3">
                    <Link to="/search" className="btn btn-outline btn-sm">Search Users</Link>
                  </div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seller ID
                  </label>
                  <input
                  disabled
                    {...register('seller_id' as any, {
                      required: 'Seller ID is required',
                      pattern: {
                        value: /^\d+$/,
                        message: 'Seller ID must be a number'
                      }
                    })}
                    type="text"
                    className="input w-full"
                    placeholder="Enter seller's user ID (e.g., 1, 2, 3...)"
                  />
                  {errors.seller_id && (
                    <p className="text-red-500 text-sm mt-1">{errors.seller_id.message}</p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">
                    You can find the seller's ID by asking them or checking your records
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seller Name (Optional - for reference)
                  </label>
                  <input
                    {...register('seller_name')}
                    type="text"
                    className="input w-full"
                    placeholder="Enter seller's name for your reference"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex">
                    <UserIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-900">
                        Seller Validation
                      </h4>
                      <p className="text-sm text-blue-700 mt-1">
                        The seller's account status, bank details, and wallet will be validated by the backend when creating the escrow.
                      </p>
                    </div>
                  </div>
                </div>

              </motion.div>
            )}

            {/* Step 2: Amount & Conditions */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Transaction Details
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Specify the amount and conditions for your escrow
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (ETB)
                  </label>
                  <div className="relative">
                    <input
                      {...register('amount', {
                        required: 'Amount is required',
                        min: { value: 100, message: 'Minimum amount is 100 ETB' },
                        max: { value: 1000000, message: 'Maximum amount is 1,000,000 ETB' }
                      })}
                      type="number"
                      className="input w-full pl-8"
                      placeholder="0.00"
                      min="100"
                      max="1000000"
                    />
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                  {errors.amount && (
                    <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
                  )}
                  {watchedAmount && (
                    <p className="text-sm text-gray-600 mt-1">
                      SafeDeal fee: {formatCurrency(watchedAmount * 0.025)} (2.5%)
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Conditions (Optional)
                  </label>
                  <textarea
                    {...register('conditions')}
                    rows={4}
                    className="input w-full"
                    placeholder="Describe the conditions for releasing the funds (e.g., delivery confirmation, quality check, etc.)"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Be specific about what needs to happen for the funds to be released
                  </p>
                </div>
              </motion.div>
            )}

            {/* Step 3: Review & Create */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Review Your Escrow
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Please review all details before creating the escrow
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Seller ID:</span>
                    <span className="font-medium">{watch('seller_id' as any)}</span>
                  </div>
                  {watch('seller_name') && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Seller Name:</span>
                      <span className="font-medium">{watch('seller_name')}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-medium">{formatCurrency(watch('amount') || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">SafeDeal Fee (2.5%):</span>
                    <span className="font-medium">
                      {formatCurrency((watch('amount') || 0) * 0.025)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-4">
                    <span className="text-gray-600">Total to Pay:</span>
                    <span className="font-bold text-lg">
                      {formatCurrency((watch('amount') || 0) * 1.025)}
                    </span>
                  </div>
                  {watch('conditions') && (
                    <div>
                      <span className="text-gray-600 block mb-2">Conditions:</span>
                      <p className="text-sm bg-white p-3 rounded border">
                        {watch('conditions')}
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex">
                    <Shield className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
                    <div>
                      <h4 className="text-sm font-medium text-yellow-900">
                        Important Notice
                      </h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        Once created, the escrow will be sent to the seller for acceptance. 
                        You will be able to make payment only after the seller accepts the escrow.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t">
              <button
                type="button"
                onClick={() => setStep(Math.max(1, step - 1))}
                disabled={step === 1}
                className="btn btn-outline btn-md"
              >
                Previous
              </button>

              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => {
                    // Validate seller ID before proceeding to next step
                    if (step === 1) {
                      const sellerId = watch('seller_id' as any);
                      if (!sellerId || isNaN(Number(sellerId))) {
                        toast.error('Please enter a valid seller ID');
                        return;
                      }
                    }
                    setStep(step + 1);
                  }}
                  className="btn btn-primary btn-md"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary btn-md"
                >
                  {isLoading ? 'Creating...' : 'Create Escrow'}
                </button>
              )}
            </div>
          </form>
        </motion.div>
      </div>
    </Layout>
  );
};

export default CreateEscrow;
