import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { userApi } from '../lib/api';
import { getTokenInfo, decodeJWT } from '../lib/tokenUtils';

const DebugAuth = () => {
  const { user, isAuthenticated } = useAuthStore();
  const [token, setToken] = useState<string | null>(null);
  const [tokenHistory, setTokenHistory] = useState<Array<{timestamp: string, token: string, reason: string}>>([]);
  const [testResult, setTestResult] = useState<string>('');
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    // Always start hidden on page load/navigation
    setIsVisible(false);
    
    const accessToken = localStorage.getItem('access_token');
    setToken(accessToken);
    
    // Add initial token to history if it exists
    if (accessToken && tokenHistory.length === 0) {
      setTokenHistory([{
        timestamp: new Date().toLocaleTimeString(),
        token: accessToken,
        reason: 'Initial token'
      }]);
    }
  }, []);

  // Monitor token changes
  useEffect(() => {
    const checkTokenChanges = () => {
      const currentToken = localStorage.getItem('access_token');
      if (currentToken && currentToken !== token) {
        const newEntry = {
          timestamp: new Date().toLocaleTimeString(),
          token: currentToken,
          reason: token ? 'Token refreshed' : 'New token'
        };
        
        setTokenHistory(prev => [...prev, newEntry].slice(-5)); // Keep last 5 tokens
        setToken(currentToken);
        
        // Log to console when token expires/refreshes
        console.log('🔄 Token changed at:', newEntry.timestamp);
        console.log('🆕 Current token:', currentToken);
        
        try {
          const tokenInfo = getTokenInfo(currentToken);
          console.log('📊 Token info:', tokenInfo);
          
          const decoded = decodeJWT(currentToken);
          if (decoded) {
            console.log('⏰ Token expires at:', new Date(decoded.exp * 1000).toLocaleString());
          }
        } catch (e) {
          console.debug('Could not decode token info');
        }
      }
    };

    const interval = setInterval(checkTokenChanges, 1000); // Check every second
    return () => clearInterval(interval);
  }, [token]);

  const testApiCall = async () => {
    try {
      setTestResult('Testing...');
      const response = await userApi.getProfile();
      setTestResult(`Success: ${JSON.stringify(response.data, null, 2)}`);
    } catch (error: any) {
      setTestResult(`Error: ${error.response?.data?.error || error.message}`);
    }
  };

  // Only show in development mode
  const isDevelopment = (import.meta as any).env?.MODE === 'development' || 
                       (import.meta as any).env?.DEV === true;
  
  if (!isDevelopment) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4">
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-gray-800 text-white px-3 py-2 rounded-lg text-xs mb-2 hover:bg-gray-700 transition-colors"
      >
        {isVisible ? '🔍 Hide Debug' : '🔍 Show Debug'}
      </button>
      
      {/* Debug Panel */}
      {isVisible && (
        <div className="bg-black text-white p-4 rounded-lg max-w-lg text-xs max-h-96 overflow-auto">
          <h3 className="font-bold mb-2">Debug Auth Status</h3>
          <div className="space-y-1">
            <div>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</div>
            <div>User: {user ? `${user.first_name} ${user.last_name}` : 'None'}</div>
            <div>Current Token: {token ? 'Present' : 'None'}</div>
            
            <div className="mt-3">
              <div className="font-bold">Token History:</div>
              <div className="max-h-32 overflow-auto space-y-1">
                {tokenHistory.map((entry, index) => (
                  <div key={index} className="border-t border-gray-600 pt-1">
                    <div className="text-green-400">{entry.timestamp} - {entry.reason}</div>
                    <div className="break-all text-yellow-300 text-xs">{entry.token}</div>
                  </div>
                ))}
              </div>
            </div>
            
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
      )}
    </div>
  );
};

export default DebugAuth;

