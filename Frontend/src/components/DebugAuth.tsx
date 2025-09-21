import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { userApi } from '../lib/api';

const DebugAuth = () => {
  const { user, isAuthenticated } = useAuthStore();
  const [token, setToken] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string>('');

  useEffect(() => {
    const accessToken = localStorage.getItem('access_token');
    setToken(accessToken);
  }, []);

  const testApiCall = async () => {
    try {
      setTestResult('Testing...');
      const response = await userApi.getProfile();
      setTestResult(`Success: ${JSON.stringify(response.data, null, 2)}`);
    } catch (error: any) {
      setTestResult(`Error: ${error.response?.data?.error || error.message}`);
    }
  };

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg max-w-md text-xs">
      <h3 className="font-bold mb-2">Debug Auth Status</h3>
      <div className="space-y-1">
        <div>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</div>
        <div>User: {user ? `${user.first_name} ${user.last_name}` : 'None'}</div>
        <div>Token: {token ? `${token.substring(0, 20)}...` : 'None'}</div>
        <button 
          onClick={testApiCall}
          className="bg-blue-500 text-white px-2 py-1 rounded text-xs mt-2"
        >
          Test API Call
        </button>
        {testResult && (
          <div className="mt-2 p-2 bg-gray-800 rounded text-xs overflow-auto max-h-32">
            <pre>{testResult}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default DebugAuth;

