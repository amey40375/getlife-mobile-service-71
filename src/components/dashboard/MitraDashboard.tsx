import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogOut, Clock, Play, Square, MessageCircle, History, CreditCard, Plus, Upload } from "lucide-react";
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
  const [topupAmount, setTopupAmount] = useState("");
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [transferProof, setTransferProof] = useState<File | null>(null);
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

  const formatCurrency = (amount: string) => {
    const numericAmount = amount.replace(/\D/g, '');
    if (!numericAmount) return '';
    
    const formatted = new Intl.NumberFormat('id-ID').format(parseInt(numericAmount));
    return `Rp.${formatted},-`;
  };

  const handleTopupSubmit = () => {
    if (!topupAmount || !mitraProfile) {
      toast({
        variant: "destructive",
        title: "Masukkan nominal",
        description: "Masukkan nominal top-up"
      });
      return;
    }

    const numericAmount = topupAmount.replace(/\D/g, '');
    const amount = parseFloat(numericAmount);
    if (amount <= 0) {
      toast({
        variant: "destructive",
        title: "Nominal tidak valid",
        description: "Masukkan nominal yang valid"
      });
      return;
    }

    setShowTopupModal(false);
    setShowPaymentModal(true);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setTransferProof(file);
    }
  };

  const handleSendTopupRequest = () => {
    if (!transferProof || !topupAmount || !mitraProfile) {
      toast({
        variant: "destructive",
        title: "Upload bukti transfer",
        description: "Bukti transfer wajib diupload"
      });
      return;
    }

    const numericAmount = topupAmount.replace(/\D/g, '');
    const amount = parseFloat(numericAmount);

    const transactions = storage.getTransactions();
    const newTransaction = {
      id: Date.now().toString(),
      userId: mitraProfile.email,
      userName: mitraProfile.name,
      type: 'topup' as const,
      amount: amount,
      status: 'pending' as const,
      transferProof: transferProof.name,
      createdAt: new Date().toISOString()
    };

    storage.setTransactions([...transactions, newTransaction]);

    toast({
      title: "Permintaan top-up dikirim",
      description: "Menunggu konfirmasi admin"
    });

    setTopupAmount("");
    setTransferProof(null);
    setShowPaymentModal(false);
    setCurrentView("main");
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-blue-50">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-600 to-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">G</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                GetLife
              </h1>
            </div>
            <Button variant="outline" onClick={onLogout} className="hover:bg-red-50 hover:text-red-600 hover:border-red-200">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Welcome & Balance Card */}
        <div className="p-6">
          <Card className="bg-gradient-to-r from-emerald-600/10 via-slate-50/50 to-blue-600/10 border-0 shadow-xl backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-lg font-medium text-slate-700">Halo, {mitraProfile.name}!</p>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-sm text-slate-500">Saldo Anda</span>
                    <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                      Rp.{mitraProfile.saldo.toLocaleString()},-
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={() => setShowTopupModal(true)}
                  className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-3"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  TOP-UP SALDO
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Work Timer */}
        {isWorking && activeOrder && (
          <div className="px-6 mb-6">
            <Card className="bg-gradient-to-r from-amber-100/80 to-orange-100/80 border-amber-300/30 shadow-xl">
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-sm text-slate-700 mb-2 font-medium">Sedang Bekerja: {activeOrder.service}</p>
                  <p className="text-4xl font-bold text-amber-700 mb-3">{formatTime(workTimer)}</p>
                  <p className="text-sm text-slate-600 mb-4">
                    Estimasi biaya: Rp.{Math.round(workTimer * RATE_PER_SECOND).toLocaleString()},-
                  </p>
                  <Button 
                    onClick={handleFinishWork} 
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    SELESAI
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Orders Sections */}
        <div className="px-6 space-y-6">
          {/* Pesanan Masuk */}
          {pendingOrders.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-slate-800 mb-4">📋 Pesanan Masuk</h2>
              <div className="space-y-3">
                {pendingOrders.map((order) => (
                  <Card key={order.id} className="bg-white/70 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-bold text-slate-800">{order.service}</h3>
                          <p className="text-sm text-slate-600">
                            {new Date(order.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <Button
                          onClick={() => handleAcceptOrder(order)}
                          className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                          disabled={mitraProfile.saldo < 10000}
                        >
                          TERIMA
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
            <div>
              <h2 className="text-lg font-bold text-slate-800 mb-4">⚡ Sedang Dikerjakan</h2>
              <div className="space-y-3">
                {activeOrders.map((order) => (
                  <Card key={order.id} className="bg-white/70 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-bold text-slate-800">{order.service}</h3>
                          <p className="text-sm text-slate-600">
                            Mulai: {order.startTime ? new Date(order.startTime).toLocaleString() : '-'}
                          </p>
                        </div>
                        {!isWorking && (
                          <Button
                            onClick={() => handleStartWork(order)}
                            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            MULAI BEKERJA
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
              className="h-20 flex-col bg-white/70 backdrop-blur-sm hover:bg-blue-50 hover:border-blue-200 transition-all duration-300 shadow-lg hover:shadow-xl"
              onClick={() => setCurrentView("history")}
            >
              <History className="h-6 w-6 mb-2 text-blue-600" />
              <span className="font-medium">Riwayat Pesanan</span>
            </Button>

            <Button
              variant="outline"
              className="h-20 flex-col bg-white/70 backdrop-blur-sm hover:bg-purple-50 hover:border-purple-200 transition-all duration-300 shadow-lg hover:shadow-xl"
              onClick={() => setCurrentView("chat")}
            >
              <MessageCircle className="h-6 w-6 mb-2 text-purple-600" />
              <span className="font-medium">Live Chat Admin</span>
            </Button>
          </div>

          {/* Info */}
          {pendingOrders.length === 0 && activeOrders.length === 0 && (
            <Card className="bg-white/70 backdrop-blur-sm shadow-lg">
              <CardContent className="p-8 text-center">
                <p className="text-slate-600 font-medium">✨ Belum ada pesanan masuk</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Top-up Modal */}
        <Dialog open={showTopupModal} onOpenChange={setShowTopupModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center text-xl font-bold text-slate-800">Top-Up Saldo</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 p-2">
              <div className="text-center">
                <p className="text-sm text-slate-600 mb-4">
                  Saldo saat ini: <span className="font-bold text-emerald-600">Rp.{mitraProfile.saldo.toLocaleString()},-</span>
                </p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Nominal Top-Up *</Label>
                <Input
                  type="text"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(formatCurrency(e.target.value))}
                  placeholder="Rp.0,-"
                  className="text-lg font-medium text-center border-2 focus:border-emerald-500"
                />
              </div>

              <Button 
                onClick={handleTopupSubmit} 
                className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white font-medium py-3"
                disabled={!topupAmount}
              >
                PROSES
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Payment Modal */}
        <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-center text-xl font-bold text-slate-800">Instruksi Pembayaran</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 p-2">
              <div className="bg-gradient-to-r from-emerald-50 to-blue-50 p-4 rounded-xl border border-emerald-200">
                <p className="text-sm text-slate-700 text-center mb-3">
                  Untuk Proses Top Up Saldo Silahkan Kirimkan Pembayaran VIA GoPay Di Nomor:
                </p>
                <div className="text-center bg-white p-3 rounded-lg border-2 border-dashed border-emerald-300">
                  <p className="text-lg font-bold text-emerald-600">085137646489</p>
                  <p className="text-sm text-slate-600">a/n</p>
                  <p className="text-lg font-bold text-blue-600">UUS KUSMIATI</p>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium text-slate-700">
                  Upload Bukti Transfer Disini <span className="text-red-500">*</span>
                </Label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-emerald-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="transfer-proof"
                  />
                  <label
                    htmlFor="transfer-proof"
                    className="cursor-pointer flex flex-col items-center space-y-2"
                  >
                    <Upload className="h-8 w-8 text-slate-400" />
                    <span className="text-sm text-slate-600">
                      {transferProof ? transferProof.name : "Klik untuk upload bukti transfer"}
                    </span>
                  </label>
                </div>
              </div>

              <Button 
                onClick={handleSendTopupRequest} 
                className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-medium py-3"
                disabled={!transferProof}
              >
                KIRIM
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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
