'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCard from '@/components/ui/StatsCard';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Receipt, Clock, DollarSign, CreditCard } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function KasirDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    transaksiHariIni: 0,
    pendapatanHariIni: 0,
    orderMenunggu: 0,
    totalTransaksi: 0,
  });
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [{ data: orders }, { data: transaksi }] = await Promise.all([
        supabase.from('order').select('*'),
        supabase.from('transaksi').select('*'),
      ]);

      const today = new Date().toISOString().split('T')[0];
      const todayTransaksi = transaksi?.filter((t) => t.tanggal === today) || [];

      const pendapatanHariIni = todayTransaksi.reduce(
        (sum, t) => sum + parseFloat(t.total_bayar.toString()),
        0
      );

      // Orders yang selesai tapi belum ada transaksi
      const orderMenunggu =
        orders?.filter((o) => o.status_order === 'selesai' || o.status_order === 'proses') || [];

      setStats({
        transaksiHariIni: todayTransaksi.length,
        pendapatanHariIni,
        orderMenunggu: orderMenunggu.length,
        totalTransaksi: transaksi?.length || 0,
      });

      setPendingOrders(orderMenunggu.slice(0, 5));
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout allowedRoles={['kasir']}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout allowedRoles={['kasir']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Dashboard Kasir</h1>
            <p className="text-gray-600 mt-1">Kelola pembayaran dan transaksi</p>
          </div>
          <Button
            onClick={() => router.push('/dashboard/kasir/pembayaran')}
            className="flex items-center gap-2"
          >
            <CreditCard className="w-5 h-5" />
            Proses Pembayaran
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Transaksi Hari Ini"
            value={stats.transaksiHariIni}
            icon={Receipt}
            color="blue"
            subtitle={new Date().toLocaleDateString('id-ID')}
          />
          <StatsCard
            title="Pendapatan Hari Ini"
            value={`Rp ${stats.pendapatanHariIni.toLocaleString('id-ID')}`}
            icon={DollarSign}
            color="green"
          />
          <StatsCard
            title="Order Menunggu Bayar"
            value={stats.orderMenunggu}
            icon={Clock}
            color="amber"
          />
          <StatsCard
            title="Total Transaksi"
            value={stats.totalTransaksi}
            icon={Receipt}
            color="purple"
          />
        </div>

        <Card title="Pesanan Menunggu Pembayaran">
          {pendingOrders.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Tidak ada pesanan menunggu pembayaran</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingOrders.map((order) => (
                <div
                  key={order.id_order}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div>
                    <p className="font-semibold text-gray-800">
                      Order #{order.id_order} - Meja {order.no_meja}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(order.tanggal).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-gray-800">
                      Rp {parseFloat(order.total_harga).toLocaleString('id-ID')}
                    </p>
                    <Button
                      size="sm"
                      onClick={() =>
                        router.push(`/dashboard/kasir/pembayaran?order=${order.id_order}`)
                      }
                      className="mt-2"
                    >
                      Bayar Sekarang
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}