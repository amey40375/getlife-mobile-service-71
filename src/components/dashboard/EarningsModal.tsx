
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp } from "lucide-react";

interface EarningsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  userRole: 'admin' | 'mitra';
}

const EarningsModal = ({ isOpen, onClose, userEmail, userRole }: EarningsModalProps) => {
  const [filterPeriod, setFilterPeriod] = useState<'day' | 'week' | 'month'>('day');

  // Mock earnings data - in real app, this would come from storage
  const mockEarnings = [
    { id: 1, date: '2025-01-07', service: 'GetClean', amount: 87500, source: 'Pesanan Selesai', status: 'completed' },
    { id: 2, date: '2025-01-06', service: 'GetMassage', amount: 125000, source: 'Pesanan Selesai', status: 'completed' },
    { id: 3, date: '2025-01-05', service: 'GetBarber', amount: 75000, source: 'Pesanan Selesai', status: 'completed' },
    { id: 4, date: '2025-01-04', service: 'GetClean', amount: 100000, source: 'Pesanan Selesai', status: 'completed' },
    { id: 5, date: '2025-01-03', service: 'Admin Fee', amount: 50000, source: 'Biaya Admin', status: 'deducted' },
  ];

  const totalEarnings = mockEarnings
    .filter(e => e.status === 'completed')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalDeductions = mockEarnings
    .filter(e => e.status === 'deducted')
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {userRole === 'admin' ? 'Pendapatan Sistem' : 'Pendapatan Mitra'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Filter Buttons */}
          <div className="flex gap-2">
            <Button
              variant={filterPeriod === 'day' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterPeriod('day')}
            >
              Harian
            </Button>
            <Button
              variant={filterPeriod === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterPeriod('week')}
            >
              Mingguan
            </Button>
            <Button
              variant={filterPeriod === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterPeriod('month')}
            >
              Bulanan
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600">Total Pendapatan</p>
              <p className="text-2xl font-bold text-green-700">Rp{totalEarnings.toLocaleString()}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-red-600">Total Potongan</p>
              <p className="text-2xl font-bold text-red-700">Rp{totalDeductions.toLocaleString()}</p>
            </div>
          </div>

          {/* Earnings Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Layanan</TableHead>
                  <TableHead>Sumber</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockEarnings.map((earning) => (
                  <TableRow key={earning.id}>
                    <TableCell>{new Date(earning.date).toLocaleDateString()}</TableCell>
                    <TableCell>{earning.service}</TableCell>
                    <TableCell>{earning.source}</TableCell>
                    <TableCell className={earning.status === 'completed' ? 'text-green-600' : 'text-red-600'}>
                      {earning.status === 'completed' ? '+' : '-'}Rp{earning.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={earning.status === 'completed' ? 'default' : 'destructive'}>
                        {earning.status === 'completed' ? 'Pendapatan' : 'Potongan'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EarningsModal;
