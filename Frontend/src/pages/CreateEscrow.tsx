import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { ArrowLeft, User as UserIcon, DollarSign, Shield, CheckCircle } from 'lucide-react';
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
  const [selectedSeller, setSelectedSeller] = useState<{ id: number; name: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CreateEscrowRequest & { seller_name: string; seller_id: string }>();

  const watchedAmount = watch('amount');

  // Pre-fill seller name/id if coming from search
  useEffect(() => {
    const sellerName = searchParams.get('seller');
    const sellerId = searchParams.get('seller_id');
    if (sellerName && sellerId) {
      const seller = {
        id: parseInt(sellerId),
        name: sellerName
      };
      setSelectedSeller(seller);
      setValue('seller_name', sellerName);
      setValue('seller_id' as any, sellerId);
    }
  }, [searchParams, setValue]);

  const onSubmit = async (data: CreateEscrowRequest & { seller_name: string; seller_id: string }) => {
    setIsLoading(true);
    try {
      console.log('=== ESCROW CREATION DEBUG ===');
      console.log('Form data received:', data);
      console.log('User authenticated:', isAuthenticated);
      console.log('Current user (buyer):', user);
      console.log('Current user ID:', user?.id);
      console.log('User activation status:', user?.activated);
      console.log('User email:', user?.email);
      
      // Debug: Check if token exists
      const token = localStorage.getItem('access_token');
      console.log('Token exists:', !!token);
      console.log('Token value:', token ? token.substring(0, 20) + '...' : 'No token');
      
      if (!isAuthenticated || !user) {
        toast.error('You must be logged in to create an escrow');
        navigate('/login');
        return;
      }
      
      // Test API call to verify token is working and get fresh user data
      try {
        console.log('Testing API call with profile endpoint...');
        const profileResponse = await userApi.getProfile();
        console.log('Profile API call successful:', profileResponse.data);
        console.log('Backend user activation status:', profileResponse.data.activated);
        
        // Check if there's a mismatch between frontend and backend user data
        if (user?.activated !== profileResponse.data.activated) {
          console.warn('User activation status mismatch!');
          console.warn('Frontend user.activated:', user?.activated);
          console.warn('Backend user.activated:', profileResponse.data.activated);
          
          if (!profileResponse.data.activated) {
            toast.error('Your account is not activated. Please check your email and activate your account.');
            return;
          } else {
            // Update the auth store with fresh user data
            console.log('Updating auth store with fresh user data...');
            const { setUser } = useAuthStore.getState();
            setUser(profileResponse.data);
            toast.success('User data refreshed from server.');
          }
        }
        
        // Double-check activation status before proceeding
        if (!profileResponse.data.activated) {
          toast.error('Your account is not activated. Please activate your account before creating escrows.');
          return;
        }
      } catch (profileError) {
        console.error('Profile API call failed:', profileError);
        toast.error('Authentication failed. Please log in again.');
        navigate('/login');
        return;
      }
      
      // Validate seller selection - only allow search-selected sellers
      if (!selectedSeller) {
        toast.error('Please search and select a seller to create an escrow.');
        return;
      }
      
      const sellerId = selectedSeller.id;
      console.log('Using selected seller ID:', sellerId, 'Name:', selectedSeller.name);
      console.log('Buyer ID (current user):', user?.id, typeof user?.id);

      // Validate amount
      if (!data.amount || data.amount <= 0) {
        toast.error('Please enter a valid amount');
        return;
      }

      // Create the escrow request with only the required fields
      // The backend will automatically set buyer_id from the authenticated user
      const escrowData: CreateEscrowRequest = {
        seller_id: sellerId,
        amount: parseFloat(data.amount.toString()),
        conditions: data.conditions || "",
      };

      console.log('=== FINAL ESCROW CREATION ===');
      console.log('Creating escrow with data:', escrowData);
      console.log('Current user (buyer) ID:', user?.id);
      console.log('Current user activated status:', user?.activated);
      console.log('Seller ID being used:', escrowData.seller_id);
      console.log('Request headers will include token:', !!localStorage.getItem('access_token'));
      
      // Validate that buyer and seller are different
      if (user?.id === sellerId) {
        toast.error('You cannot create an escrow with yourself as the seller');
        return;
      }
      
      console.log('All validations passed, sending request to backend...');
      
      const response = await escrowApi.create(escrowData);
      console.log('Escrow created successfully:', response.data);
      toast.success('Escrow created successfully!');
      navigate(`/escrow/${response.data.id}`);
    } catch (error: any) {
      console.error('=== ESCROW CREATION ERROR ===');
      console.error('Error creating escrow:', error);
      console.error('Error status:', error.response?.status);
      console.error('Error response data:', error.response?.data);
      console.error('Error config:', error.config);
      
      // Specific handling for activation error
      if (error.response?.status === 403 && error.response?.data?.error?.includes('not activated')) {
        toast.error('Account activation issue detected. Please try logging out and logging back in.');
      } else {
        // Enhanced error handling for bank details compatibility
        const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to create escrow';
        
        // Check if error is related to bank details compatibility
        if (errorMessage.toLowerCase().includes('bank') || errorMessage.toLowerCase().includes('account')) {
          // Try to determine if it's buyer or seller bank details issue
          if (errorMessage.toLowerCase().includes('buyer') || errorMessage.toLowerCase().includes('your')) {
            toast.error(`❌ Buyer Bank Details Issue: ${errorMessage}`, {
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
            // Generic bank details error with perspective clarification
            toast.error(`❌ Bank Details Compatibility Issue: ${errorMessage}. Please check both buyer and seller bank account details.`, {
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
      }
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
                  
                  {selectedSeller ? (
                    // Show selected seller from search
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Selected Seller
                      </label>
                      <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <UserIcon className="h-6 w-6 text-green-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{selectedSeller.name}</p>
                            <p className="text-sm text-gray-600">User ID: {selectedSeller.id}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSeller(null);
                            setValue('seller_name', '');
                            setValue('seller_id' as any, '');
                          }}
                          className="px-3 py-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded text-sm font-medium transition-colors"
                        >
                          Change
                        </button>
                      </div>
                      <p className="text-sm text-green-600 mt-2 flex items-center">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Seller selected from search results
                      </p>
                    </div>
                  ) : (
                    // Show search requirement message
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">
                        No Seller Selected
                      </h4>
                      <p className="text-gray-600 mb-4">
                        Please use the search button above to find and select a seller for this escrow.
                      </p>
                      <Link to="/search" className="btn btn-primary">
                        Search for Seller
                      </Link>
                    </div>
                  )}
                </div>


                {selectedSeller && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex">
                      <Shield className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                      <div>
                        <h4 className="text-sm font-medium text-blue-900">
                          Secure Transaction
                        </h4>
                        <p className="text-sm text-blue-700 mt-1">
                          The seller's account status, bank details, and wallet will be validated when creating the escrow. Your funds will be held securely until the transaction is completed.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

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
