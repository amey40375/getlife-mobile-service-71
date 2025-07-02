import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { LogOut, Users, UserCheck, CreditCard, FileText, Shield, Eye, X, Check, MessageCircle, TrendingUp, Image, AlertTriangle, Type } from "lucide-react";
import { storage, MitraApplication, Profile, Transaction, ChatMessage } from "@/lib/storage";
import { auth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import EarningsModal from "./EarningsModal";
import NotificationDropdown from "./NotificationDropdown";

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard = ({ onLogout }: AdminDashboardProps) => {
  const [applications, setApplications] = useState<MitraApplication[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [topupHistory, setTopupHistory] = useState<Transaction[]>([]);
  const [selectedApp, setSelectedApp] = useState<MitraApplication | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [selectedHistory, setSelectedHistory] = useState<Transaction | null>(null);
  const [verificationData, setVerificationData] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [transferAmount, setTransferAmount] = useState("");
  const [currentView, setCurrentView] = useState("main");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [selectedChat, setSelectedChat] = useState<string>("");
  const [newMessage, setNewMessage] = useState("");
  const [showEarningsModal, setShowEarningsModal] = useState(false);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showScrollingTextModal, setShowScrollingTextModal] = useState(false);
  const [newBannerTitle, setNewBannerTitle] = useState("");
  const [newBannerSubtitle, setNewBannerSubtitle] = useState("");
  const [newBannerImage, setNewBannerImage] = useState("");
  const [warningMessage, setWarningMessage] = useState("");
  const [scrollingText, setScrollingText] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setApplications(storage.getMitraApplications());
    setProfiles(storage.getProfiles());
    const allTransactions = storage.getTransactions();
    setTransactions(allTransactions.filter(t => t.status === 'pending'));
    setTopupHistory(allTransactions.filter(t => t.status !== 'pending'));
    
    const messages = storage.getChatMessages();
    setChatMessages(messages);
  };

  const handleVerifyMitra = () => {
    if (!selectedApp || !verificationData.name || !verificationData.email || !verificationData.password) {
      toast({
        variant: "destructive",
        title: "Data tidak lengkap",
        description: "Harap lengkapi semua data verifikasi"
      });
      return;
    }

    const users = storage.getUsers();
    const newUser = {
      email: verificationData.email,
      password: verificationData.password,
      role: 'mitra' as const
    };
    storage.setUsers([...users, newUser]);

    const newProfile = {
      email: verificationData.email,
      name: verificationData.name,
      phone: selectedApp.phone,
      address: selectedApp.address,
      role: 'mitra' as const,
      status: 'verified' as const,
      saldo: 0,
      expertise: selectedApp.expertise
    };
    storage.setProfiles([...profiles, newProfile]);

    const updatedApps = applications.map(app =>
      app.id === selectedApp.id ? { ...app, status: 'approved' as const } : app
    );
    storage.setMitraApplications(updatedApps);

    toast({
      title: "Mitra berhasil dibuat",
      description: `Akun mitra ${verificationData.name} telah dibuat dan diverifikasi`
    });

    setSelectedApp(null);
    setVerificationData({ name: "", email: "", password: "" });
    loadData();
  };

  const handleTransferSaldo = () => {
    if (!selectedProfile || !transferAmount) {
      toast({
        variant: "destructive",
        title: "Data tidak lengkap",
        description: "Pilih profil dan masukkan nominal"
      });
      return;
    }

    const amount = parseFloat(transferAmount);
    if (amount <= 0) {
      toast({
        variant: "destructive",
        title: "Nominal tidak valid",
        description: "Masukkan nominal yang valid"
      });
      return;
    }

    const updatedProfiles = profiles.map(profile =>
      profile.email === selectedProfile.email
        ? { ...profile, saldo: profile.saldo + amount }
        : profile
    );
    storage.setProfiles(updatedProfiles);

    toast({
      title: "Transfer berhasil",
      description: `Saldo Rp${amount.toLocaleString()} telah ditransfer ke ${selectedProfile.name}`
    });

    setSelectedProfile(null);
    setTransferAmount("");
    loadData();
  };

  const handleConfirmTopup = (transaction: Transaction) => {
    const allTransactions = storage.getTransactions();
    const updatedTransactions = allTransactions.map(t =>
      t.id === transaction.id ? { ...t, status: 'approved' as const } : t
    );
    storage.setTransactions(updatedTransactions);

    const updatedProfiles = profiles.map(profile =>
      profile.email === transaction.userId
        ? { ...profile, saldo: profile.saldo + transaction.amount }
        : profile
    );
    storage.setProfiles(updatedProfiles);

    toast({
      title: "Top-up dikonfirmasi",
      description: `Top-up Rp${transaction.amount.toLocaleString()} berhasil dikonfirmasi`
    });

    loadData();
  };

  const handleRejectTopup = (transaction: Transaction) => {
    const allTransactions = storage.getTransactions();
    const updatedTransactions = allTransactions.map(t =>
      t.id === transaction.id ? { ...t, status: 'rejected' as const } : t
    );
    storage.setTransactions(updatedTransactions);

    toast({
      title: "Top-up ditolak",
      description: "Permintaan top-up telah ditolak"
    });

    loadData();
  };

  const handleAddBanner = () => {
    if (!newBannerTitle || !newBannerSubtitle) {
      toast({
        variant: "destructive",
        title: "Data tidak lengkap",
        description: "Harap lengkapi judul dan subtitle banner"
      });
      return;
    }

    // In real app, this would save to storage
    toast({
      title: "Banner berhasil ditambahkan",
      description: "Banner baru telah ditambahkan ke sistem"
    });

    setNewBannerTitle("");
    setNewBannerSubtitle("");
    setNewBannerImage("");
    setShowBannerModal(false);
  };

  const handleSendWarning = () => {
    if (!warningMessage.trim()) {
      toast({
        variant: "destructive",
        title: "Pesan kosong",
        description: "Masukkan pesan peringatan"
      });
      return;
    }

    // In real app, this would send notifications to all users
    toast({
      title: "Peringatan terkirim",
      description: "Peringatan telah dikirim ke semua pengguna"
    });

    setWarningMessage("");
    setShowWarningModal(false);
  };

  const handleUpdateScrollingText = () => {
    if (!scrollingText.trim()) {
      toast({
        variant: "destructive",
        title: "Teks kosong",
        description: "Masukkan teks berjalan"
      });
      return;
    }

    // In real app, this would save to storage
    toast({
      title: "Teks berjalan diperbarui",
      description: "Teks berjalan telah diperbarui"
    });

    setScrollingText("");
    setShowScrollingTextModal(false);
  };

  const pendingApplications = applications.filter(app => app.status === 'pending');
  const pendingTopups = transactions.filter(t => t.status === 'pending' && t.type === 'topup');

  const getUniqueChats = () => {
    const chats = new Set<string>();
    chatMessages.forEach(message => {
      if (message.senderId !== 'id.getlife@gmail.com') {
        chats.add(message.senderId);
      }
      if (message.receiverId !== 'id.getlife@gmail.com') {
        chats.add(message.receiverId);
      }
    });
    return Array.from(chats);
  };

  const getChatMessages = (userId: string) => {
    return chatMessages.filter(m => 
      (m.senderId === userId && m.receiverId === 'id.getlife@gmail.com') ||
      (m.senderId === 'id.getlife@gmail.com' && m.receiverId === userId)
    );
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedChat) return;

    const adminProfile = profiles.find(p => p.role === 'admin');
    if (!adminProfile) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      senderId: 'id.getlife@gmail.com',
      receiverId: selectedChat,
      senderName: 'Admin GetLife',
      message: newMessage.trim(),
      timestamp: new Date().toISOString()
    };

    const allMessages = storage.getChatMessages();
    storage.setChatMessages([...allMessages, message]);
    setChatMessages([...allMessages, message]);
    setNewMessage("");

    toast({
      title: "Pesan terkirim",
      description: "Pesan Anda telah dikirim"
    });
  };

  if (currentView === "main") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <div className="flex items-center gap-3">
            <NotificationDropdown userEmail="id.getlife@gmail.com" userRole="admin" />
            <Button variant="outline" onClick={onLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Aplikasi Pending</p>
                  <p className="text-2xl font-bold text-warning">{pendingApplications.length}</p>
                </div>
                <UserCheck className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Top-up Pending</p>
                  <p className="text-2xl font-bold text-primary">{pendingTopups.length}</p>
                </div>
                <CreditCard className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Button
            variant="outline"
            className="h-20 flex-col"
            onClick={() => setCurrentView("applications")}
          >
            <UserCheck className="h-6 w-6 mb-2" />
            Permintaan Mitra
            {pendingApplications.length > 0 && (
              <Badge variant="destructive" className="mt-1">
                {pendingApplications.length}
              </Badge>
            )}
          </Button>

          <Button
            variant="outline"
            className="h-20 flex-col"
            onClick={() => setCurrentView("profiles")}
          >
            <Users className="h-6 w-6 mb-2" />
            Data Mitra & User
          </Button>

          <Button
            variant="outline"
            className="h-20 flex-col"
            onClick={() => setCurrentView("transfer")}
          >
            <CreditCard className="h-6 w-6 mb-2" />
            Transfer Saldo
          </Button>

          <Button
            variant="outline"
            className="h-20 flex-col"
            onClick={() => setCurrentView("topups")}
          >
            <FileText className="h-6 w-6 mb-2" />
            Permintaan Top-Up
            {pendingTopups.length > 0 && (
              <Badge variant="destructive" className="mt-1">
                {pendingTopups.length}
              </Badge>
            )}
          </Button>

          <Button
            variant="outline"
            className="h-20 flex-col"
            onClick={() => setCurrentView("chat")}
          >
            <MessageCircle className="h-6 w-6 mb-2" />
            Live Chat
            {getUniqueChats().length > 0 && (
              <Badge variant="destructive" className="mt-1">
                {getUniqueChats().length}
              </Badge>
            )}
          </Button>

          <Button
            variant="outline"
            className="h-20 flex-col"
            onClick={() => setCurrentView("history")}
          >
            <FileText className="h-6 w-6 mb-2" />
            Riwayat Top-Up
          </Button>

          <Button
            variant="outline"
            className="h-20 flex-col"
            onClick={() => setShowEarningsModal(true)}
          >
            <TrendingUp className="h-6 w-6 mb-2" />
            Lihat Pendapatan
          </Button>

          <Button
            variant="outline"
            className="h-20 flex-col"
            onClick={() => setShowBannerModal(true)}
          >
            <Image className="h-6 w-6 mb-2" />
            Kelola Banner
          </Button>

          <Button
            variant="outline"
            className="h-20 flex-col"
            onClick={() => setShowWarningModal(true)}
          >
            <AlertTriangle className="h-6 w-6 mb-2" />
            Kirim Peringatan
          </Button>

          <Button
            variant="outline"
            className="h-20 flex-col"
            onClick={() => setShowScrollingTextModal(true)}
          >
            <Type className="h-6 w-6 mb-2" />
            Ubah Teks Berjalan
          </Button>
        </div>

        {/* Modals */}
        <EarningsModal
          isOpen={showEarningsModal}
          onClose={() => setShowEarningsModal(false)}
          userEmail="id.getlife@gmail.com"
          userRole="admin"
        />

        {/* Banner Modal */}
        <Dialog open={showBannerModal} onOpenChange={setShowBannerModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Banner Baru</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Judul Banner</Label>
                <Input
                  value={newBannerTitle}
                  onChange={(e) => setNewBannerTitle(e.target.value)}
                  placeholder="Masukkan judul banner"
                />
              </div>
              <div>
                <Label>Subtitle Banner</Label>
                <Input
                  value={newBannerSubtitle}
                  onChange={(e) => setNewBannerSubtitle(e.target.value)}
                  placeholder="Masukkan subtitle banner"
                />
              </div>
              <div>
                <Label>URL Gambar (Opsional)</Label>
                <Input
                  value={newBannerImage}
                  onChange={(e) => setNewBannerImage(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <Button onClick={handleAddBanner} className="w-full">
                Tambah Banner
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Warning Modal */}
        <Dialog open={showWarningModal} onOpenChange={setShowWarningModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Kirim Peringatan ke Semua Pengguna</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Pesan Peringatan</Label>
                <Textarea
                  value={warningMessage}
                  onChange={(e) => setWarningMessage(e.target.value)}
                  placeholder="Masukkan pesan peringatan..."
                  rows={4}
                />
              </div>
              <Button onClick={handleSendWarning} className="w-full">
                Kirim Peringatan
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Scrolling Text Modal */}
        <Dialog open={showScrollingTextModal} onOpenChange={setShowScrollingTextModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ubah Teks Berjalan</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Teks Berjalan</Label>
                <Textarea
                  value={scrollingText}
                  onChange={(e) => setScrollingText(e.target.value)}
                  placeholder="Masukkan teks berjalan yang akan ditampilkan..."
                  rows={3}
                />
              </div>
              <Button onClick={handleUpdateScrollingText} className="w-full">
                Perbarui Teks
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialogs */}
        <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Verifikasi Mitra</DialogTitle>
            </DialogHeader>
            {selectedApp && (
              <div className="space-y-4">
                <div>
                  <p><strong>Nama:</strong> {selectedApp.nama}</p>
                  <p><strong>HP:</strong> {selectedApp.phone}</p>
                  <p><strong>Keahlian:</strong> {selectedApp.expertise}</p>
                  <p><strong>Alasan:</strong> {selectedApp.reason}</p>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <Label>Nama untuk Akun</Label>
                    <Input
                      value={verificationData.name}
                      onChange={(e) => setVerificationData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nama lengkap"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={verificationData.email}
                      onChange={(e) => setVerificationData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Email untuk login"
                    />
                  </div>
                  <div>
                    <Label>Password</Label>
                    <Input
                      type="password"
                      value={verificationData.password}
                      onChange={(e) => setVerificationData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Password"
                    />
                  </div>
                </div>
                
                <Button onClick={handleVerifyMitra} className="w-full" variant="hero">
                  Verifikasi Mitra
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={!!selectedProfile} onOpenChange={() => setSelectedProfile(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Transfer Saldo</DialogTitle>
            </DialogHeader>
            {selectedProfile && (
              <div className="space-y-4">
                <div>
                  <p><strong>Nama:</strong> {selectedProfile.name}</p>
                  <p><strong>Email:</strong> {selectedProfile.email}</p>
                  <p><strong>Saldo Saat Ini:</strong> Rp{selectedProfile.saldo.toLocaleString()}</p>
                </div>
                
                <div>
                  <Label>Nominal Transfer</Label>
                  <Input
                    type="number"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    placeholder="Masukkan nominal"
                  />
                </div>
                
                <Button onClick={handleTransferSaldo} className="w-full" variant="hero">
                  Transfer Saldo
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={!!selectedHistory} onOpenChange={() => setSelectedHistory(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detail Riwayat Top-Up</DialogTitle>
            </DialogHeader>
            {selectedHistory && (
              <div className="space-y-4">
                <div>
                  <p><strong>Nama:</strong> {selectedHistory.userName}</p>
                  <p><strong>Email:</strong> {selectedHistory.userId}</p>
                  <p><strong>Nominal:</strong> Rp{selectedHistory.amount.toLocaleString()}</p>
                  <p><strong>Status:</strong> 
                    <Badge className="ml-2" variant={
                      selectedHistory.status === 'approved' ? 'default' : 
                      selectedHistory.status === 'rejected' ? 'destructive' : 'secondary'
                    }>
                      {selectedHistory.status === 'approved' ? 'Dikonfirmasi' :
                       selectedHistory.status === 'rejected' ? 'Ditolak' : 'Pending'}
                    </Badge>
                  </p>
                  <p><strong>Tanggal:</strong> {new Date(selectedHistory.createdAt).toLocaleString()}</p>
                  {selectedHistory.transferProof && (
                    <p><strong>Bukti Transfer:</strong> {selectedHistory.transferProof}</p>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Sub-views will be handled in the next components
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" onClick={() => setCurrentView("main")}>
          ← Kembali
        </Button>
        <h1 className="text-xl font-semibold">
          {currentView === "applications" && "Permintaan Mitra"}
          {currentView === "profiles" && "Data Mitra & User"}
          {currentView === "transfer" && "Transfer Saldo"}
          {currentView === "topups" && "Permintaan Top-Up"}
          {currentView === "history" && "Riwayat Top-Up"}
          {currentView === "chat" && "Live Chat"}
        </h1>
      </div>

      {currentView === "applications" && (
        <div className="space-y-4">
          {pendingApplications.map((app) => (
            <Card key={app.id} className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="p-4" onClick={() => setSelectedApp(app)}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{app.nama}</h3>
                    <p className="text-sm text-muted-foreground">{app.expertise}</p>
                    <p className="text-sm text-muted-foreground">{app.phone}</p>
                  </div>
                  <Badge variant="outline">Pending</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
          {pendingApplications.length === 0 && (
            <p className="text-center text-muted-foreground">Tidak ada aplikasi pending</p>
          )}
        </div>
      )}

      {currentView === "profiles" && (
        <div className="space-y-4">
          {profiles.filter(p => p.role !== 'admin').map((profile) => (
            <Card key={profile.email}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{profile.name}</h3>
                    <p className="text-sm text-muted-foreground">{profile.email}</p>
                    <p className="text-sm">Saldo: Rp{profile.saldo.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={profile.role === 'mitra' ? 'secondary' : 'outline'}>
                      {profile.role}
                    </Badge>
                    {profile.expertise && (
                      <p className="text-sm text-muted-foreground mt-1">{profile.expertise}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {currentView === "transfer" && (
        <div className="space-y-4">
          {profiles.filter(p => p.role !== 'admin').map((profile) => (
            <Card key={profile.email} className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="p-4" onClick={() => setSelectedProfile(profile)}>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">{profile.name}</h3>
                    <p className="text-sm text-muted-foreground">Saldo: Rp{profile.saldo.toLocaleString()}</p>
                  </div>
                  <Badge variant={profile.role === 'mitra' ? 'secondary' : 'outline'}>
                    {profile.role}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {currentView === "topups" && (
        <div className="space-y-4">
          {pendingTopups.map((transaction) => {
            const user = profiles.find(p => p.email === transaction.userId);
            return (
              <Card key={transaction.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold">{transaction.userName || user?.name || transaction.userId}</h3>
                      <p className="text-sm text-muted-foreground">
                        Top-up: Rp{transaction.amount.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(transaction.createdAt).toLocaleString()}
                      </p>
                      {transaction.transferProof && (
                        <p className="text-xs text-blue-600 mt-1">
                          📎 Bukti: {transaction.transferProof}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button 
                        size="sm"
                        onClick={() => handleConfirmTopup(transaction)} 
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Konfirmasi
                      </Button>
                      <Button 
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRejectTopup(transaction)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Tolak
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {pendingTopups.length === 0 && (
            <p className="text-center text-muted-foreground">Tidak ada permintaan top-up pending</p>
          )}
        </div>
      )}

      {currentView === "history" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Top-Up</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Nominal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topupHistory.map((transaction) => (
                    <TableRow key={transaction.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-medium">
                        {transaction.userName || transaction.userId}
                      </TableCell>
                      <TableCell>Rp{transaction.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={
                          transaction.status === 'approved' ? 'default' : 
                          transaction.status === 'rejected' ? 'destructive' : 'secondary'
                        }>
                          {transaction.status === 'approved' ? 'Dikonfirmasi' :
                           transaction.status === 'rejected' ? 'Ditolak' : 'Pending'}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(transaction.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setSelectedHistory(transaction)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Detail
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {topupHistory.length === 0 && (
                <p className="text-center text-muted-foreground py-8">Belum ada riwayat top-up</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {currentView === "chat" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Daftar Chat</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {getUniqueChats().map((userId) => {
                  const user = profiles.find(p => p.email === userId);
                  return (
                    <Button
                      key={userId}
                      variant={selectedChat === userId ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => setSelectedChat(userId)}
                    >
                      {user?.name || userId}
                    </Button>
                  );
                })}
                {getUniqueChats().length === 0 && (
                  <p className="text-center text-muted-foreground">Belum ada chat</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>
                {selectedChat ? 
                  `Chat dengan ${profiles.find(p => p.email === selectedChat)?.name || selectedChat}` : 
                  'Pilih Chat'
                }
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedChat ? (
                <>
                  <div className="h-96 overflow-y-auto border rounded-lg p-4 space-y-3">
                    {getChatMessages(selectedChat).map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.senderId === 'id.getlife@gmail.com' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs px-4 py-2 rounded-lg ${
                            message.senderId === 'id.getlife@gmail.com'
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
                </>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Pilih chat untuk memulai percakapan
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
