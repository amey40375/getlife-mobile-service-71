import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LogOut, Clock, Play, Square, MessageCircle, History, CreditCard } from "lucide-react";
import { storage, Profile, Order } from "@/lib/storage";
import { auth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface MitraDashboardProps {
  onLogout: () => void;
}

const MitraDashboard = ({ onLogout }: MitraDashboardProps) => {
  const [mitraProfile, setMitraProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentView, setCurrentView] = useState("main");
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [workTimer, setWorkTimer] = useState(0);
  const [isWorking, setIsWorking] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [debt, setDebt] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const HOURLY_RATE = 125000; // Rp 125,000 per hour
  const RATE_PER_SECOND = HOURLY_RATE / 3600; // Rp 34.72 per second
  const ADMIN_CUT = 0.25; // 25%

  useEffect(() => {
    loadData();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isWorking && timerRef.current === null) {
      timerRef.current = setInterval(() => {
        setWorkTimer(prev => prev + 1);
      }, 1000);
    } else if (!isWorking && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [isWorking]);

  const loadData = () => {
    const currentUser = auth.getCurrentUser();
    if (currentUser) {
      setMitraProfile(currentUser);
      
      const allOrders = storage.getOrders();
      const mitraOrders = allOrders.filter(order => order.mitraId === currentUser.email);
      setOrders(mitraOrders);

      // Check if blocked
      const blocked = storage.getBlockedAccounts();
      if (blocked.includes(currentUser.email)) {
        setIsBlocked(true);
        // Calculate debt (this would be calculated based on actual business logic)
        setDebt(50000); // Example debt
      }
    }
  };

  const handleAcceptOrder = (order: Order) => {
    if (!mitraProfile) return;

    if (mitraProfile.saldo < 10000) {
      toast({
        variant: "destructive",
        title: "Saldo tidak cukup",
        description: "Minimal saldo Rp10.000 untuk menerima pesanan"
      });
      return;
    }

    const updatedOrders = orders.map(o =>
      o.id === order.id ? { ...o, status: 'dikerjakan' as const } : o
    );
    
    const allOrders = storage.getOrders();
    const newAllOrders = allOrders.map(o =>
      o.id === order.id ? { ...o, status: 'dikerjakan' as const } : o
    );
    
    storage.setOrders(newAllOrders);
    setOrders(updatedOrders);

    toast({
      title: "Pesanan diterima",
      description: "Pesanan berhasil diterima"
    });
  };

  const handleStartWork = (order: Order) => {
    setActiveOrder(order);
    setIsWorking(true);
    setWorkTimer(0);

    const updatedOrders = orders.map(o =>
      o.id === order.id ? { ...o, startTime: new Date().toISOString() } : o
    );
    
    const allOrders = storage.getOrders();
    const newAllOrders = allOrders.map(o =>
      o.id === order.id ? { ...o, startTime: new Date().toISOString() } : o
    );
    
    storage.setOrders(newAllOrders);
    setOrders(updatedOrders);

    toast({
      title: "Mulai bekerja",
      description: "Timer dimulai"
    });
  };

  const handleFinishWork = () => {
    if (!activeOrder || !mitraProfile) return;

    const totalCost = Math.round(workTimer * RATE_PER_SECOND);
    const adminCut = Math.round(totalCost * ADMIN_CUT);
    const newSaldo = mitraProfile.saldo - adminCut;

    if (newSaldo < 0) {
      // Block account
      const blocked = storage.getBlockedAccounts();
      storage.setBlockedAccounts([...blocked, mitraProfile.email]);
      setIsBlocked(true);
      setDebt(Math.abs(newSaldo));
      
      toast({
        variant: "destructive",
        title: "Akun terkunci",
        description: `Tagihan Rp${Math.abs(newSaldo).toLocaleString()} belum dibayar`
      });
      return;
    }

    // Update order
    const updatedOrders = orders.map(o =>
      o.id === activeOrder.id ? {
        ...o,
        status: 'selesai' as const,
        endTime: new Date().toISOString(),
        totalCost: totalCost
      } : o
    );
    
    const allOrders = storage.getOrders();
    const newAllOrders = allOrders.map(o =>
      o.id === activeOrder.id ? {
        ...o,
        status: 'selesai' as const,
        endTime: new Date().toISOString(),
        totalCost: totalCost
      } : o
    );
    
    storage.setOrders(newAllOrders);
    setOrders(updatedOrders);

    // Update mitra saldo
    const profiles = storage.getProfiles();
    const updatedProfiles = profiles.map(p =>
      p.email === mitraProfile.email ? { ...p, saldo: newSaldo } : p
    );
    storage.setProfiles(updatedProfiles);
    setMitraProfile({ ...mitraProfile, saldo: newSaldo });

    setIsWorking(false);
    setActiveOrder(null);
    setWorkTimer(0);

    toast({
      title: "Pekerjaan selesai",
      description: `Total biaya: Rp${totalCost.toLocaleString()}, Potongan: Rp${adminCut.toLocaleString()}`
    });
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!mitraProfile) {
    return <div>Loading...</div>;
  }

  // Blocked account modal
  if (isBlocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center text-destructive">Akun Terkunci</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p>Tagihan Rp{debt.toLocaleString()} belum dibayar.</p>
            <p className="text-sm text-muted-foreground">Chat Admin untuk membuka blokir.</p>
            <Button variant="hero" className="w-full">
              <MessageCircle className="h-4 w-4 mr-2" />
              Live Chat Admin
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentView === "main") {
    const pendingOrders = orders.filter(order => order.status === 'menunggu');
    const activeOrders = orders.filter(order => order.status === 'dikerjakan');

    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Mitra Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">Halo, {mitraProfile.name}!</p>
          </div>
          <Button variant="outline" onClick={onLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Saldo Card */}
        <Card className="mb-6 bg-gradient-to-r from-secondary/10 to-primary/10 border-secondary/20">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Saldo Anda</p>
                <p className="text-2xl font-bold text-secondary">Rp{mitraProfile.saldo.toLocaleString()}</p>
              </div>
              <Button variant="elegant">
                <CreditCard className="h-4 w-4 mr-2" />
                Tarik Saldo
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Active Work Timer */}
        {isWorking && activeOrder && (
          <Card className="mb-6 bg-gradient-to-r from-warning/10 to-warning/20 border-warning/30">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Sedang Bekerja: {activeOrder.service}</p>
                <p className="text-3xl font-bold text-warning mb-2">{formatTime(workTimer)}</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Estimasi biaya: Rp{Math.round(workTimer * RATE_PER_SECOND).toLocaleString()}
                </p>
                <Button onClick={handleFinishWork} variant="destructive">
                  <Square className="h-4 w-4 mr-2" />
                  Selesai
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pesanan Masuk */}
        {pendingOrders.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Pesanan Masuk</h2>
            <div className="space-y-3">
              {pendingOrders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold">{order.service}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <Button
                        onClick={() => handleAcceptOrder(order)}
                        variant="success"
                        disabled={mitraProfile.saldo < 10000}
                      >
                        Terima
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Sedang Dikerjakan */}
        {activeOrders.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Sedang Dikerjakan</h2>
            <div className="space-y-3">
              {activeOrders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold">{order.service}</h3>
                        <p className="text-sm text-muted-foreground">
                          Mulai: {order.startTime ? new Date(order.startTime).toLocaleString() : '-'}
                        </p>
                      </div>
                      {!isWorking && (
                        <Button
                          onClick={() => handleStartWork(order)}
                          variant="success"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Mulai Bekerja
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Menu Grid */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            className="h-20 flex-col"
            onClick={() => setCurrentView("history")}
          >
            <History className="h-6 w-6 mb-2" />
            Riwayat Pesanan
          </Button>

          <Button
            variant="outline"
            className="h-20 flex-col"
            onClick={() => setCurrentView("chat")}
          >
            <MessageCircle className="h-6 w-6 mb-2" />
            Live Chat Admin
          </Button>
        </div>

        {/* Info */}
        {pendingOrders.length === 0 && activeOrders.length === 0 && (
          <Card className="mt-6">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">Belum ada pesanan masuk</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" onClick={() => setCurrentView("main")}>
          ← Kembali
        </Button>
        <h1 className="text-xl font-semibold">
          {currentView === "history" && "Riwayat Pesanan"}
          {currentView === "chat" && "Live Chat Admin"}
        </h1>
      </div>

      {currentView === "history" && (
        <div className="space-y-4">
          {orders.filter(order => order.status === 'selesai').map((order) => (
            <Card key={order.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{order.service}</h3>
                    <p className="text-sm text-muted-foreground">
                      Mulai: {order.startTime ? new Date(order.startTime).toLocaleString() : '-'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Selesai: {order.endTime ? new Date(order.endTime).toLocaleString() : '-'}
                    </p>
                    {order.totalCost && (
                      <p className="text-sm font-medium">Total: Rp{order.totalCost.toLocaleString()}</p>
                    )}
                  </div>
                  <Badge variant="outline">Selesai</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
          {orders.filter(order => order.status === 'selesai').length === 0 && (
            <p className="text-center text-muted-foreground">Belum ada riwayat pesanan</p>
          )}
        </div>
      )}

      {currentView === "chat" && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Fitur live chat sedang dalam pengembangan</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MitraDashboard;