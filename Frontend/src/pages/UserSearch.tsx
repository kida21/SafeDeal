import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Search,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import Layout from '../components/Layout';
import { userApi } from '../lib/api';
import { SearchUser } from '../types';
import { toast } from 'react-hot-toast';

const UserSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [allUsers, setAllUsers] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Load all users on component mount
  const loadAllUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    try {
      // Use a broad search to get all users (or create a dedicated endpoint)
      const response = await userApi.searchUsers(''); // Empty query to get all users
      const users = response.data.users || [];
      setAllUsers(users);
      console.log('Loaded all users:', users.length);
    } catch (error: any) {
      console.error('Error loading users:', error);
      // Fallback: try to get users with a common letter
      try {
        const fallbackResponse = await userApi.searchUsers('a');
        setAllUsers(fallbackResponse.data.users || []);
      } catch (fallbackError) {
        console.error('Fallback search also failed:', fallbackError);
      }
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  // Client-side search function with partial matching
  const performClientSideSearch = useCallback((query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    console.log('Client-side searching for:', query);
    setIsSearching(true);
    setHasSearched(true);

    const searchQuery = query.trim().toLowerCase();
    
    // Filter users with partial matching on multiple fields
    const filteredUsers = allUsers.filter(user => {
      const firstName = (user.first_name || '').toLowerCase();
      const lastName = (user.last_name || '').toLowerCase();
      const profession = (user.profession || '').toLowerCase();
      const fullName = `${firstName} ${lastName}`;
      
      return firstName.includes(searchQuery) ||
             lastName.includes(searchQuery) ||
             profession.includes(searchQuery) ||
             fullName.includes(searchQuery);
    });

    setSearchResults(filteredUsers);
    console.log('Client-side search results:', filteredUsers.length, 'users');
    setIsSearching(false);
  }, [allUsers]);

  // Load users on component mount
  useEffect(() => {
    loadAllUsers();
  }, [loadAllUsers]);

  // Debounced client-side search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performClientSideSearch(searchTerm);
    }, 150); // Faster since it's client-side

    return () => clearTimeout(timeoutId);
  }, [searchTerm, performClientSideSearch]);

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
            {isLoadingUsers && (
              <span className="ml-2 text-primary-600">
                <Loader2 className="inline h-4 w-4 animate-spin" /> Loading users...
              </span>
            )}
          </p>
        </div>

        {/* Search Input */}
        <div className="card p-6">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search people..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-12 w-full"
                autoFocus
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 animate-spin text-primary-600" />
              )}
            </div>
            {hasSearched && searchTerm && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {isSearching ? 'Searching...' : `${searchResults.length} user${searchResults.length !== 1 ? 's' : ''} found`}
                </span>
                <button
                  type="button"
                  onClick={clearSearch}
                  className="btn btn-outline btn-sm"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Search Results */}
        {searchTerm && (
          <div className="card p-6">
            {searchResults.length > 0 && (
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                People
              </h3>
            )}

            {isSearching ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
                <span className="ml-2 text-gray-600">Searching users...</span>
              </div>
            ) : searchResults.length === 0 && searchTerm.length > 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-600">
                  No people found for "{searchTerm}"
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {searchResults.map((user, index) => (
                  <motion.div
                    key={`${user.first_name}-${user.last_name}-${index}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-lg">
                          {user.first_name[0]}{user.last_name[0]}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 text-base">
                          {user.first_name} {user.last_name}
                        </h4>
                        <div className="flex items-center space-x-3 text-sm text-gray-600">
                          <span>{user.profession}</span>
                          {user.activated && (
                            <div className="flex items-center space-x-1">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              <span className="text-green-600 text-xs">Verified</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div>
                      {user.activated ? (
                        <Link
                          to={`/create-escrow?seller=${encodeURIComponent(user.first_name + ' ' + user.last_name)}&seller_id=${user.id}`}
                          className="btn btn-primary btn-sm px-4"
                        >
                          Create Escrow
                        </Link>
                      ) : (
                        <span className="text-xs text-gray-400 px-3">
                          Not verified
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
        {!searchTerm && (
          <div className="card p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
              Find People
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-blue-100 rounded-full flex-shrink-0">
                  <Search className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Instant Search</h4>
                  <p className="text-sm sm:text-base text-gray-600">
                    Just start typing! Results appear instantly as you type, just like Facebook.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-green-100 rounded-full flex-shrink-0">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Create Escrows</h4>
                  <p className="text-sm sm:text-base text-gray-600">
                    Find verified users and create secure escrow transactions with them.
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
