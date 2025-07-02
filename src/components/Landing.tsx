import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Shield, Clock } from "lucide-react";

interface LandingProps {
  onShowLogin: () => void;
  onShowRegisterUser: () => void;
  onShowRegisterMitra: () => void;
}

const Landing = ({ onShowLogin, onShowRegisterUser, onShowRegisterMitra }: LandingProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="p-4 text-center">
        <div className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          <h1 className="text-4xl font-bold mb-2">GetLife</h1>
          <p className="text-foreground/70">Hidup Lebih Mudah, Layanan Terpercaya</p>
        </div>
      </header>

      {/* Promo Banner */}
      <div className="mx-4 mb-6">
        <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-primary">🎉 Promo Spesial!</p>
              <p className="text-sm text-muted-foreground">Diskon 20% untuk pengguna baru</p>
            </div>
            <Sparkles className="h-8 w-8 text-secondary" />
          </div>
        </Card>
      </div>

      {/* Services Preview */}
      <div className="px-4 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-center">Layanan Kami</h2>
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4 text-center hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-2xl">🧹</span>
            </div>
            <p className="text-sm font-medium">GetClean</p>
            <p className="text-xs text-muted-foreground">Kebersihan Rumah</p>
          </Card>
          
          <Card className="p-4 text-center hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-2xl">💆</span>
            </div>
            <p className="text-sm font-medium">GetMassage</p>
            <p className="text-xs text-muted-foreground">Pijat Urut</p>
          </Card>
          
          <Card className="p-4 text-center hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-2xl">✂️</span>
            </div>
            <p className="text-sm font-medium">GetBarber</p>
            <p className="text-xs text-muted-foreground">Potong Rambut</p>
          </Card>
        </div>
      </div>

      {/* Features */}
      <div className="px-4 mb-8">
        <div className="grid grid-cols-1 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center">
              <Shield className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="font-medium">Terpercaya & Aman</p>
              <p className="text-sm text-muted-foreground">Mitra terverifikasi</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">Cepat & Profesional</p>
              <p className="text-sm text-muted-foreground">Layanan berkualitas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-4 space-y-3">
        <Button 
          variant="hero" 
          className="w-full h-12 text-lg"
          onClick={onShowLogin}
        >
          Masuk
        </Button>
        
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="elegant" 
            className="h-11"
            onClick={onShowRegisterUser}
          >
            Daftar User
          </Button>
          
          <Button 
            variant="outline" 
            className="h-11"
            onClick={onShowRegisterMitra}
          >
            Daftar Mitra
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-8 p-4 text-center text-sm text-muted-foreground">
        <p>© 2024 GetLife. Semua hak dilindungi.</p>
      </footer>
    </div>
  );
};

export default Landing;