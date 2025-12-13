import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import {
  User,
  Wallet,
  CreditCard,
  Copy,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import Layout from "../components/Layout";
import { useAuthStore } from "../store/authStore";
import { userApi } from "../lib/api";
import { toast } from "react-hot-toast";
import { BankDetails, UpdateProfileRequest } from "../types";
import LoadingSpinner from "../components/LoadingSpinner";
import { BANKS, getBankByCode } from "../lib/banks";

const Profile = () => {
  const { user, setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState("profile");
  const [isLoading, setIsLoading] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isFetchingProfile, setIsFetchingProfile] = useState(false);
  const [selectedBankCode, setSelectedBankCode] = useState<number | null>(null);
  const [showBankForm, setShowBankForm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<BankDetails>();

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
    reset: resetProfile,
  } = useForm<UpdateProfileRequest>();

  // Function to fetch latest profile data
  const fetchProfile = async () => {
    setIsFetchingProfile(true);
    try {
      const response = await userApi.getProfile();
      setUser(response.data);
    } catch (error: any) {
      toast.error('Failed to load profile data');
    } finally {
      setIsFetchingProfile(false);
    }
  };

  useEffect(() => {
    // Fetch latest profile data when component mounts
    fetchProfile();
  }, []);

  useEffect(() => {
    if (user) {
      reset({
        account_name: user.account_name || "",
        account_number: user.account_number || "",
        bank_code: user.bank_code || 0,
      });
      resetProfile({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        profession: user.profession || "",
      });
      // Set selected bank code for dropdown
      setSelectedBankCode(user.bank_code || null);
    }
  }, [user, reset, resetProfile]);

  const handleUpdateBankDetails = async (data: BankDetails) => {
    if (!selectedBankCode) {
      toast.error("Please select a bank");
      return;
    }

    setIsLoading(true);
    try {
      const bankData = {
        ...data,
        bank_code: selectedBankCode,
      };
      

      const response = await userApi.updateBankDetails(bankData);
      setUser(response.data);
      toast.success("Bank details updated successfully!");
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Failed to update bank details"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateWallet = async () => {
    if (user?.wallet_address) {
      toast("Wallet already exists!", { icon: "🦊" });
      return;
    }
    setIsCreatingWallet(true);
    try {
      const response = await userApi.createWallet();
      if (user) {
        setUser({ ...user, wallet_address: response.data.wallet_address });
      }
      toast.success("Ethereum wallet created successfully!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create wallet");
    } finally {
      setIsCreatingWallet(false);
    }
  };

  const handleUpdateProfile = async (data: UpdateProfileRequest) => {
    if (!user?.id) {
      toast.error("User ID not available");
      return;
    }
    
    setIsUpdatingProfile(true);
    try {
      const response = await userApi.updateProfile(data, user.id);
      
      // Backend returns partial user data, merge with existing user data
      const updatedUserData = response.data;
      setUser({
        ...user,
        ...updatedUserData
      });
      
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      console.error("Profile update error:", error);
      toast.error(error.response?.data?.error || error.response?.data?.message || "Failed to update profile");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const tabs = [
    { id: "profile", name: "Profile", icon: User },
    { id: "wallet", name: "Wallet", icon: Wallet },
    { id: "banking", name: "Banking", icon: CreditCard },
  ];

  if (!user || isFetchingProfile) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-2">
            Manage your account information, wallet, and security settings
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? "bg-primary-50 text-primary-700 border-r-2 border-primary-600"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Personal Information
                  </h3>
                  <button
                    onClick={fetchProfile}
                    disabled={isFetchingProfile}
                    className="btn btn-outline btn-sm"
                  >
                    {isFetchingProfile ? "Refreshing..." : "Refresh"}
                  </button>
                </div>
                <form onSubmit={handleSubmitProfile(handleUpdateProfile)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name
                      </label>
                      <input
                        {...registerProfile("first_name", {
                          required: "First name is required",
                          minLength: {
                            value: 2,
                            message: "First name must be at least 2 characters"
                          }
                        })}
                        type="text"
                        className="input w-full"
                      />
                      {profileErrors.first_name && (
                        <p className="text-red-500 text-sm mt-1">
                          {profileErrors.first_name.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name
                      </label>
                      <input
                        {...registerProfile("last_name", {
                          required: "Last name is required",
                          minLength: {
                            value: 2,
                            message: "Last name must be at least 2 characters"
                          }
                        })}
                        type="text"
                        className="input w-full"
                      />
                      {profileErrors.last_name && (
                        <p className="text-red-500 text-sm mt-1">
                          {profileErrors.last_name.message}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Profession
                    </label>
                    <input
                      {...registerProfile("profession", {
                        required: "Profession is required",
                        minLength: {
                          value: 2,
                          message: "Profession must be at least 2 characters"
                        },
                        maxLength: {
                          value: 100,
                          message: "Profession must be less than 100 characters"
                        }
                      })}
                      type="text"
                      className="input w-full"
                      placeholder="e.g., Software Developer, Teacher, etc."
                    />
                    {profileErrors.profession && (
                      <p className="text-red-500 text-sm mt-1">
                        {profileErrors.profession.message}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="input w-full bg-gray-50"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Email cannot be changed. Contact support if needed.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div
                      className={`p-2 rounded-full ${
                        user.activated ? "bg-green-100" : "bg-yellow-100"
                      }`}
                    >
                      {user.activated ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-yellow-600" />
                      )}
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        user.activated ? "text-green-700" : "text-yellow-700"
                      }`}
                    >
                      {user.activated
                        ? "Account Verified"
                        : "Account Pending Verification"}
                    </span>
                  </div>
                  {!user.activated && (
                    <div className="mt-3">
                      <button
                        onClick={async () => {
                          try {
                            await userApi.resendActivation(user.email);
                            toast.success('Activation email sent! Please check your inbox.');
                          } catch (e: any) {
                            toast.error(e?.response?.data?.error || 'Failed to resend activation email');
                          }
                        }}
                        className="btn btn-outline btn-sm"
                      >
                        Resend Activation Email
                      </button>
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={isUpdatingProfile}
                    className="btn btn-primary btn-md"
                  >
                    {isUpdatingProfile ? "Updating..." : "Update Profile"}
                  </button>
                </form>
              </motion.div>
            )}

            {/* Wallet Tab */}
            {activeTab === "wallet" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="card p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Ethereum Wallet
                    </h3>
                    <button
                      onClick={fetchProfile}
                      disabled={isFetchingProfile}
                      className="btn btn-outline btn-sm"
                    >
                      {isFetchingProfile ? "Refreshing..." : "Refresh"}
                    </button>
                  </div>

                  {user.wallet_address ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Wallet Address
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={user.wallet_address}
                            readOnly
                            className="input flex-1 font-mono text-sm"
                          />
                          <button
                            onClick={() =>
                              copyToClipboard(user.wallet_address!)
                            }
                            className="btn btn-outline btn-sm"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          This is your Ethereum wallet address for blockchain transactions
                        </p>
                      </div>

                      {user.encrypted_private_key && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Private Key Status
                          </label>
                          <div className="flex items-center space-x-2">
                            <input
                              type={showPrivateKey ? "text" : "password"}
                              value={showPrivateKey ? "••••••••••••••••••••••••••••••••" : "••••••••••••••••••••••••••••••••"}
                              readOnly
                              className="input flex-1 font-mono text-sm"
                            />
                            <button
                              onClick={() => setShowPrivateKey(!showPrivateKey)}
                              className="btn btn-outline btn-sm"
                            >
                              {showPrivateKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Your private key is encrypted and stored securely
                          </p>
                        </div>
                      )}

                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                          <div>
                            <h4 className="text-sm font-medium text-green-900">
                              Wallet Active
                            </h4>
                            <p className="text-sm text-green-700 mt-1">
                              Your Ethereum wallet is ready for blockchain transactions.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">
                        No Wallet Created
                      </h4>
                      <p className="text-gray-600 mb-6">
                        Create an Ethereum wallet to participate in blockchain transactions.
                      </p>
                      <button
                        onClick={handleCreateWallet}
                        disabled={isCreatingWallet}
                        className="btn btn-primary btn-md"
                      >
                        {isCreatingWallet ? "Creating..." : "Create Wallet"}
                      </button>
                    </div>
                  )}
                </div>

                {user.wallet_address && (
                  <div className="card p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Wallet Security
                    </h3>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex">
                        <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
                        <div>
                          <h4 className="text-sm font-medium text-yellow-900">
                            Important Security Notice
                          </h4>
                          <p className="text-sm text-yellow-700 mt-1">
                            Your private key is encrypted and stored securely.
                            Never share your private key with anyone. SafeDeal
                            will never ask for your private key.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Banking Tab */}
            {activeTab === "banking" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="card p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Bank Details
                    </h3>
                    <button
                      onClick={fetchProfile}
                      disabled={isFetchingProfile}
                      className="btn btn-outline btn-sm"
                    >
                      {isFetchingProfile ? "Refreshing..." : "Refresh"}
                    </button>
                  </div>
                  
                  <p className="text-gray-600 mb-6">
                    Add your bank account details to receive payments from completed escrows.
                  </p>

                  {/* Display current bank details if they exist */}
                  {(user.account_name || user.account_number || user.bank_code) && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-blue-900">Current Bank Details</h4>
                        <button
                          type="button"
                          onClick={() => setShowBankForm(!showBankForm)}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          {showBankForm ? 'Cancel Update' : 'Update Details'}
                        </button>
                      </div>
                      <div className="space-y-2">
                        {user.account_name && (
                          <div className="flex justify-between">
                            <span className="text-sm text-blue-700">Account Name:</span>
                            <span className="text-sm font-medium text-blue-900">{user.account_name}</span>
                          </div>
                        )}
                        {user.account_number && (
                          <div className="flex justify-between">
                            <span className="text-sm text-blue-700">Account Number:</span>
                            <span className="text-sm font-medium text-blue-900 font-mono">{user.account_number}</span>
                          </div>
                        )}
                        {user.bank_code && (
                          <div className="flex justify-between">
                            <span className="text-sm text-blue-700">Bank:</span>
                            <span className="text-sm font-medium text-blue-900">
                              {getBankByCode(user.bank_code)?.name || `Bank Code: ${user.bank_code}`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Show form only if no bank details exist or user wants to update */}
                  {(!user.account_name && !user.account_number && !user.bank_code) || showBankForm ? (
                    <form
                      onSubmit={handleSubmit(handleUpdateBankDetails)}
                      className="space-y-6"
                    >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Account Name
                      </label>
                      <input
                        {...register("account_name", {
                          required: "Account name is required",
                        })}
                        className="input w-full"
                        placeholder="Enter your full name as it appears on your bank account"
                      />
                      {errors.account_name && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.account_name.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Account Number
                      </label>
                      <input
                        {...register("account_number", {
                          required: "Account number is required",
                          validate: (value) => {
                            if (!selectedBankCode) {
                              return "Please select a bank first";
                            }
                            const bank = getBankByCode(selectedBankCode);
                            if (!bank) {
                              return "Invalid bank selected";
                            }
                            const digitPattern = new RegExp(`^\\d{${bank.accountLength}}$`);
                            if (!digitPattern.test(value)) {
                              return `Account number must be exactly ${bank.accountLength} digits for ${bank.name}`;
                            }
                            return true;
                          },
                        })}
                        className="input w-full"
                        placeholder={selectedBankCode ? `Enter ${getBankByCode(selectedBankCode)?.accountLength || 'your'} digit account number` : "Enter your bank account number"}
                      />
                      {errors.account_number && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.account_number.message}
                        </p>
                      )}
                      {selectedBankCode && (
                        <p className="text-blue-600 text-sm mt-1">
                          Required: {getBankByCode(selectedBankCode)?.accountLength} digits for {getBankByCode(selectedBankCode)?.name}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bank
                      </label>
                      <select
                        value={selectedBankCode || ""}
                        onChange={(e) => setSelectedBankCode(Number(e.target.value) || null)}
                        className="input w-full"
                        required
                      >
                        <option value="">Select your bank</option>
                        {BANKS.map((bank) => (
                          <option key={bank.code} value={bank.code}>
                            {bank.name} {bank.isMobileMoney ? "(Mobile Money)" : ""}
                          </option>
                        ))}
                      </select>
                      {!selectedBankCode && (
                        <p className="text-red-500 text-sm mt-1">
                          Please select a bank
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="btn btn-primary btn-md"
                    >
                      {isLoading ? "Updating..." : "Update Bank Details"}
                    </button>
                  </form>
                ) : null}
                </div>

                {/* Bank Information Help */}
                <div className="card p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Bank Information Help
                  </h3>
                  <div className="space-y-3 text-sm text-gray-600">
                    <p>
                      <strong>Account Name:</strong> The name as it appears on your bank account statement.
                    </p>
                    <p>
                      <strong>Account Number:</strong> Your bank account number. The required length depends on your selected bank.
                    </p>
                    <p>
                      <strong>Bank:</strong> Select your bank from the dropdown. Mobile money services are clearly marked.
                    </p>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
                      <p className="text-yellow-800">
                        <strong>Note:</strong> This information is used to process payments from completed escrows. 
                        Make sure the details are accurate to avoid payment delays.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}


          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
