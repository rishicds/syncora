"use client"
import React, { useState, useEffect } from 'react';
import { Bell, Check, X, ExternalLink, RefreshCw } from 'lucide-react';

// Define types for our data structure
interface Sender {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
}

interface Notification {
  id: string;
  sender_id: string;
  entity_id: string;
  entity_type: 'conversation' | 'profile' | 'project';
  content: string;
  is_read: boolean;
  created_at: string;
  sender: Sender;
}

type FilterType = 'all' | 'unread' | 'read';

const NotificationPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [retryCount, setRetryCount] = useState<number>(0);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // In a real application, replace this with your actual API endpoint
        // const response = await fetch('/api/notifications');
        // if (!response.ok) throw new Error(`Server responded with status: ${response.status}`);
        // const data = await response.json();
        
        // For demonstration, we're using mock data and simulating a network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simulate a network error when retry count is even for demonstration
        if (retryCount % 2 === 0 && retryCount > 0) {
          throw new Error("Unable to connect to server");
        }
        
        // Mock data based on the schema
        const mockData: Notification[] = [
          {
            id: '1',
            sender_id: 'user123',
            entity_id: 'conv456',
            entity_type: 'conversation',
            content: 'Dropped a  take in your convo 🔥',
            is_read: false,
            created_at: '2025-03-29T14:30:00Z',
            sender: {
              id: 'user123',
              username: 'designgod',
              full_name: 'Alex Morgan',
              avatar_url: '/api/placeholder/40/40',
            }
          },
          {
            id: '2',
            sender_id: 'user456',
            entity_id: 'conv789',
            entity_type: 'conversation', 
            content: 'Tagged you in a design challenge',
            is_read: true,
            created_at: '2025-03-28T09:15:00Z',
            sender: {
              id: 'user456',
              username: 'pixelperfect',
              full_name: 'Jamie Chen',
              avatar_url: '/api/placeholder/40/40',
            }
          },
          {
            id: '3',
            sender_id: 'user789',
            entity_id: 'profile123',
            entity_type: 'profile',
            content: 'Started stalking your profile',
            is_read: false,
            created_at: '2025-03-27T16:45:00Z',
            sender: {
              id: 'user789',
              username: 'aestheticfreak',
              full_name: 'Robin Taylor',
              avatar_url: '/api/placeholder/40/40',
            }
          },
          {
            id: '4',
            sender_id: 'user101',
            entity_id: 'project404',
            entity_type: 'project',
            content: 'Your project is trending right now',
            is_read: false,
            created_at: '2025-03-29T18:20:00Z',
            sender: {
              id: 'user101',
              username: 'systemnotic',
              full_name: 'System',
              avatar_url: '/api/placeholder/40/40',
            }
          }
        ];
        
        setNotifications(mockData);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [retryCount]);

  const markAsRead = (id: string): void => {
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => 
        notification.id === id ? { ...notification, is_read: true } : notification
      )
    );
  };

  const markAllAsRead = (): void => {
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => ({ ...notification, is_read: true }))
    );
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const handleRetry = (): void => {
    setRetryCount(prev => prev + 1);
  };

  const filteredNotifications = 
    selectedFilter === 'all' ? notifications :
    selectedFilter === 'unread' ? notifications.filter(n => !n.is_read) :
    notifications.filter(n => n.is_read);

  const unreadCount = notifications.filter(notification => !notification.is_read).length;

  return (
    <div className="min-h-screen bg-black text-gray-100 font-sans antialiased">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header with elegant border bottom */}
        <div className="relative pb-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-3xl font-extrabold text-white">
                Notifications
              </h1>
              {unreadCount > 0 && (
                <div className="bg-white text-black text-xs font-bold px-2 py-1 rounded-full">
                  {unreadCount} new
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <button 
                onClick={markAllAsRead}
                className="text-xs uppercase tracking-wider font-semibold text-gray-400 hover:text-white transition-colors"
                disabled={loading || notifications.length === 0}
              >
                Clear all
              </button>
              <div className="relative">
                <Bell className="h-6 w-6 text-white" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full"></span>
                )}
              </div>
            </div>
          </div>
          
          {/* Elegant border */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-800"></div>
        </div>

        {/* Filters */}
        {!error && (
          <div className="flex space-x-4 mb-6">
            {(['all', 'unread', 'read'] as FilterType[]).map(filter => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-4 py-2 text-sm rounded-full transition-all ${
                  selectedFilter === filter 
                    ? 'bg-white text-black font-medium' 
                    : 'text-gray-500 hover:text-gray-300'
                }`}
                disabled={loading}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-t-2 border-white border-r-2 border-transparent rounded-full animate-spin mb-4"></div>
            <div className="text-gray-400 text-sm uppercase tracking-wide">Loading notifications...</div>
          </div>
        ) : error ? (
          <div className="bg-gray-900 rounded-xl p-8 text-center border border-gray-800">
            <div className="text-white mb-2 text-lg font-bold">Connection Error</div>
            <div className="text-gray-400 text-sm mb-6">{error}</div>
            <button 
              onClick={handleRetry}
              className="inline-flex items-center space-x-2 bg-white hover:bg-gray-200 text-black px-4 py-2 rounded-lg transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Retry Connection</span>
            </button>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-gray-900 rounded-xl p-12 text-center border border-gray-800">
            <Bell className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <div className="text-xl font-bold mb-2 text-white">Nothing to see here</div>
            <div className="text-gray-400">Your notification queue is empty</div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map(notification => (
              <div 
                key={notification.id} 
                className={`p-5 rounded-xl ${
                  notification.is_read 
                    ? 'bg-gray-900 border border-gray-800' 
                    : 'bg-gray-900 border border-gray-700 shadow-lg'
                } hover:border-gray-600 transition-all duration-300 group`}
              >
                <div className="flex">
                  {/* Avatar with elegant frame for unread */}
                  <div className="flex-shrink-0 mr-4 relative">
                    <div className={`w-12 h-12 rounded-xl overflow-hidden ${
                      !notification.is_read ? 'ring-1 ring-white ring-offset-1 ring-offset-black' : ''
                    }`}>
                      <img 
                        src={notification.sender.avatar_url} 
                        alt={notification.sender.full_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {!notification.is_read && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full"></div>
                    )}
                  </div>
                  
                  <div className="flex-grow">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className={`font-medium text-lg ${!notification.is_read ? 'text-white' : 'text-gray-300'}`}>
                          {notification.content}
                        </p>
                        <div className="mt-1 flex items-center space-x-2">
                          <span className="text-white font-medium text-sm">
                            @{notification.sender.username}
                          </span>
                          <span className="text-gray-500 text-xs">
                            {formatDate(notification.created_at)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
                        {!notification.is_read && (
                          <button 
                            onClick={() => markAsRead(notification.id)}
                            className="p-1.5 hover:bg-gray-800 rounded-full transition-colors"
                            title="Mark as read"
                          >
                            <Check className="h-4 w-4 text-white" />
                          </button>
                        )}
                        <button className="p-1.5 hover:bg-gray-800 rounded-full transition-colors opacity-0 group-hover:opacity-100">
                          <X className="h-4 w-4 text-gray-500 hover:text-gray-300" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Action button with hover effect */}
                    <div className="mt-3">
                      {notification.entity_type === 'conversation' && (
                        <button className="inline-flex items-center space-x-1 text-xs uppercase tracking-wide font-semibold text-gray-400 hover:text-white transition-colors">
                          <span>Open conversation</span>
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      )}
                      
                      {notification.entity_type === 'profile' && (
                        <button className="inline-flex items-center space-x-1 text-xs uppercase tracking-wide font-semibold text-gray-400 hover:text-white transition-colors">
                          <span>View profile</span>
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      )}
                      
                      {notification.entity_type === 'project' && (
                        <button className="inline-flex items-center space-x-1 text-xs uppercase tracking-wide font-semibold text-gray-400 hover:text-white transition-colors">
                          <span>Check it out</span>
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Minimalist fixed element */}
        <div className="fixed bottom-8 left-8 text-xs uppercase tracking-widest font-semibold">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
            <span className="text-white">
              Notifications / {new Date().getFullYear()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPage;