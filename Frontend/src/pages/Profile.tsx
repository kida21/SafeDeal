import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import {
  User,
  Wallet,
  CreditCard,
  Shield,
  Key,
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
import { BankDetails } from "../types";
import LoadingSpinner from "../components/LoadingSpinner";

const Profile = () => {
  const { user, setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState("profile");
  const [isLoading, setIsLoading] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<BankDetails>();

  useEffect(() => {
    if (user) {
      reset({
        account_name: user.account_name || "",
        account_number: user.account_number || "",
        bank_code: user.bank_code || 0,
      });
    }
  }, [user, reset]);

  const handleUpdateBankDetails = async (data: BankDetails) => {
    setIsLoading(true);
    try {
      console.log("Sending bank details:", data);
      console.log("Bank code type:", typeof data.bank_code);
      console.log("Bank code value:", data.bank_code);

      const response = await userApi.updateBankDetails(data);
      setUser(response.data);
      toast.success("Bank details updated successfully!");
    } catch (error: any) {
      console.error("Bank details update error:", error);
      console.error("Error response:", error.response?.data);
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const tabs = [
    { id: "profile", name: "Profile", icon: User },
    { id: "wallet", name: "Wallet", icon: Wallet },
    { id: "banking", name: "Banking", icon: CreditCard },
    { id: "security", name: "Security", icon: Shield },
  ];

  if (!user) {
    return (
      <Layout>
        <LoadingSpinner />
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
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Personal Information
                </h3>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={user.first_name}
                        disabled
                        className="input w-full bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={user.last_name}
                        disabled
                        className="input w-full bg-gray-50"
                      />
                    </div>
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
                </div>
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
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">
                    Ethereum Wallet
                  </h3>

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
                      </div>

                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                          <div>
                            <h4 className="text-sm font-medium text-green-900">
                              Wallet Active
                            </h4>
                            <p className="text-sm text-green-700 mt-1">
                              Your Ethereum wallet is ready for blockchain
                              transactions.
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
                        Create an Ethereum wallet to participate in blockchain
                        transactions.
                      </p>
                      <button
                        onClick={handleCreateWallet}
                        disabled={isCreatingWallet}
                        className="btn btn-primary"
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
                className="card p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Bank Details
                </h3>
                <p className="text-gray-600 mb-6">
                  Add your bank account details to receive payments from
                  completed escrows.
                </p>

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
                        pattern: {
                          value: /^\d{10,16}$/,
                          message: "Account number must be 10-16 digits",
                        },
                      })}
                      className="input w-full"
                      placeholder="Enter your bank account number"
                    />
                    {errors.account_number && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.account_number.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bank Code
                    </label>
                    <input
                      {...register("bank_code", {
                        required: "Bank code is required",
                        min: {
                          value: 100,
                          message: "Bank code must be at least 100",
                        },
                        max: {
                          value: 999,
                          message: "Bank code must be at most 999",
                        },
                        valueAsNumber: true,
                      })}
                      type="number"
                      className="input w-full"
                      placeholder="Enter your bank code"
                    />
                    {errors.bank_code && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.bank_code.message}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn btn-primary"
                  >
                    {isLoading ? "Updating..." : "Update Bank Details"}
                  </button>
                </form>
              </motion.div>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="card p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">
                    Security Settings
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          Two-Factor Authentication
                        </h4>
                        <p className="text-sm text-gray-600">
                          Add an extra layer of security to your account
                        </p>
                      </div>
                      <button className="btn btn-outline btn-sm">Enable</button>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          Login Notifications
                        </h4>
                        <p className="text-sm text-gray-600">
                          Get notified when someone logs into your account
                        </p>
                      </div>
                      <button className="btn btn-outline btn-sm">Enable</button>
                    </div>
                  </div>
                </div>

                <div className="card p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Account Activity
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-600">Last login</span>
                      <span className="text-sm font-medium">
                        Today at 2:30 PM
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-600">
                        Account created
                      </span>
                      <span className="text-sm font-medium">
                        {new Date(user.created_at).toLocaleDateString()}
                      </span>
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
