'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCard from '@/components/ui/StatsCard';
import Card from '@/components/ui/Card';
import { TrendingUp, DollarSign, ShoppingCart, Users, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function OwnerDashboard() {
  const [stats, setStats] = useState({
    pendapatanBulanIni: 0,
    totalTransaksi: 0,
    totalPesanan: 0,
    totalPelanggan: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [topMenu, setTopMenu] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [
        { data: transaksi },
        { data: orders },
        { data: users },
        { data: detailOrders },
      ] = await Promise.all([
        supabase.from('transaksi').select('*'),
        supabase.from('order').select('*'),
        supabase.from('users').select('*'),
        supabase.from('detail_order').select('*, masakan(*)'),
      ]);

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const transaksiThisMonth =
        transaksi?.filter((t) => {
          const tDate = new Date(t.tanggal);
          return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
        }) || [];

      const pendapatanBulanIni = transaksiThisMonth.reduce(
        (sum, t) => sum + parseFloat(t.total_bayar.toString()),
        0
      );

      const pelanggan = users?.filter((u) => u.id_level === 5) || [];

      setStats({
        pendapatanBulanIni,
        totalTransaksi: transaksi?.length || 0,
        totalPesanan: orders?.length || 0,
        totalPelanggan: pelanggan.length,
      });

      // Calculate top menu
      const menuSales: { [key: number]: { total: number; revenue: number; masakan: any } } = {};
      detailOrders?.forEach((detail) => {
        if (detail.id_masakan) {
          if (!menuSales[detail.id_masakan]) {
            menuSales[detail.id_masakan] = {
              total: 0,
              revenue: 0,
              masakan: detail.masakan,
            };
          }
          menuSales[detail.id_masakan].total += detail.jumlah;
          menuSales[detail.id_masakan].revenue += parseFloat(detail.subtotal.toString());
        }
      });

      const topMenuArray = Object.values(menuSales)
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);
      setTopMenu(topMenuArray);

      // Chart data (last 7 days)
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        const dayTransaksi = transaksi?.filter((t) => t.tanggal === dateStr) || [];
        const dayRevenue = dayTransaksi.reduce(
          (sum, t) => sum + parseFloat(t.total_bayar.toString()),
          0
        );

        last7Days.push({
          date: date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
          revenue: dayRevenue,
        });
      }
      setChartData(last7Days);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout allowedRoles={['owner']}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout allowedRoles={['owner']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard Owner</h1>
          <p className="text-gray-600 mt-1">Monitoring performa bisnis restoran</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Pendapatan Bulan Ini"
            value={`Rp ${stats.pendapatanBulanIni.toLocaleString('id-ID')}`}
            icon={DollarSign}
            color="green"
          />
          <StatsCard
            title="Total Transaksi"
            value={stats.totalTransaksi}
            icon={TrendingUp}
            color="blue"
          />
          <StatsCard
            title="Total Pesanan"
            value={stats.totalPesanan}
            icon={ShoppingCart}
            color="amber"
          />
          <StatsCard
            title="Total Pelanggan"
            value={stats.totalPelanggan}
            icon={Users}
            color="purple"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Pendapatan 7 Hari Terakhir">
            <div className="space-y-3">
              {chartData.map((data, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-600 w-20">{data.date}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-8 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-green-400 to-green-600 h-full flex items-center justify-end pr-2"
                      style={{
                        width: `${Math.min(
                          (data.revenue / Math.max(...chartData.map((d) => d.revenue))) * 100,
                          100
                        )}%`,
                      }}
                    >
                      <span className="text-xs font-bold text-white">
                        {data.revenue > 0 && `Rp ${(data.revenue / 1000).toFixed(0)}k`}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Menu Terlaris">
            {topMenu.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Belum ada data</p>
            ) : (
              <div className="space-y-3">
                {topMenu.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-center w-10 h-10 bg-primary text-white font-bold rounded-full">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">
                        {item.masakan?.nama_masakan || 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-600">Terjual: {item.total} porsi</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">
                        Rp {item.revenue.toLocaleString('id-ID')}
                      </p>
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="text-xs font-medium">Top</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}