import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LogOut, Plus, History, MessageCircle, ShoppingCart, Settings, MapPin, HelpCircle, CreditCard, Upload } from "lucide-react";
import { storage, Profile, Order } from "@/lib/storage";
import { auth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface UserDashboardProps {
  onLogout: () => void;
}

const UserDashboard = ({ onLogout }: UserDashboardProps) => {
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [mitras, setMitras] = useState<Profile[]>([]);
  const [currentView, setCurrentView] = useState("main");
  const [selectedService, setSelectedService] = useState("");
  const [selectedMitra, setSelectedMitra] = useState("");
  const [topupAmount, setTopupAmount] = useState("");
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [transferProof, setTransferProof] = useState<File | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const currentUser = auth.getCurrentUser();
    if (currentUser) {
      setUserProfile(currentUser);
      
      const allOrders = storage.getOrders();
      const userOrders = allOrders.filter(order => order.userId === currentUser.email);
      setOrders(userOrders);
      
      const allProfiles = storage.getProfiles();
      const mitraProfiles = allProfiles.filter(p => p.role === 'mitra' && p.status === 'verified');
      setMitras(mitraProfiles);
    }
  };

  const formatCurrency = (amount: string) => {
    const numericAmount = amount.replace(/\D/g, '');
    if (!numericAmount) return '';
    
    const formatted = new Intl.NumberFormat('id-ID').format(parseInt(numericAmount));
    return `Rp.${formatted},-`;
  };

  const handleTopupSubmit = () => {
    if (!topupAmount || !userProfile) {
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
    if (!transferProof || !topupAmount || !userProfile) {
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
      userId: userProfile.email,
      userName: userProfile.name,
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

  const handleCreateOrder = () => {
    if (!selectedService || !selectedMitra || !userProfile) {
      toast({
        variant: "destructive",
        title: "Data tidak lengkap",
        description: "Pilih layanan dan mitra"
      });
      return;
    }

    const newOrder: Order = {
      id: Date.now().toString(),
      userId: userProfile.email,
      mitraId: selectedMitra,
      service: selectedService as 'GetClean' | 'GetMassage' | 'GetBarber',
      status: 'menunggu',
      createdAt: new Date().toISOString()
    };

    const allOrders = storage.getOrders();
    storage.setOrders([...allOrders, newOrder]);

    toast({
      title: "Pesanan berhasil dibuat",
      description: "Menunggu konfirmasi dari mitra"
    });

    setSelectedService("");
    setSelectedMitra("");
    setCurrentView("main");
    loadData();
  };

  if (!userProfile) {
    return <div>Loading...</div>;
  }

  if (currentView === "main") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">G</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
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
          <Card className="bg-gradient-to-r from-blue-600/10 via-slate-50/50 to-emerald-600/10 border-0 shadow-xl backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-lg font-medium text-slate-700">Halo, {userProfile.name}!</p>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-sm text-slate-500">Saldo Anda</span>
                    <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                      Rp.{userProfile.saldo.toLocaleString()},-
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={() => setShowTopupModal(true)}
                  className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-3"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  TOP-UP SALDO
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Menu Grid */}
        <div className="px-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="h-24 flex-col bg-white/70 backdrop-blur-sm hover:bg-blue-50 hover:border-blue-200 transition-all duration-300 shadow-lg hover:shadow-xl"
              onClick={() => setCurrentView("order")}
            >
              <ShoppingCart className="h-6 w-6 mb-2 text-blue-600" />
              <span className="font-medium">Pesan Layanan</span>
            </Button>

            <Button
              variant="outline"
              className="h-24 flex-col bg-white/70 backdrop-blur-sm hover:bg-emerald-50 hover:border-emerald-200 transition-all duration-300 shadow-lg hover:shadow-xl"
              onClick={() => setCurrentView("history")}
            >
              <History className="h-6 w-6 mb-2 text-emerald-600" />
              <span className="font-medium">Riwayat</span>
            </Button>

            <Button
              variant="outline"
              className="h-24 flex-col bg-white/70 backdrop-blur-sm hover:bg-purple-50 hover:border-purple-200 transition-all duration-300 shadow-lg hover:shadow-xl"
              onClick={() => setCurrentView("chat")}
            >
              <MessageCircle className="h-6 w-6 mb-2 text-purple-600" />
              <span className="font-medium">Live Chat</span>
            </Button>

            <Button
              variant="outline"
              className="h-24 flex-col bg-white/70 backdrop-blur-sm hover:bg-orange-50 hover:border-orange-200 transition-all duration-300 shadow-lg hover:shadow-xl"
              onClick={() => setCurrentView("track")}
            >
              <MapPin className="h-6 w-6 mb-2 text-orange-600" />
              <span className="font-medium">Lacak Pesanan</span>
            </Button>
          </div>
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
                  Saldo saat ini: <span className="font-bold text-blue-600">Rp.{userProfile.saldo.toLocaleString()},-</span>
                </p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Nominal Top-Up *</Label>
                <Input
                  type="text"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(formatCurrency(e.target.value))}
                  placeholder="Rp.0,-"
                  className="text-lg font-medium text-center border-2 focus:border-blue-500"
                />
              </div>

              <Button 
                onClick={handleTopupSubmit} 
                className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-medium py-3"
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
              <div className="bg-gradient-to-r from-blue-50 to-emerald-50 p-4 rounded-xl border border-blue-200">
                <p className="text-sm text-slate-700 text-center mb-3">
                  Untuk Proses Top Up Saldo Silahkan Kirimkan Pembayaran VIA GoPay Di Nomor:
                </p>
                <div className="text-center bg-white p-3 rounded-lg border-2 border-dashed border-blue-300">
                  <p className="text-lg font-bold text-blue-600">085137646489</p>
                  <p className="text-sm text-slate-600">a/n</p>
                  <p className="text-lg font-bold text-emerald-600">UUS KUSMIATI</p>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium text-slate-700">
                  Upload Bukti Transfer Disini <span className="text-red-500">*</span>
                </Label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
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
                className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white font-medium py-3"
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
          {currentView === "order" && "Pesan Layanan"}
          {currentView === "history" && "Riwayat Pesanan"}
          {currentView === "track" && "Lacak Pesanan"}
          {currentView === "chat" && "Live Chat"}
        </h1>
      </div>

      {currentView === "order" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Buat Pesanan Baru</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Pilih Layanan</Label>
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih layanan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GetClean">🧹 GetClean - Kebersihan Rumah</SelectItem>
                    <SelectItem value="GetMassage">💆 GetMassage - Pijat Urut</SelectItem>
                    <SelectItem value="GetBarber">✂️ GetBarber - Potong Rambut</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedService && (
                <div>
                  <Label>Pilih Mitra</Label>
                  <Select value={selectedMitra} onValueChange={setSelectedMitra}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih mitra" />
                    </SelectTrigger>
                    <SelectContent>
                      {mitras
                        .filter(mitra => mitra.expertise === selectedService)
                        .map(mitra => (
                          <SelectItem key={mitra.email} value={mitra.email}>
                            {mitra.name} - {mitra.expertise}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button 
                onClick={handleCreateOrder} 
                className="w-full" 
                variant="hero"
                disabled={!selectedService || !selectedMitra}
              >
                Buat Pesanan
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {currentView === "history" && (
        <div className="space-y-4">
          {orders.filter(order => order.status === 'selesai').map((order) => {
            const mitra = mitras.find(m => m.email === order.mitraId);
            return (
              <Card key={order.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{order.service}</h3>
                      <p className="text-sm text-muted-foreground">Mitra: {mitra?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                      {order.totalCost && (
                        <p className="text-sm font-medium">Total: Rp{order.totalCost.toLocaleString()}</p>
                      )}
                    </div>
                    <Badge variant="outline">Selesai</Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {orders.filter(order => order.status === 'selesai').length === 0 && (
            <p className="text-center text-muted-foreground">Belum ada riwayat pesanan</p>
          )}
        </div>
      )}

      {currentView === "track" && (
        <div className="space-y-4">
          {orders.filter(order => order.status !== 'selesai').map((order) => {
            const mitra = mitras.find(m => m.email === order.mitraId);
            return (
              <Card key={order.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{order.service}</h3>
                      <p className="text-sm text-muted-foreground">Mitra: {mitra?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <Badge 
                      variant={
                        order.status === 'menunggu' ? 'outline' :
                        order.status === 'dikerjakan' ? 'secondary' : 'destructive'
                      }
                    >
                      {order.status === 'menunggu' ? 'Menunggu' :
                       order.status === 'dikerjakan' ? 'Dikerjakan' : order.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {orders.filter(order => order.status !== 'selesai').length === 0 && (
            <p className="text-center text-muted-foreground">Tidak ada pesanan aktif</p>
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

export default UserDashboard;
