
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
    },
    {
      id: '4',
      title: 'Pemotongan Saldo',
      message: 'Saldo Anda dipotong Rp25.000 untuk biaya layanan GetMassage',
      type: 'info',
      timestamp: new Date(Date.now() - 10800000).toISOString(),
      read: false
    },
    {
      id: '5',
      title: 'Pesanan Selesai',
      message: 'Pesanan GetBarber Anda telah selesai dikerjakan',
      type: 'success',
      timestamp: new Date(Date.now() - 14400000).toISOString(),
      read: false
    }
  ]);

  const unreadNotifications = notifications.filter(n => !n.read);
  const unreadCount = unreadNotifications.length;

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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return 'ℹ️';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
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
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>Notifikasi ({unreadCount} belum dibaca)</span>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllAsRead}>
                <Check className="h-4 w-4 mr-1" />
                Tandai Semua Dibaca
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="max-h-96 overflow-y-auto pr-2">
          {unreadNotifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Tidak ada notifikasi yang belum dibaca</p>
            </div>
          ) : (
            <div className="space-y-3">
              {unreadNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-4 border rounded-lg bg-blue-50 hover:bg-blue-100 cursor-pointer transition-colors"
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-lg flex-shrink-0 mt-1">
                      {getTypeIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className={`font-semibold ${getTypeColor(notification.type)}`}>
                          {notification.title}
                        </h4>
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2 mt-2"></div>
                      </div>
                      <p className="text-sm text-gray-700 mb-2 leading-relaxed">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(notification.timestamp).toLocaleString('id-ID', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              {notifications.filter(n => n.read).length > 0 && (
                <div className="pt-4 border-t">
                  <h5 className="text-sm font-medium text-gray-500 mb-3">Sudah Dibaca</h5>
                  <div className="space-y-2">
                    {notifications.filter(n => n.read).map((notification) => (
                      <div
                        key={notification.id}
                        className="p-3 border rounded-lg bg-gray-50 opacity-75"
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-sm flex-shrink-0 mt-1 opacity-60">
                            {getTypeIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-600 text-sm">
                              {notification.title}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(notification.timestamp).toLocaleString('id-ID', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationDropdown;
