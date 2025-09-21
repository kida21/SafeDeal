import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Plus, 
  User, 
  LogOut, 
  Lock,
  Bell,
  Settings,
  Shield,
  CreditCard,
  Search
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../lib/api';
import { toast } from 'react-hot-toast';
import DebugAuth from './DebugAuth';
import NotificationCenter from './NotificationCenter';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = async () => {
    try {
      await authApi.logout();
      logout();
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      logout(); // Still logout locally even if API call fails
    }
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'My Escrows', href: '/escrows', icon: Shield },
    { name: 'Create Escrow', href: '/create-escrow', icon: Plus },
    { name: 'Search Users', href: '/search', icon: Search },
    { name: 'Transactions', href: '/transactions', icon: CreditCard },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-8 h-8 bg-primary-600 rounded-lg">
                <Lock className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">SafeDeal</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-primary-700">
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pl-64">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {navigation.find(item => isActive(item.href))?.name || 'Dashboard'}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setShowNotifications(true)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors relative"
              >
                <Bell className="h-5 w-5" />
                {/* Notification badge could be added here */}
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
      
      {/* Debug Component */}
      <DebugAuth />
      
      {/* Notification Center */}
      <NotificationCenter 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
      />
    </div>
  );
};

export default Layout;
