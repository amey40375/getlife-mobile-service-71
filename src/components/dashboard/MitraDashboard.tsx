import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogOut, Clock, Play, Square, MessageCircle, History, CreditCard, Plus, Upload, Eye, EyeOff, TrendingUp } from "lucide-react";
import { storage, Profile, Order, ChatMessage } from "@/lib/storage";
import { auth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import EarningsModal from "./EarningsModal";
import NotificationDropdown from "./NotificationDropdown";
import ScrollingText from "./ScrollingText";
import MitraStatistics from "./MitraStatistics";
import "../dashboard/scrolling-text.css";

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
  const [currentBanner, setCurrentBanner] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showBalance, setShowBalance] = useState(true);
  const [showEarningsModal, setShowEarningsModal] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const HOURLY_RATE = 125000; // Rp 125,000 per hour
  const RATE_PER_SECOND = HOURLY_RATE / 3600; // Rp 34.72 per second
  const ADMIN_CUT = 0.25; // 25%

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

    return () => {
      clearInterval(interval);
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

  const loadData = async () => {
    try {
      const currentUser = await auth.getCurrentUser();
      if (currentUser) {
        setMitraProfile(currentUser);
        
        const allOrders = await storage.getOrders();
        const mitraOrders = allOrders.filter(order => order.mitraId === currentUser.email);
        setOrders(mitraOrders);
        
        // Load chat messages
        const messages = await storage.getChatMessages();
        const mitraMessages = messages.filter(m => 
          m.senderId === currentUser.email || m.receiverId === currentUser.email
        );
        setChatMessages(mitraMessages);
        
        // Check if blocked
        const blocked = await storage.getBlockedAccounts();
        if (blocked.includes(currentUser.email)) {
          setIsBlocked(true);
          // Calculate debt (this would be calculated based on actual business logic)
          setDebt(50000); // Example debt
        }
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

  const handleSendTopupRequest = async () => {
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

    try {
      const transactions = await storage.getTransactions();
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

  const handleAcceptOrder = async (order: Order) => {
    if (!mitraProfile) return;

    if (mitraProfile.saldo < 10000) {
      toast({
        variant: "destructive",
        title: "Saldo tidak cukup",
        description: "Minimal saldo Rp10.000 untuk menerima pesanan"
      });
      return;
    }

    try {
      const updatedOrders = orders.map(o =>
        o.id === order.id ? { ...o, status: 'dikerjakan' as const } : o
      );
      
      const allOrders = await storage.getOrders();
      const newAllOrders = allOrders.map(o =>
        o.id === order.id ? { ...o, status: 'dikerjakan' as const } : o
      );
      
      await storage.setOrders(newAllOrders);
      setOrders(updatedOrders);

      toast({
        title: "Pesanan diterima",
        description: "Pesanan berhasil diterima"
      });
    } catch (error) {
      console.error('Error accepting order:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal menerima pesanan"
      });
    }
  };

  const handleStartWork = async (order: Order) => {
    try {
      setActiveOrder(order);
      setIsWorking(true);
      setWorkTimer(0);

      const updatedOrders = orders.map(o =>
        o.id === order.id ? { ...o, startTime: new Date().toISOString() } : o
      );
      
      const allOrders = await storage.getOrders();
      const newAllOrders = allOrders.map(o =>
        o.id === order.id ? { ...o, startTime: new Date().toISOString() } : o
      );
      
      await storage.setOrders(newAllOrders);
      setOrders(updatedOrders);

      toast({
        title: "Mulai bekerja",
        description: "Timer dimulai"
      });
    } catch (error) {
      console.error('Error starting work:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal memulai pekerjaan"
      });
    }
  };

  const handleFinishWork = async () => {
    if (!activeOrder || !mitraProfile) return;

    const totalCost = Math.round(workTimer * RATE_PER_SECOND);
    const adminCut = Math.round(totalCost * ADMIN_CUT);
    const newSaldo = mitraProfile.saldo - adminCut;

    if (newSaldo < 0) {
      try {
        // Block account
        const blocked = await storage.getBlockedAccounts();
        await storage.setBlockedAccounts([...blocked, mitraProfile.email]);
        setIsBlocked(true);
        setDebt(Math.abs(newSaldo));
        
        toast({
          variant: "destructive",
          title: "Akun terkunci",
          description: `Tagihan Rp${Math.abs(newSaldo).toLocaleString()} belum dibayar`
        });
      } catch (error) {
        console.error('Error blocking account:', error);
      }
      return;
    }

    try {
      // Update order
      const updatedOrders = orders.map(o =>
        o.id === activeOrder.id ? {
          ...o,
          status: 'selesai' as const,
          endTime: new Date().toISOString(),
          totalCost: totalCost
        } : o
      );
      
      const allOrders = await storage.getOrders();
      const newAllOrders = allOrders.map(o =>
        o.id === activeOrder.id ? {
          ...o,
          status: 'selesai' as const,
          endTime: new Date().toISOString(),
          totalCost: totalCost
        } : o
      );
      
      await storage.setOrders(newAllOrders);
      setOrders(updatedOrders);

      // Update mitra saldo
      const profiles = await storage.getProfiles();
      const updatedProfiles = profiles.map(p =>
        p.email === mitraProfile.email ? { ...p, saldo: newSaldo } : p
      );
      await storage.setProfiles(updatedProfiles);
      setMitraProfile({ ...mitraProfile, saldo: newSaldo });

      setIsWorking(false);
      setActiveOrder(null);
      setWorkTimer(0);

      toast({
        title: "Pekerjaan selesai",
        description: `Total biaya: Rp${totalCost.toLocaleString()}, Potongan: Rp${adminCut.toLocaleString()}`
      });
    } catch (error) {
      console.error('Error finishing work:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal menyelesaikan pekerjaan"
      });
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !mitraProfile) return;

    try {
      const messages = await storage.getChatMessages();
      const newChatMessage: ChatMessage = {
        id: Date.now().toString(),
        senderId: mitraProfile.email,
        receiverId: 'id.getlife@gmail.com', // Admin email
        senderName: mitraProfile.name,
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
              <NotificationDropdown userEmail={mitraProfile.email} userRole="mitra" />
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
                    Halo, {mitraProfile.name}!
                  </p>
                  <p className="text-xs text-white" style={{ fontFamily: 'Arial Black', fontSize: '10pt' }}>
                    Saldo Anda :
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-black text-white" style={{ fontFamily: 'Arial Black', fontSize: '10pt' }}>
                      {showBalance ? `Rp.${mitraProfile.saldo.toLocaleString()},-` : 'Rp. ••••••••'}
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

        {/* Statistics */}
        <div className="px-6">
          <MitraStatistics mitraEmail={mitraProfile.email} />
        </div>

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
                Live Chat Admin
              </span>
            </Button>

            <Button
              variant="outline"
              className="h-20 flex-col bg-white/70 backdrop-blur-sm hover:bg-green-50 hover:border-green-200 transition-all duration-300 shadow-lg hover:shadow-xl"
              onClick={() => setShowEarningsModal(true)}
            >
              <TrendingUp className="h-6 w-6 mb-2 text-green-600" />
              <span className="font-black text-black" style={{ fontFamily: 'Arial Black', fontSize: '12pt' }}>
                Lihat Pendapatan
              </span>
            </Button>
          </div>

          {/* Small Side Q&A */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card className="col-span-2 bg-white/80 backdrop-blur-sm shadow-lg">
              <CardContent className="p-4">
                <h3 className="font-bold text-gray-800 mb-2">Tips Sukses Mitra GetLife</h3>
                <div className="space-y-2 text-sm">
                  <p>• Selalu tiba tepat waktu</p>
                  <p>• Berikan pelayanan terbaik</p>
                  <p>• Jaga komunikasi dengan pelanggan</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-emerald-50 border-emerald-200 shadow-lg">
              <CardContent className="p-4 text-center">
                <div className="text-2xl mb-2">🏆</div>
                <p className="text-sm font-medium text-emerald-700">Mitra Terbaik</p>
              </CardContent>
            </Card>
          </div>

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

          {/* Info */}
          {pendingOrders.length === 0 && activeOrders.length === 0 && (
            <Card className="bg-white/70 backdrop-blur-sm shadow-lg">
              <CardContent className="p-8 text-center">
                <p className="text-slate-600 font-medium">✨ Belum ada pesanan masuk</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Earnings Modal */}
        <EarningsModal
          isOpen={showEarningsModal}
          onClose={() => setShowEarningsModal(false)}
          userEmail={mitraProfile.email}
          userRole="mitra"
        />

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
          {currentView === "orders" && "Pesanan Masuk"}
          {currentView === "active" && "Sedang Dikerjakan"}
          {currentView === "history" && "Riwayat Pesanan"}
          {currentView === "chat" && "Live Chat"}
        </h1>
      </div>

      {/* Orders view */}
      {currentView === "orders" && (
        <div className="space-y-4">
          {orders.filter(order => order.status === 'menunggu').map((order) => (
            <Card key={order.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{order.service}</h3>
                    <p className="text-sm text-muted-foreground">
                      Mulai: {order.createdAt ? new Date(order.createdAt).toLocaleString() : '-'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Selesai: {order.endTime ? new Date(order.endTime).toLocaleString() : '-'}
                    </p>
                    {order.totalCost && (
                      <p className="text-sm font-medium">Total: Rp{order.totalCost.toLocaleString()}</p>
                    )}
                  </div>
                  <Badge variant="outline">Menunggu</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
          {orders.filter(order => order.status === 'menunggu').length === 0 && (
            <p className="text-center text-muted-foreground">Belum ada pesanan masuk</p>
          )}
        </div>
      )}

      {/* Active view */}
      {currentView === "active" && (
        <div className="space-y-4">
          {orders.filter(order => order.status === 'dikerjakan').map((order) => (
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
                  <Badge variant="outline">Dikerjakan</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
          {orders.filter(order => order.status === 'dikerjakan').length === 0 && (
            <p className="text-center text-muted-foreground">Belum ada pesanan sedang dikerjakan</p>
          )}
        </div>
      )}

      {/* History view */}
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
                    className={`flex ${message.senderId === mitraProfile.email ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        message.senderId === mitraProfile.email
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

export default MitraDashboard;
