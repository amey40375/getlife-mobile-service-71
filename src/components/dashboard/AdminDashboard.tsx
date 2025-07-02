import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogOut, Users, UserCheck, CreditCard, FileText, Shield } from "lucide-react";
import { storage, MitraApplication, Profile, Transaction } from "@/lib/storage";
import { auth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard = ({ onLogout }: AdminDashboardProps) => {
  const [applications, setApplications] = useState<MitraApplication[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedApp, setSelectedApp] = useState<MitraApplication | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [verificationData, setVerificationData] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [transferAmount, setTransferAmount] = useState("");
  const [currentView, setCurrentView] = useState("main");
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setApplications(storage.getMitraApplications());
    setProfiles(storage.getProfiles());
    setTransactions(storage.getTransactions());
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

    // Create user account
    const users = storage.getUsers();
    const newUser = {
      email: verificationData.email,
      password: verificationData.password,
      role: 'mitra' as const
    };
    storage.setUsers([...users, newUser]);

    // Create profile
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

    // Update application status
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
    const updatedTransactions = transactions.map(t =>
      t.id === transaction.id ? { ...t, status: 'approved' as const } : t
    );
    storage.setTransactions(updatedTransactions);

    // Add saldo to user
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

  const pendingApplications = applications.filter(app => app.status === 'pending');
  const pendingTopups = transactions.filter(t => t.status === 'pending' && t.type === 'topup');

  if (currentView === "main") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <Button variant="outline" onClick={onLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
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
        <div className="grid grid-cols-2 gap-4">
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
            Konfirmasi Top-Up
            {pendingTopups.length > 0 && (
              <Badge variant="destructive" className="mt-1">
                {pendingTopups.length}
              </Badge>
            )}
          </Button>
        </div>

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
          {currentView === "topups" && "Konfirmasi Top-Up"}
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
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold">{user?.name || transaction.userId}</h3>
                      <p className="text-sm text-muted-foreground">
                        Top-up: Rp{transaction.amount.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(transaction.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <Button onClick={() => handleConfirmTopup(transaction)} variant="success">
                      Konfirmasi
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {pendingTopups.length === 0 && (
            <p className="text-center text-muted-foreground">Tidak ada top-up pending</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;