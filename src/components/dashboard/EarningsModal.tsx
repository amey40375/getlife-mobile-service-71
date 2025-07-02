
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Calendar, DollarSign } from "lucide-react";

interface EarningsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  userRole: 'admin' | 'mitra' | 'user';
}

const EarningsModal = ({ isOpen, onClose, userEmail, userRole }: EarningsModalProps) => {
  const [filterPeriod, setFilterPeriod] = useState("hari");

  // Mock data - in real app, this would come from your storage/API
  const earningsData = [
    {
      id: 1,
      date: "2024-01-15",
      source: userRole === 'user' ? "Top-up Saldo" : userRole === 'mitra' ? "Layanan GetClean" : "Komisi Platform",
      amount: userRole === 'user' ? -50000 : 75000,
      type: userRole === 'user' ? "expense" : "income"
    },
    {
      id: 2,
      date: "2024-01-14",
      source: userRole === 'user' ? "Pembayaran GetMassage" : userRole === 'mitra' ? "Layanan GetMassage" : "Komisi Mitra",
      amount: userRole === 'user' ? -100000 : 125000,
      type: userRole === 'user' ? "expense" : "income"
    },
    {
      id: 3,
      date: "2024-01-13",
      source: userRole === 'user' ? "Top-up Saldo" : userRole === 'mitra' ? "Layanan GetBarber" : "Fee Transaksi",
      amount: userRole === 'user' ? -25000 : 50000,
      type: userRole === 'user' ? "expense" : "income"
    }
  ];

  const totalEarnings = earningsData.reduce((sum, item) => sum + item.amount, 0);

  const getTitle = () => {
    switch (userRole) {
      case 'user':
        return 'Riwayat Pengeluaran';
      case 'mitra':
        return 'Pendapatan Mitra';
      case 'admin':
        return 'Pendapatan Platform';
      default:
        return 'Pendapatan';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">{getTitle()}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Summary Card */}
          <Card className="bg-gradient-to-r from-green-500 to-blue-500 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">
                    {userRole === 'user' ? 'Total Pengeluaran' : 'Total Pendapatan'}
                  </p>
                  <p className="text-3xl font-bold">
                    Rp{Math.abs(totalEarnings).toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  {userRole === 'user' ? <TrendingUp className="h-6 w-6" /> : <DollarSign className="h-6 w-6" />}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filter */}
          <div className="flex items-center gap-4">
            <Calendar className="h-5 w-5 text-gray-600" />
            <Select value={filterPeriod} onValueChange={setFilterPeriod}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hari">Hari Ini</SelectItem>
                <SelectItem value="minggu">Minggu Ini</SelectItem>
                <SelectItem value="bulan">Bulan Ini</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Earnings Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Sumber</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {earningsData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{new Date(item.date).toLocaleDateString('id-ID')}</TableCell>
                    <TableCell>{item.source}</TableCell>
                    <TableCell className={`text-right font-semibold ${
                      item.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {item.type === 'income' ? '+' : '-'}Rp{Math.abs(item.amount).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        item.type === 'income' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {item.type === 'income' ? 'Masuk' : 'Keluar'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Close Button */}
          <div className="flex justify-end">
            <Button onClick={onClose} variant="outline">
              Tutup
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EarningsModal;
