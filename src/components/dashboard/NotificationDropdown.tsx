
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, X } from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'info' | 'error';
  timestamp: string;
  read: boolean;
}

interface NotificationDropdownProps {
  userEmail: string;
  userRole: 'admin' | 'mitra' | 'user';
}

const NotificationDropdown = ({ userEmail, userRole }: NotificationDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Top-up Berhasil',
      message: 'Saldo Anda telah berhasil ditambahkan sebesar Rp100.000',
      type: 'success',
      timestamp: new Date().toISOString(),
      read: false
    },
    {
      id: '2',
      title: 'Pesanan Diterima',
      message: 'Pesanan GetClean Anda telah diterima oleh mitra',
      type: 'info',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      read: false
    },
    {
      id: '3',
      title: 'Peringatan Admin',
      message: 'Harap lengkapi profil Anda untuk meningkatkan layanan',
      type: 'warning',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      read: true
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-blue-600';
    }
  };

  return (
    <div className="relative z-[9999]">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-[9998]" onClick={() => setIsOpen(false)}>
          <div 
            className="absolute right-6 top-16 w-80 bg-white border rounded-lg shadow-2xl z-[9999]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b flex justify-between items-center bg-white rounded-t-lg">
              <h3 className="font-semibold text-gray-800">Notifikasi</h3>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                  <Check className="h-4 w-4 mr-1" />
                  Tandai Semua
                </Button>
              )}
            </div>
            
            <div className="max-h-96 overflow-y-auto bg-white">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  Tidak ada notifikasi
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.read ? 'bg-blue-50' : 'bg-white'
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className={`font-medium ${getTypeColor(notification.type)}`}>
                          {notification.title}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(notification.timestamp).toLocaleString()}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
