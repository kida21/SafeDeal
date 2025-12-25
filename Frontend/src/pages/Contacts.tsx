import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import Layout from '../components/Layout';
import { userApi } from '../lib/api';
import { SearchUser } from '../types';
import { toast } from 'react-hot-toast';

type Contact = SearchUser & { created_at?: string };

const Contacts = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContacts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await userApi.getContacts();
        // Backend shape: { contacts: SearchUser[], total: number }
        const list = Array.isArray(res.data?.contacts) ? res.data.contacts : [];
        setContacts(list as Contact[]);
      } catch (err: any) {
        console.log(err);
        const msg = err?.response?.data?.message || 'Failed to load contacts';
        setError(msg);
        toast.error(msg);
      } finally {
        setIsLoading(false);
      }
    };
    fetchContacts();
  }, []);

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
          <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
          <p className="text-gray-600 mt-2">
            Your saved contacts for quick escrow creation
            {isLoading && (
              <span className="ml-2 text-primary-600">
                <Loader2 className="inline h-4 w-4 animate-spin" /> Loading contacts...
              </span>
            )}
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="card p-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && contacts.length === 0 && (
          <div className="card p-12 text-center">
            {/* <S className="h-12 w-12 text-gray-400 mx-auto mb-3" /> */}
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No contacts yet</h3>
            <p className="text-gray-600">Search for users and create escrows to build your contacts list.</p>
          </div>
        )}

        {/* Contacts List */}
        {!isLoading && !error && contacts.length > 0 && (
          <div className="card p-0">
            <div className="divide-y">
            {contacts.map((user, index) => (
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
                        {(user.first_name?.[0] || '').toUpperCase()}{(user.last_name?.[0] || '').toUpperCase()}
                      </span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 text-base">
                          {user.first_name} {user.last_name}
                        </h4>
                        <div className="flex items-center space-x-3 text-sm text-gray-600">
                          <span>{user.profession}</span>
                          <span>{user.email}</span>
                          { (
                            <div className="flex items-center space-x-1">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              <span className="text-green-600 text-xs">Verified</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div>
                      { (
                        <Link
                          to={`/create-escrow?seller=${encodeURIComponent(user.first_name + ' ' + user.last_name)}&seller_id=${user.id}`}
                          className="btn btn-primary btn-sm px-4"
                        >
                          Create Escrow
                        </Link>
                      ) }
                    </div>
                  </motion.div>
                ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Contacts;
