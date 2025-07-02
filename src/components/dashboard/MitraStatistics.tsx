
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Calendar, Star, Clock } from "lucide-react";

interface MitraStatisticsProps {
  mitraEmail: string;
}

const MitraStatistics = ({ mitraEmail }: MitraStatisticsProps) => {
  // Mock statistics data - in real app, this would come from storage
  const stats = {
    totalEarnings: 2500000,
    completedOrders: 45,
    averageRating: 4.8,
    workingHours: 120
  };

  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">Total Pendapatan</p>
              <p className="text-xl font-bold text-green-700">Rp{stats.totalEarnings.toLocaleString()}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">Pesanan Selesai</p>
              <p className="text-xl font-bold text-blue-700">{stats.completedOrders}</p>
            </div>
            <Calendar className="h-8 w-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600">Rating Rata-rata</p>
              <p className="text-xl font-bold text-yellow-700">{stats.averageRating}</p>
            </div>
            <Star className="h-8 w-8 text-yellow-600" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600">Jam Kerja</p>
              <p className="text-xl font-bold text-purple-700">{stats.workingHours}h</p>
            </div>
            <Clock className="h-8 w-8 text-purple-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MitraStatistics;
