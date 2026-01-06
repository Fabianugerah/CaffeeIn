'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCard from '@/components/ui/StatsCard';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { ShoppingCart, Clock, CheckCircle, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function WaiterDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    orderPending: 0,
    orderProses: 0,
    orderSelesai: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const { data: orders } = await supabase
        .from('order')
        .select('*')
        .order('created_at', { ascending: false });

      setStats({
        orderPending: orders?.filter((o) => o.status_order === 'pending').length || 0,
        orderProses: orders?.filter((o) => o.status_order === 'proses').length || 0,
        orderSelesai: orders?.filter((o) => o.status_order === 'selesai').length || 0,
      });

      setRecentOrders(orders?.slice(0, 5) || []);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout allowedRoles={['waiter']}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout allowedRoles={['waiter']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Dashboard Waiter</h1>
            <p className="text-gray-600 mt-1">Kelola pesanan pelanggan</p>
          </div>
          <Button
            onClick={() => router.push('/dashboard/waiter/order')}
            className="flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Buat Pesanan Baru
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard
            title="Pesanan Pending"
            value={stats.orderPending}
            icon={Clock}
            color="amber"
          />
          <StatsCard
            title="Pesanan Diproses"
            value={stats.orderProses}
            icon={ShoppingCart}
            color="blue"
          />
          <StatsCard
            title="Pesanan Selesai"
            value={stats.orderSelesai}
            icon={CheckCircle}
            color="green"
          />
        </div>

        <Card title="Pesanan Terbaru">
          {recentOrders.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Belum ada pesanan</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order.id_order}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div>
                    <p className="font-semibold text-gray-800">Meja {order.no_meja}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(order.tanggal).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-800">
                      Rp {parseFloat(order.total_harga).toLocaleString('id-ID')}
                    </p>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        order.status_order === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : order.status_order === 'proses'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {order.status_order}
                    </span>
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