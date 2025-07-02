import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LogOut, Plus, History, MessageCircle, ShoppingCart, Settings, MapPin, HelpCircle, CreditCard } from "lucide-react";
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

  const handleTopup = () => {
    if (!topupAmount || !userProfile) {
      toast({
        variant: "destructive",
        title: "Masukkan nominal",
        description: "Masukkan nominal top-up"
      });
      return;
    }

    const amount = parseFloat(topupAmount);
    if (amount <= 0) {
      toast({
        variant: "destructive",
        title: "Nominal tidak valid",
        description: "Masukkan nominal yang valid"
      });
      return;
    }

    const transactions = storage.getTransactions();
    const newTransaction = {
      id: Date.now().toString(),
      userId: userProfile.email,
      type: 'topup' as const,
      amount: amount,
      status: 'pending' as const,
      createdAt: new Date().toISOString()
    };

    storage.setTransactions([...transactions, newTransaction]);

    toast({
      title: "Permintaan top-up dikirim",
      description: "Menunggu konfirmasi admin"
    });

    setTopupAmount("");
    setCurrentView("main");
  };

  if (!userProfile) {
    return <div>Loading...</div>;
  }

  if (currentView === "main") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              GetLife
            </h1>
            <p className="text-sm text-muted-foreground">Halo, {userProfile.name}!</p>
          </div>
          <Button variant="outline" onClick={onLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Saldo Card */}
        <Card className="mb-6 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Saldo Anda</p>
                <p className="text-2xl font-bold text-primary">Rp{userProfile.saldo.toLocaleString()}</p>
              </div>
              <Button variant="hero" onClick={() => setCurrentView("topup")}>
                <Plus className="h-4 w-4 mr-2" />
                TOP-UP
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Menu Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Button
            variant="outline"
            className="h-20 flex-col"
            onClick={() => setCurrentView("order")}
          >
            <ShoppingCart className="h-6 w-6 mb-2" />
            Pesan Layanan
          </Button>

          <Button
            variant="outline"
            className="h-20 flex-col"
            onClick={() => setCurrentView("history")}
          >
            <History className="h-6 w-6 mb-2" />
            Riwayat
          </Button>

          <Button
            variant="outline"
            className="h-20 flex-col"
            onClick={() => setCurrentView("chat")}
          >
            <MessageCircle className="h-6 w-6 mb-2" />
            Live Chat
          </Button>

          <Button
            variant="outline"
            className="h-20 flex-col"
            onClick={() => setCurrentView("services")}
          >
            <Settings className="h-6 w-6 mb-2" />
            Pilih Layanan
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            className="h-20 flex-col"
            onClick={() => setCurrentView("settings")}
          >
            <Settings className="h-6 w-6 mb-2" />
            Setting
          </Button>

          <Button
            variant="outline"
            className="h-20 flex-col"
            onClick={() => setCurrentView("track")}
          >
            <MapPin className="h-6 w-6 mb-2" />
            Lacak Pesanan
          </Button>

          <Button
            variant="outline"
            className="h-20 flex-col"
            onClick={() => setCurrentView("help")}
          >
            <HelpCircle className="h-6 w-6 mb-2" />
            Bantuan
          </Button>

          <Button
            variant="outline"
            className="h-20 flex-col"
            onClick={() => setCurrentView("topup")}
          >
            <CreditCard className="h-6 w-6 mb-2" />
            Top-Up
          </Button>
        </div>
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
          {currentView === "topup" && "Top-Up Saldo"}
          {currentView === "track" && "Lacak Pesanan"}
          {currentView === "services" && "Pilih Layanan"}
          {currentView === "chat" && "Live Chat"}
          {currentView === "help" && "Bantuan"}
          {currentView === "settings" && "Pengaturan"}
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

      {currentView === "topup" && (
        <Card>
          <CardHeader>
            <CardTitle>Top-Up Saldo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Saldo saat ini: Rp{userProfile.saldo.toLocaleString()}
              </p>
            </div>
            
            <div>
              <Label>Nominal Top-Up</Label>
              <Input
                type="number"
                value={topupAmount}
                onChange={(e) => setTopupAmount(e.target.value)}
                placeholder="Masukkan nominal"
              />
            </div>

            <Button onClick={handleTopup} className="w-full" variant="hero">
              Kirim Permintaan Top-Up
            </Button>

            <div className="text-xs text-muted-foreground">
              <p>* Top-up akan diproses oleh admin</p>
              <p>* Proses verifikasi 1-24 jam</p>
            </div>
          </CardContent>
        </Card>
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

      {(currentView === "services" || currentView === "chat" || currentView === "help" || currentView === "settings") && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Fitur {currentView} sedang dalam pengembangan</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserDashboard;