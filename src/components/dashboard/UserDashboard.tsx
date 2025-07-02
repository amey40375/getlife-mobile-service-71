import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LogOut, Clock, MessageCircle, History, CreditCard, Plus, Upload, Eye, EyeOff, TrendingUp, Star, MapPin, Home, Sparkles, Scissors, Phone } from "lucide-react";
import { storage, Profile, Order, ChatMessage } from "@/lib/storage";
import { auth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import EarningsModal from "./EarningsModal";
import NotificationDropdown from "./NotificationDropdown";
import ScrollingText from "./ScrollingText";

interface UserDashboardProps {
  onLogout: () => void;
}

const UserDashboard = ({ onLogout }: UserDashboardProps) => {
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentView, setCurrentView] = useState("main");
  const [topupAmount, setTopupAmount] = useState("");
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [transferProof, setTransferProof] = useState<File | null>(null);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showBalance, setShowBalance] = useState(true);
  const [showEarningsModal, setShowEarningsModal] = useState(false);
  const [selectedService, setSelectedService] = useState("");
  const [serviceAddress, setServiceAddress] = useState("");
  const [serviceNotes, setServiceNotes] = useState("");
  const { toast } = useToast();

  const services = [
    { id: 'GetClean', name: 'GetClean - Cleaning Service', icon: Home, color: 'text-blue-600' },
    { id: 'GetMassage', name: 'GetMassage - Massage Service', icon: Sparkles, color: 'text-purple-600' },
    { id: 'GetBarber', name: 'GetBarber - Barber Service', icon: Scissors, color: 'text-green-600' },
  ];

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

  const loadData = async () => {
    try {
      const currentUser = await auth.getCurrentUser();
      if (currentUser) {
        const profileUser: Profile = {
          ...currentUser,
          role: currentUser.role as "user" | "mitra" | "admin"
        };
        setUserProfile(profileUser);
        
        const allOrders = await storage.getOrders();
        const userOrders = allOrders.filter(order => order.userId === currentUser.email);
        setOrders(userOrders);
        
        // Load chat messages
        const messages = await storage.getChatMessages();
        const userMessages = messages.filter(m => 
          m.senderId === currentUser.email || m.receiverId === currentUser.email
        );
        setChatMessages(userMessages);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal memuat data"
      });
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

  const handleSendTopupRequest = async () => {
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

    try {
      const transactions = await storage.getTransactions();
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

      await storage.setTransactions([...transactions, newTransaction]);

      toast({
        title: "Permintaan top-up dikirim",
        description: "Menunggu konfirmasi admin"
      });

      setTopupAmount("");
      setTransferProof(null);
      setShowPaymentModal(false);
      setCurrentView("main");
    } catch (error) {
      console.error('Error sending topup request:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal mengirim permintaan top-up"
      });
    }
  };

  const handleOrderService = async () => {
    if (!selectedService || !serviceAddress || !userProfile) {
      toast({
        variant: "destructive",
        title: "Data tidak lengkap",
        description: "Pilih layanan dan isi alamat"
      });
      return;
    }

    try {
      const allOrders = await storage.getOrders();
      const newOrder: Order = {
        id: Date.now().toString(),
        userId: userProfile.email,
        mitraId: null, // Initially null until assigned to a mitra
        service: selectedService,
        status: 'menunggu' as const,
        createdAt: new Date().toISOString()
      };

      await storage.setOrders([...allOrders, newOrder]);
      
      const userOrders = [...allOrders, newOrder].filter(order => order.userId === userProfile.email);
      setOrders(userOrders);

      toast({
        title: "Pesanan berhasil dibuat",
        description: `Pesanan ${selectedService} telah dibuat`
      });

      setSelectedService("");
      setServiceAddress("");
      setServiceNotes("");
      setShowOrderModal(false);
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal membuat pesanan"
      });
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !userProfile) return;

    try {
      const messages = await storage.getChatMessages();
      const newChatMessage: ChatMessage = {
        id: Date.now().toString(),
        senderId: userProfile.email,
        receiverId: 'id.getlife@gmail.com', // Admin email
        senderName: userProfile.name,
        message: newMessage.trim(),
        timestamp: new Date().toISOString()
      };

      await storage.setChatMessages([...messages, newChatMessage]);
      setChatMessages([...chatMessages, newChatMessage]);
      setNewMessage("");

      toast({
        title: "Pesan terkirim",
        description: "Pesan berhasil dikirim ke admin"
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal mengirim pesan"
      });
    }
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
            <div className="flex items-center gap-3">
              <NotificationDropdown userEmail={userProfile.email} userRole="user" />
              <Button variant="outline" onClick={onLogout} className="hover:bg-red-50 hover:text-red-600 hover:border-red-200">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Welcome & Balance Card */}
        <div className="p-6">
          <Card className="bg-gradient-to-r from-blue-500 to-emerald-500 border-0 shadow-xl backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-xs text-white" style={{ fontFamily: 'Arial Black', fontSize: '10pt' }}>
                    Halo, {userProfile.name}!
                  </p>
                  <p className="text-xs text-white" style={{ fontFamily: 'Arial Black', fontSize: '10pt' }}>
                    Saldo Anda :
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-black text-white" style={{ fontFamily: 'Arial Black', fontSize: '10pt' }}>
                      {showBalance ? `Rp.${userProfile.saldo.toLocaleString()},-` : 'Rp. ••••••••'}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowBalance(!showBalance)}
                      className="h-6 w-6 p-0 hover:bg-white/20"
                    >
                      {showBalance ? <Eye className="h-4 w-4 text-white" /> : <EyeOff className="h-4 w-4 text-white" />}
                    </Button>
                  </div>
                </div>
                <Button 
                  onClick={() => setShowTopupModal(true)}
                  className="bg-white text-black hover:bg-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 px-3 py-2 font-black"
                  style={{ fontFamily: 'Arial Black', fontSize: '10pt' }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  TOP-UP
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scrolling Text */}
        <ScrollingText />

        {/* Banner Carousel */}
        <div className="px-6 mb-6">
          <div className="relative overflow-hidden rounded-xl shadow-lg">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentBanner * 100}%)` }}
            >
              {banners.map((banner) => (
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

        {/* Services Grid */}
        <div className="px-6 mb-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">🏠 Layanan Kami</h2>
          <div className="grid grid-cols-1 gap-3">
            {services.map((service) => {
              const IconComponent = service.icon;
              return (
                <Card 
                  key={service.id} 
                  className="bg-white/70 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
                  onClick={() => {
                    setSelectedService(service.id);
                    setShowOrderModal(true);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      <IconComponent className={`h-12 w-12 ${service.color}`} />
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-800">{service.name}</h3>
                        <p className="text-sm text-slate-600">Klik untuk memesan layanan</p>
                      </div>
                      <Button className="bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white">
                        Pesan
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Button
              variant="outline"
              className="h-20 flex-col bg-white/70 backdrop-blur-sm hover:bg-blue-50 hover:border-blue-200 transition-all duration-300 shadow-lg hover:shadow-xl"
              onClick={() => setCurrentView("history")}
            >
              <History className="h-6 w-6 mb-2 text-blue-600" />
              <span className="font-black text-black" style={{ fontFamily: 'Arial Black', fontSize: '12pt' }}>
                Riwayat Pesanan
              </span>
            </Button>

            <Button
              variant="outline"
              className="h-20 flex-col bg-white/70 backdrop-blur-sm hover:bg-purple-50 hover:border-purple-200 transition-all duration-300 shadow-lg hover:shadow-xl"
              onClick={() => setCurrentView("chat")}
            >
              <MessageCircle className="h-6 w-6 mb-2 text-purple-600" />
              <span className="font-black text-black" style={{ fontFamily: 'Arial Black', fontSize: '12pt' }}>
                Live Chat
              </span>
            </Button>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="px-6 space-y-6">
          {orders.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-slate-800 mb-4">📋 Pesanan Terbaru</h2>
              <div className="space-y-3">
                {orders.slice(0, 3).map((order) => (
                  <Card key={order.id} className="bg-white/70 backdrop-blur-sm shadow-lg">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-bold text-slate-800">{order.service}</h3>
                          <p className="text-sm text-slate-600">
                            {new Date(order.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant={
                          order.status === 'selesai' ? 'default' :
                          order.status === 'dikerjakan' ? 'secondary' : 'outline'
                        }>
                          {order.status === 'selesai' ? 'Selesai' :
                           order.status === 'dikerjakan' ? 'Dikerjakan' : 'Menunggu'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-6 mt-8 rounded-xl">
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
        </div>

        {/* Order Modal */}
        <Dialog open={showOrderModal} onOpenChange={setShowOrderModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center text-xl font-bold text-slate-800">
                Pesan {selectedService}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 p-2">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Alamat Layanan *</Label>
                <Textarea
                  value={serviceAddress}
                  onChange={(e) => setServiceAddress(e.target.value)}
                  placeholder="Masukkan alamat lengkap..."
                  className="border-2 focus:border-blue-500"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Catatan (Opsional)</Label>
                <Textarea
                  value={serviceNotes}
                  onChange={(e) => setServiceNotes(e.target.value)}
                  placeholder="Catatan khusus untuk mitra..."
                  className="border-2 focus:border-blue-500"
                  rows={2}
                />
              </div>

              <Button 
                onClick={handleOrderService} 
                className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-medium py-3"
                disabled={!selectedService || !serviceAddress}
              >
                PESAN SEKARANG
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Top-up Modal */}
        <Dialog open={showTopupModal} onOpenChange={setShowTopupModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center text-xl font-bold text-slate-800">Top-Up Saldo</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 p-2">
              <div className="text-center">
                <p className="text-sm text-slate-600 mb-4">
                  Saldo saat ini: <span className="font-bold text-emerald-600">Rp.{userProfile.saldo.toLocaleString()},-</span>
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
          {currentView === "chat" && "Live Chat"}
        </h1>
      </div>

      {currentView === "history" && (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{order.service}</h3>
                    <p className="text-sm text-muted-foreground">
                      Dibuat: {new Date(order.createdAt).toLocaleString()}
                    </p>
                    {order.startTime && (
                      <p className="text-sm text-muted-foreground">
                        Mulai: {new Date(order.startTime).toLocaleString()}
                      </p>
                    )}
                    {order.endTime && (
                      <p className="text-sm text-muted-foreground">
                        Selesai: {new Date(order.endTime).toLocaleString()}
                      </p>
                    )}
                    {order.totalCost && (
                      <p className="text-sm font-medium">Total: Rp{order.totalCost.toLocaleString()}</p>
                    )}
                  </div>
                  <Badge variant={
                    order.status === 'selesai' ? 'default' :
                    order.status === 'dikerjakan' ? 'secondary' : 'outline'
                  }>
                    {order.status === 'selesai' ? 'Selesai' :
                     order.status === 'dikerjakan' ? 'Dikerjakan' : 'Menunggu'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
          {orders.length === 0 && (
            <p className="text-center text-muted-foreground">Belum ada riwayat pesanan</p>
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
