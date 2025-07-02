import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { LogOut, Plus, History, MessageCircle, ShoppingCart, Settings, MapPin, HelpCircle, CreditCard, Upload, Sparkles, Scissors, Heart } from "lucide-react";
import { storage, Profile, Order, ChatMessage } from "@/lib/storage";
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
  const [currentBanner, setCurrentBanner] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const { toast } = useToast();

  const banners = [
    {
      id: 1,
      title: "GetClean - Kebersihan Rumah Terpercaya",
      subtitle: "Layanan pembersihan rumah profesional dengan hasil maksimal",
      image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&h=300&fit=crop"
    },
    {
      id: 2,
      title: "GetMassage - Pijat Relaksasi Terbaik",
      subtitle: "Nikmati pijat tradisional dan modern untuk relaksasi tubuh",
      image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&h=300&fit=crop"
    },
    {
      id: 3,
      title: "GetBarber - Potong Rambut Profesional",
      subtitle: "Gaya rambut terkini dengan layanan barber berpengalaman",
      image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&h=300&fit=crop"
    },
    {
      id: 4,
      title: "GetLife - Solusi Hidup Praktis",
      subtitle: "Semua kebutuhan jasa rumah tangga dalam satu aplikasi",
      image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=300&fit=crop"
    },
    {
      id: 5,
      title: "Mitra Terpercaya & Bersertifikat",
      subtitle: "Semua mitra telah melalui proses verifikasi dan pelatihan",
      image: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=300&fit=crop"
    },
    {
      id: 6,
      title: "Harga Transparan & Terjangkau",
      subtitle: "Tidak ada biaya tersembunyi, bayar sesuai layanan",
      image: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=300&fit=crop"
    },
    {
      id: 7,
      title: "Tersedia 24/7 untuk Anda",
      subtitle: "Layanan kapan saja sesuai kebutuhan dan jadwal Anda",
      image: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&h=300&fit=crop"
    }
  ];

  useEffect(() => {
    loadData();
    
    // Auto slide banner every 4 seconds
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 4000);

    return () => clearInterval(interval);
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
      
      // Load chat messages
      const messages = storage.getChatMessages();
      const userMessages = messages.filter(m => 
        m.senderId === currentUser.email || m.receiverId === currentUser.email
      );
      setChatMessages(userMessages);
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

  const handleSendMessage = () => {
    if (!newMessage.trim() || !userProfile) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      senderId: userProfile.email,
      receiverId: 'id.getlife@gmail.com', // Admin email
      senderName: userProfile.name,
      message: newMessage.trim(),
      timestamp: new Date().toISOString()
    };

    const allMessages = storage.getChatMessages();
    storage.setChatMessages([...allMessages, message]);
    setChatMessages([...chatMessages, message]);
    setNewMessage("");

    toast({
      title: "Pesan terkirim",
      description: "Pesan Anda telah dikirim ke admin"
    });
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
          <Card className="bg-gradient-to-r from-blue-500 to-emerald-500 border-0 shadow-xl backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-xs text-black" style={{ fontFamily: 'Arial', fontSize: '10pt' }}>
                    Halo, {userProfile.name}!
                  </p>
                  <p className="text-xs text-black" style={{ fontFamily: 'Arial', fontSize: '10pt' }}>
                    Saldo Anda :
                  </p>
                  <p className="text-lg font-black text-black" style={{ fontFamily: 'Arial Black', fontSize: '10pt' }}>
                    Rp.{userProfile.saldo.toLocaleString()},-
                  </p>
                </div>
                <Button 
                  onClick={() => setShowTopupModal(true)}
                  className="bg-white text-black hover:bg-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-3 font-black"
                  style={{ fontFamily: 'Arial Black', fontSize: '12pt' }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  TOP-UP SALDO
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Banner Carousel */}
        <div className="px-6 mb-6">
          <div className="relative overflow-hidden rounded-xl shadow-lg">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentBanner * 100}%)` }}
            >
              {banners.map((banner, index) => (
                <div key={banner.id} className="w-full flex-shrink-0 relative">
                  <div 
                    className="h-48 bg-cover bg-center relative"
                    style={{ backgroundImage: `url(${banner.image})` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30"></div>
                    <div className="absolute inset-0 flex flex-col justify-center px-6">
                      <h3 className="text-white text-xl font-black mb-2" style={{ fontFamily: 'Arial Black' }}>
                        {banner.title}
                      </h3>
                      <p className="text-white/90 text-sm font-medium">
                        {banner.subtitle}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Banner indicators */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {banners.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentBanner ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Service Menu Grid */}
        <div className="px-6 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-24 flex-col bg-white/70 backdrop-blur-sm hover:bg-blue-50 hover:border-blue-200 transition-all duration-300 shadow-lg hover:shadow-xl"
              onClick={() => setCurrentView("order")}
            >
              <Sparkles className="h-8 w-8 mb-2 text-blue-600" />
              <span className="font-black text-black text-center text-xs" style={{ fontFamily: 'Arial Black' }}>
                GetClean
              </span>
            </Button>

            <Button
              variant="outline"
              className="h-24 flex-col bg-white/70 backdrop-blur-sm hover:bg-emerald-50 hover:border-emerald-200 transition-all duration-300 shadow-lg hover:shadow-xl"
              onClick={() => setCurrentView("order")}
            >
              <Heart className="h-8 w-8 mb-2 text-emerald-600" />
              <span className="font-black text-black text-center text-xs" style={{ fontFamily: 'Arial Black' }}>
                GetMassage
              </span>
            </Button>

            <Button
              variant="outline"
              className="h-24 flex-col bg-white/70 backdrop-blur-sm hover:bg-purple-50 hover:border-purple-200 transition-all duration-300 shadow-lg hover:shadow-xl"
              onClick={() => setCurrentView("order")}
            >
              <Scissors className="h-8 w-8 mb-2 text-purple-600" />
              <span className="font-black text-black text-center text-xs" style={{ fontFamily: 'Arial Black' }}>
                GetBarber
              </span>
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-24 flex-col bg-white/70 backdrop-blur-sm hover:bg-orange-50 hover:border-orange-200 transition-all duration-300 shadow-lg hover:shadow-xl"
              onClick={() => setCurrentView("chat")}
            >
              <MessageCircle className="h-8 w-8 mb-2 text-orange-600" />
              <span className="font-black text-black text-center text-xs" style={{ fontFamily: 'Arial Black' }}>
                Live Chat
              </span>
            </Button>

            <Button
              variant="outline"
              className="h-24 flex-col bg-white/70 backdrop-blur-sm hover:bg-red-50 hover:border-red-200 transition-all duration-300 shadow-lg hover:shadow-xl"
              onClick={() => setCurrentView("history")}
            >
              <History className="h-8 w-8 mb-2 text-red-600" />
              <span className="font-black text-black text-center text-xs" style={{ fontFamily: 'Arial Black' }}>
                Riwayat Pesanan
              </span>
            </Button>

            <Button
              variant="outline"
              className="h-24 flex-col bg-white/70 backdrop-blur-sm hover:bg-indigo-50 hover:border-indigo-200 transition-all duration-300 shadow-lg hover:shadow-xl"
              onClick={() => setCurrentView("track")}
            >
              <MapPin className="h-8 w-8 mb-2 text-indigo-600" />
              <span className="font-black text-black text-center text-xs" style={{ fontFamily: 'Arial Black' }}>
                Lacak Pesanan
              </span>
            </Button>
          </div>
        </div>

        {/* Q&A Section */}
        <div className="px-6 mt-8 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <CardTitle className="text-center text-xl font-black text-gray-800" style={{ fontFamily: 'Arial Black' }}>
                Mengapa Pilih GetLife?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-black text-blue-800 mb-2" style={{ fontFamily: 'Arial Black', fontSize: '12pt' }}>
                    🏆 Mitra Terpercaya & Bersertifikat
                  </h4>
                  <p className="text-sm text-gray-700">
                    Semua mitra telah melalui proses verifikasi ketat dan pelatihan profesional
                  </p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-lg">
                  <h4 className="font-black text-emerald-800 mb-2" style={{ fontFamily: 'Arial Black', fontSize: '12pt' }}>
                    💰 Harga Transparan & Terjangkau
                  </h4>
                  <p className="text-sm text-gray-700">
                    Tidak ada biaya tersembunyi, bayar sesuai layanan yang Anda gunakan
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-black text-purple-800 mb-2" style={{ fontFamily: 'Arial Black', fontSize: '12pt' }}>
                    ⏰ Tersedia 24/7
                  </h4>
                  <p className="text-sm text-gray-700">
                    Layanan kapan saja sesuai kebutuhan dan jadwal Anda
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-6 mt-8">
          <div className="text-center space-y-3">
            <h3 className="text-xl font-black" style={{ fontFamily: 'Arial Black' }}>
              GetLife Indonesia
            </h3>
            <div className="space-y-2 text-sm">
              <p>📧 id.getlifee@gmail.com</p>
              <p>📲 081299660660</p>
              <p>🏢 Kabupaten Bandung - Jawa Barat</p>
              <p>👨‍💼 Admin - Arvin Erlangga</p>
            </div>
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
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Live Chat dengan Admin</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-96 overflow-y-auto border rounded-lg p-4 space-y-3">
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === userProfile.email ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        message.senderId === userProfile.email
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-black'
                      }`}
                    >
                      <p className="text-sm">{message.message}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                {chatMessages.length === 0 && (
                  <p className="text-center text-muted-foreground">Belum ada pesan</p>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Ketik pesan..."
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                  Kirim
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
