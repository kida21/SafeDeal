import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { ArrowLeft, User as UserIcon, DollarSign, Shield, CheckCircle } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { escrowApi } from '../lib/api';
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
  } = useForm<
    CreateEscrowRequest & {
      seller_name: string;
      seller_id: string;
      item_description?: string;
      delivery_date?: string;
      delivery_method?: string;
      payment_release_condition?: string;
      inspection_period_days?: number;
      refund_policy?: string;
      governing_law?: string;
      contact_details?: string;
      additional_notes?: string;
    }
  >();


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

  const buildConditionsText = (
    data: Partial<{
      item_description?: string;
      delivery_date?: string;
      delivery_method?: string;
      payment_release_condition?: string;
      inspection_period_days?: number | string;
      refund_policy?: string;
      governing_law?: string;
      contact_details?: string;
      additional_notes?: string;
    }>
  ) => {
    const buyerName = user ? `${user.first_name} ${user.last_name}`.trim() : 'Buyer';
    const sellerName = selectedSeller?.name || 'Seller';
  
    const lines: string[] = [];
    

    lines.push(`Buyer: ${buyerName}`);
    lines.push('');
    lines.push(`Seller: ${sellerName}`);
    lines.push('');
  
    if (data.item_description) {
      lines.push('Item Description:');
      lines.push(data.item_description);
      lines.push('');
    }
  
    if (data.delivery_date || data.delivery_method) {
      lines.push('Delivery:');
      if (data.delivery_date) lines.push(`- Date: ${data.delivery_date}`);
      if (data.delivery_method) lines.push(`- Method: ${data.delivery_method}`);
      lines.push('');
    }
  
    if (data.payment_release_condition) {
      lines.push('Payment Release:');
      lines.push(data.payment_release_condition);
      lines.push('');
    }
  
    if (data.inspection_period_days) {
      lines.push(`Inspection Period: ${data.inspection_period_days} day(s)`);
      lines.push('');
    }
  
    if (data.refund_policy) {
      lines.push('Refund Policy:');
      lines.push(data.refund_policy);
      lines.push('');
    }
  
    if (data.governing_law) {
      lines.push(`Governing Law: ${data.governing_law}`);
      lines.push('');
    }
  
    if (data.contact_details) {
      lines.push(`Contact: ${data.contact_details}`);
      lines.push('');
    }
  
    if (data.additional_notes) {
      lines.push('Additional Notes:');
      lines.push(data.additional_notes);
    }
  
    return lines.join('\n');
  };  

  const onSubmit = async (
    data: CreateEscrowRequest & {
      seller_name: string;
      seller_id: string;
      item_description?: string;
      delivery_date?: string;
      delivery_method?: string;
      payment_release_condition?: string;
      inspection_period_days?: number;
      refund_policy?: string;
      governing_law?: string;
      contact_details?: string;
      additional_notes?: string;
    }
  ) => {
    setIsLoading(true);
    try {
      
      if (!isAuthenticated || !user) {
        toast.error('You must be logged in to create an escrow');
        navigate('/login');
        return;
      }
      
      // Check user activation status
      if (!user?.activated) {
        toast.error('Your account is not activated. Please check your email and activate your account.');
        return;
      }
      
      // Validate seller selection - only allow search-selected sellers
      if (!selectedSeller) {
        toast.error('Please search and select a seller to create an escrow.');
        return;
      }
      
      const sellerId = selectedSeller.id;

      // Validate amount
      if (!data.amount || data.amount <= 0) {
        toast.error('Please enter a valid amount');
        return;
      }

      // Create the escrow request with only the required fields
      // The backend will automatically set buyer_id from the authenticated user
      // Compose a presentable conditions string from all inputs
      const composedConditions = buildConditionsText({
        item_description: data.item_description,
        delivery_date: data.delivery_date,
        delivery_method: data.delivery_method,
        payment_release_condition: data.payment_release_condition,
        inspection_period_days: data.inspection_period_days,
        refund_policy: data.refund_policy,
        governing_law: data.governing_law,
        contact_details: data.contact_details,
        additional_notes: data.additional_notes,
      });

      const escrowData: CreateEscrowRequest = {
        seller_id: sellerId,
        amount: parseFloat(data.amount.toString()),
        conditions: composedConditions,
      };

      
      // Validate that buyer and seller are different
      if (user?.id === sellerId) {
        toast.error('You cannot create an escrow with yourself as the seller');
        return;
      }

      // Check buyer activation status before submitting
      if (!user?.activated && user?.activated !== true) {
        
        toast.error('🚫 Your account is not activated. Please complete your account activation before creating an escrow.', {
          duration: 8000,
          style: {
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            color: '#DC2626',
          },
        });
        return;
      }

      // Check if seller activation status is available (if we have that info)
      if (selectedSeller && (selectedSeller as any).activated === false) {
        toast.error('🚫 The selected seller\'s account is not activated. Please choose a different seller.', {
          duration: 8000,
          style: {
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            color: '#DC2626',
          },
        });
        return;
      }
      
      const response = await escrowApi.create(escrowData);
      toast.success('Escrow created successfully!');
      navigate(`/escrow/${response.data.id}`);
    } catch (error: any) {
      
      // Specific handling for activation errors
      if (error.response?.status === 403) {
        const errorMessage = error.response?.data?.error || '';
        
        if (errorMessage.includes('Buyer account is not activated')) {
          toast.error('🚫 Your account appears to be inactive. Please check your profile activation status or contact support.', {
            duration: 8000,
            style: {
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              color: '#DC2626',
            },
          });
          
          
        } else if (errorMessage.includes('Seller account is not activated')) {
          toast.error('🚫 The selected seller\'s account is not activated. Please choose a different seller or contact them to activate their account.', {
            duration: 8000,
            style: {
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              color: '#DC2626',
            },
          });
        } else if (errorMessage.includes('not activated')) {
          toast.error('🚫 Account Activation Issue: One or both accounts are not properly activated. Please verify activation status.', {
            duration: 8000,
            style: {
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              color: '#DC2626',
            },
          });
        } else {
          toast.error(`🚫 Access Denied: ${errorMessage}`, {
            duration: 6000,
            style: {
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              color: '#DC2626',
            },
          });
        }
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Create New Escrow</h1>
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
                      className={`flex items-center justify-center w-4 h-4 sm:w-10 sm:h-10 rounded-full border-2 ${
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
                      <p className={`text-xs sm:text-sm font-medium ${
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
          className="card p-4 sm:p-8"
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
                    <Link to="/search" className="btn btn-outline btn-sm w-full sm:w-auto">Search Users</Link>
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
                      <Link to="/search" className="btn btn-primary btn-sm sm:btn-md w-full sm:w-auto">
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
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Item Description
                  </label>
                  <textarea
                    {...register('item_description')}
                    rows={3}
                    className="input w-full"
                    placeholder="Describe the item/service being transacted"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delivery Date
                    </label>
                    <input
                      type="date"
                      {...register('delivery_date')}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delivery Method
                    </label>
                    <input
                      type="text"
                      {...register('delivery_method')}
                      className="input w-full"
                      placeholder="e.g., Courier, Pickup, Digital Delivery"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Release Condition
                  </label>
                  <textarea
                    {...register('payment_release_condition')}
                    rows={3}
                    className="input w-full"
                    placeholder="e.g., Release after delivery confirmation and quality inspection"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Inspection/Dispute Period (days)
                    </label>
                    <input
                      type="number"
                      min={0}
                      {...register('inspection_period_days', { valueAsNumber: true })}
                      className="input w-full"
                      placeholder="e.g., 3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Governing Law / Jurisdiction
                    </label>
                    <select
                      {...register('governing_law')}
                      className="input w-full"
                    >
                      <option value="Ethiopia">Ethiopia</option>
                      <option value="Eritrea">Eritrea</option>
                      <option value="Somalia">Somalia</option>
                      <option value="Sudan">Sudan</option>
                      <option value="Kenya">Kenya</option>
                      <option value="Uganda">Uganda</option>
                      <option value="Tanzania">Tanzania</option>
                      <option value="Burundi">Burundi</option>
                      <option value="Rwanda">Rwanda</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Refund Policy
                  </label>
                  <textarea
                    {...register('refund_policy')}
                    rows={3}
                    className="input w-full"
                    placeholder="Describe the refund policy (if applicable)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Details (Optional)
                  </label>
                  <input
                    type="text"
                    {...register('contact_details')}
                    className="input w-full"
                    placeholder="Phone or email for updates/issues"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    {...register('additional_notes')}
                    rows={3}
                    className="input w-full"
                    placeholder="Any extra notes to include in the agreement"
                  />
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
                    <span className="font-medium">
                      {formatCurrency((watch('amount') || 0))}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-4">
                    <span className="text-gray-600">Total to Pay:</span>
                    <span className="font-bold text-lg">
                      {formatCurrency((watch('amount') || 0))}
                    </span>
                  </div>
                  {(() => {
                    const v = watch();
                    const preview = buildConditionsText({
                      item_description: v?.item_description,
                      delivery_date: v?.delivery_date,
                      delivery_method: v?.delivery_method,
                      payment_release_condition: v?.payment_release_condition,
                      inspection_period_days: v?.inspection_period_days,
                      refund_policy: v?.refund_policy,
                      governing_law: v?.governing_law,
                      contact_details: v?.contact_details,
                      additional_notes: v?.additional_notes,
                    });
                    return preview ? (
                      <div>
                        <span className="text-gray-600 block mb-2">Composed Conditions:</span>
                        <pre className="text-sm bg-white p-3 rounded border whitespace-pre-wrap">{preview}</pre>
                      </div>
                    ) : null;
                  })()}
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
            <div className="flex items-center justify-between pt-6 border-t flex-col-reverse sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setStep(Math.max(1, step - 1))}
                disabled={step === 1}
                className="btn btn-outline btn-sm sm:btn-md w-full sm:w-auto"
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
