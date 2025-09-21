import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Search,
  User,
  Mail,
  Briefcase,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';
import Layout from '../components/Layout';
import { userApi } from '../lib/api';
import { SearchUser } from '../types';
import { toast } from 'react-hot-toast';

const UserSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    try {
      const response = await userApi.searchUsers(searchTerm);
      setSearchResults(response.data.users || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to search users');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setHasSearched(false);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Link
            to="/dashboard"
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Search Users</h1>
          <p className="text-gray-600 mt-2">
            Find users to create escrow transactions with
          </p>
        </div>

        {/* Search Form */}
        <div className="card p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, profession, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-12 w-full"
                disabled={isSearching}
              />
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="submit"
                disabled={isSearching || !searchTerm.trim()}
                className="btn btn-primary btn-md"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </>
                )}
              </button>
              {hasSearched && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="btn btn-outline btn-md"
                >
                  Clear
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Search Results */}
        {hasSearched && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Search Results
              </h3>
              <span className="text-sm text-gray-600">
                {searchResults.length} user{searchResults.length !== 1 ? 's' : ''} found
              </span>
            </div>

            {isSearching ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
                <span className="ml-2 text-gray-600">Searching users...</span>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-8">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  No users found
                </h4>
                <p className="text-gray-600">
                  Try searching with different keywords or check your spelling.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {searchResults.map((user, index) => (
                  <motion.div
                    key={`${user.first_name}-${user.last_name}-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-primary-100 rounded-full">
                        <User className="h-6 w-6 text-primary-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {user.first_name} {user.last_name}
                        </h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Briefcase className="h-4 w-4" />
                            <span>{user.profession}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            {user.activated ? (
                              <>
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span className="text-green-600">Verified</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="h-4 w-4 text-red-500" />
                                <span className="text-red-600">Unverified</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {user.activated ? (
                        <Link
                          to={`/create-escrow?seller=${user.first_name} ${user.last_name}`}
                          className="btn btn-primary btn-sm"
                        >
                          Create Escrow
                        </Link>
                      ) : (
                        <span className="text-sm text-gray-500">
                          User not verified
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Search Tips */}
        {!hasSearched && (
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Search Tips
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Search className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Search by Name</h4>
                  <p className="text-sm text-gray-600">
                    Enter the user's first or last name to find them quickly.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <Briefcase className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Search by Profession</h4>
                  <p className="text-sm text-gray-600">
                    Find users by their profession or business type.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-purple-100 rounded-full">
                  <Mail className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Search by Email</h4>
                  <p className="text-sm text-gray-600">
                    If you know their email address, you can search by it.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-yellow-100 rounded-full">
                  <CheckCircle className="h-4 w-4 text-yellow-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Verified Users Only</h4>
                  <p className="text-sm text-gray-600">
                    Only verified users can participate in escrow transactions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default UserSearch;
