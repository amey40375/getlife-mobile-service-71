
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { storage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";

interface RegisterMitraProps {
  onBack: () => void;
  onSuccess: () => void;
}

const RegisterMitra = ({ onBack, onSuccess }: RegisterMitraProps) => {
  const [formData, setFormData] = useState({
    nama: "",
    phone: "",
    address: "",
    expertise: "",
    reason: "",
    ktpPhoto: ""
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const applications = await storage.getMitraApplications();
      const newApplication = {
        id: Date.now().toString(),
        nama: formData.nama,
        phone: formData.phone,
        address: formData.address,
        expertise: formData.expertise as 'GetClean' | 'GetMassage' | 'GetBarber',
        reason: formData.reason,
        ktpPhoto: formData.ktpPhoto,
        status: 'pending' as const,
        createdAt: new Date().toISOString()
      };

      await storage.setMitraApplications([...applications, newApplication]);
      
      toast({
        title: "Pendaftaran berhasil",
        description: "Aplikasi mitra telah dikirim. Menunggu verifikasi admin.",
      });
      onSuccess();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Terjadi kesalahan saat mendaftar",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold">Daftar Mitra</h1>
      </div>

      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Bergabung Sebagai Mitra
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nama">Nama Lengkap</Label>
              <Input
                id="nama"
                placeholder="Masukkan nama lengkap"
                value={formData.nama}
                onChange={(e) => setFormData(prev => ({ ...prev, nama: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Nomor HP</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Masukkan nomor HP"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Alamat</Label>
              <Textarea
                id="address"
                placeholder="Masukkan alamat lengkap"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Keahlian</Label>
              <Select value={formData.expertise} onValueChange={(value) => setFormData(prev => ({ ...prev, expertise: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih keahlian" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GetClean">GetClean - Kebersihan Rumah</SelectItem>
                  <SelectItem value="GetMassage">GetMassage - Pijat Urut</SelectItem>
                  <SelectItem value="GetBarber">GetBarber - Potong Rambut</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Alasan Bergabung</Label>
              <Textarea
                id="reason"
                placeholder="Ceritakan mengapa Anda ingin bergabung"
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ktpPhoto">Link Foto KTP (Opsional)</Label>
              <Input
                id="ktpPhoto"
                type="url"
                placeholder="https://..."
                value={formData.ktpPhoto}
                onChange={(e) => setFormData(prev => ({ ...prev, ktpPhoto: e.target.value }))}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              variant="hero"
              disabled={loading || !formData.expertise}
            >
              {loading ? "Memproses..." : "Kirim Aplikasi"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterMitra;
