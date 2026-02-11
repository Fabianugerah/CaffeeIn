'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  FileText,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Download,
  Star,
  Banknote,
  CreditCard,
  Smartphone,
  RefreshCw,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
// Import Date Range Picker Custom
import DateRangePicker from '@/components/ui/DateRangePicker';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminLaporanPage() {
  const [initialLoading, setInitialLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  // Date Range State (Object Date)
  const [dateRange, setDateRange] = useState<{ startDate: Date | null; endDate: Date | null }>({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
    endDate: new Date(),
  });

  const [reportData, setReportData] = useState({
    overview: {
      totalOrders: 0,
      totalRevenue: 0,
      totalTransaksi: 0,
      avgOrderValue: 0,
      revenueGrowth: 0,
      orderGrowth: 0,
      transaksiGrowth: 0,
      avgOrderGrowth: 0,
    },
    revenueByDate: [] as any[],
    topMenu: [] as any[],
    ordersByStatus: { pending: 0, proses: 0, selesai: 0, dibatalkan: 0 },
    paymentMethods: { tunai: 0, debit: 0, qris: 0 },
    hourlyOrders: [] as any[],
    transactionList: [] as any[],
  });

  useEffect(() => {
    // Auto fetch saat tanggal lengkap
    if (dateRange.startDate && dateRange.endDate) {
      fetchReportData(initialLoading);
    }
  }, [dateRange]);

  // Helper untuk menghitung growth
  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const fetchReportData = async (showLoader = false) => {
    try {
      showLoader ? setInitialLoading(true) : setIsFetching(true);

      if (!dateRange.startDate || !dateRange.endDate) return;

      const startDateStr = new Intl.DateTimeFormat('en-CA').format(dateRange.startDate);
      const endDateStr = new Intl.DateTimeFormat('en-CA').format(dateRange.endDate);

      // --- 1. DATA UTAMA (Berdasarkan Range Tanggal) ---
      const [
        { data: orders },
        { data: transaksi },
        { data: detailOrders }
      ] = await Promise.all([
        supabase.from('order').select('*').gte('tanggal', startDateStr).lte('tanggal', endDateStr),
        supabase.from('transaksi').select('*, order:id_order(no_meja), users:id_user(nama_user)').gte('tanggal', startDateStr).lte('tanggal', endDateStr).order('created_at', { ascending: false }),
        supabase.from('detail_order').select('*, masakan(*), order!inner(tanggal, created_at)').gte('order.tanggal', startDateStr).lte('order.tanggal', endDateStr)
      ]);

      // --- 2. DATA PERIODE SEBELUMNYA (Untuk Growth Comparison) ---
      const timeDiff = dateRange.endDate.getTime() - dateRange.startDate.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

      const prevEndDate = new Date(dateRange.startDate);
      prevEndDate.setDate(prevEndDate.getDate() - 1);

      const prevStartDate = new Date(prevEndDate);
      prevStartDate.setDate(prevStartDate.getDate() - daysDiff);

      const prevStartStr = new Intl.DateTimeFormat('en-CA').format(prevStartDate);
      const prevEndStr = new Intl.DateTimeFormat('en-CA').format(prevEndDate);

      const [
        { data: prevOrders },
        { data: prevTransaksi }
      ] = await Promise.all([
        supabase.from('order').select('id_order').gte('tanggal', prevStartStr).lte('tanggal', prevEndStr),
        supabase.from('transaksi').select('total_bayar').gte('tanggal', prevStartStr).lte('tanggal', prevEndStr)
      ]);

      // --- 3. HITUNG STATISTIK ---

      // Current Period Stats
      const totalRevenue = transaksi?.reduce((sum, t) => sum + parseFloat(t.total_bayar), 0) || 0;
      const totalOrders = orders?.length || 0;
      const totalTransaksi = transaksi?.length || 0;
      const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0;

      // Previous Period Stats
      const prevTotalRevenue = prevTransaksi?.reduce((sum, t) => sum + parseFloat(t.total_bayar), 0) || 0;
      const prevTotalOrders = prevOrders?.length || 0;
      const prevTotalTransaksi = prevTransaksi?.length || 0;
      const prevAvgOrderValue = prevTotalOrders ? prevTotalRevenue / prevTotalOrders : 0;

      // Hitung Growth (Dinamis sesuai rentang tanggal)
      const overview = {
        totalOrders,
        totalRevenue,
        totalTransaksi,
        avgOrderValue,
        revenueGrowth: calculateGrowth(totalRevenue, prevTotalRevenue),
        orderGrowth: calculateGrowth(totalOrders, prevTotalOrders),
        transaksiGrowth: calculateGrowth(totalTransaksi, prevTotalTransaksi),
        avgOrderGrowth: calculateGrowth(avgOrderValue, prevAvgOrderValue)
      };

      // --- 4. LOGIC CHART & LAINNYA ---
      const revenueMap: { [key: string]: number } = {};
      transaksi?.forEach((t) => {
        if (!revenueMap[t.tanggal]) revenueMap[t.tanggal] = 0;
        revenueMap[t.tanggal] += parseFloat(t.total_bayar);
      });

      const revenueByDate = Object.entries(revenueMap)
        .map(([date, revenue]) => ({
          date,
          revenue,
          formattedDate: new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Hourly Orders
      const hourlyMap: { [key: number]: number } = {};
      detailOrders?.forEach((detail) => {
        if (detail.order?.created_at) {
          const hour = new Date(detail.order.created_at).getHours();
          if (!hourlyMap[hour]) hourlyMap[hour] = 0;
          hourlyMap[hour]++;
        }
      });
      const hourlyOrders = Array.from({ length: 24 }, (_, i) => ({
        hour: `${i.toString().padStart(2, '0')}:00`,
        orders: hourlyMap[i] || 0,
      })).filter((_, i) => i >= 8 && i <= 22);

      // Top Menu
      const menuSales: { [key: number]: { total: number; revenue: number; masakan: any } } = {};
      detailOrders?.forEach((detail) => {
        if (detail.id_masakan) {
          if (!menuSales[detail.id_masakan]) {
            menuSales[detail.id_masakan] = { total: 0, revenue: 0, masakan: detail.masakan };
          }
          menuSales[detail.id_masakan].total += detail.jumlah;
          menuSales[detail.id_masakan].revenue += parseFloat(detail.subtotal);
        }
      });
      const topMenu = Object.values(menuSales).sort((a, b) => b.total - a.total).slice(0, 5);

      // Payment Methods
      const paymentMethods = {
        tunai: transaksi?.filter((t) => t.metode_pembayaran === 'tunai').length || 0,
        debit: transaksi?.filter((t) => t.metode_pembayaran === 'debit').length || 0,
        qris: transaksi?.filter((t) => t.metode_pembayaran === 'qris').length || 0,
      };

      setReportData({
        overview,
        revenueByDate,
        topMenu,
        ordersByStatus: { pending: 0, proses: 0, selesai: 0, dibatalkan: 0 },
        paymentMethods,
        hourlyOrders,
        transactionList: transaksi || []
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      showLoader ? setInitialLoading(false) : setIsFetching(false);
    }
  };

  // --- CONFIG CARD STATISTIK ---
  const statCards = [
    
    {
      title: "Total Pendapatan",
      value: `Rp ${(reportData.overview.totalRevenue).toLocaleString('id-ID')}`,
      growth: reportData.overview.revenueGrowth,
      icon: DollarSign,
      iconBg: "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
    },
    {
      title: "Total Pesanan",
      value: reportData.overview.totalOrders.toLocaleString(),
      growth: reportData.overview.orderGrowth,
      icon: ShoppingCart,
      iconBg: "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
    },
    {
      title: "Rata-rata Order",
      value: `Rp ${(reportData.overview.avgOrderValue).toLocaleString('id-ID')}`,
      growth: reportData.overview.avgOrderGrowth,
      icon: TrendingUp,
      iconBg: "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
    },
    {
      title: "Total Transaksi",
      value: reportData.overview.totalTransaksi.toLocaleString(),
      growth: reportData.overview.transaksiGrowth,
      icon: FileText,
      iconBg: "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
    }
  ];

  if (initialLoading) return (
    <DashboardLayout allowedRoles={['administrator']}>
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-neutral-500 border-t-transparent rounded-full" />
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout allowedRoles={['administrator']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8">
          <div>
            <h1 className="text-3xl font-bold text-neutral-800 dark:text-white">Laporan & Analytics</h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1">Analisis performa dan insight bisnis restoran</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => fetchReportData(false)} variant="outline" className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />Refresh
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />Export
            </Button>
          </div>
        </div>


        {/* Custom Date Picker */}
        <DateRangePicker
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          onChange={(start, end) => setDateRange({ startDate: start, endDate: end })}
        />



        {/* Overview Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {statCards.map((stat, index) => {
            const isPositive = stat.growth >= 0;
            return (
              <Card key={index} className="relative overflow-hidden hover:shadow-lg transition-all duration-300 border border-neutral-100 dark:border-neutral-800">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">{stat.title}</p>
                    <h3 className="text-2xl font-bold text-neutral-900 dark:text-white">{stat.value}</h3>

                    <div className="flex items-center gap-1.5 mt-3">
                      <span className={`flex items-center text-xs font-bold px-1.5 py-0.5 rounded ${isPositive ? 'bg-green-50 text-green-600 dark:bg-green-900/20' : 'bg-red-50 text-red-600 dark:bg-red-900/20'}`}>
                        {isPositive ? <ArrowUp className="w-3 h-3 mr-0.5" /> : <ArrowDown className="w-3 h-3 mr-0.5" />}
                        {Math.abs(stat.growth).toFixed(1)}%
                      </span>
                      <span className="text-xs text-neutral-400">  periode lalu</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.iconBg}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-lg font-semibold mb-4 text-neutral-800 dark:text-white">Tren Pendapatan Harian</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={reportData.revenueByDate}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                  <XAxis dataKey="formattedDate" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} formatter={(value: any) => [`Rp ${value.toLocaleString('id-ID')}`, 'Revenue']} />
                  <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold mb-4 text-neutral-800 dark:text-white">Pola Pesanan per Jam</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportData.hourlyOrders}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                  <XAxis dataKey="hour" stroke="#9ca3af" style={{ fontSize: '11px' }} />
                  <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} formatter={(value: any) => [`${value} pesanan`, 'Total']} />
                  <Bar dataKey="orders" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Menu */}
          <Card className="lg:col-span-2">
            <h3 className="text-lg font-semibold mb-6 text-neutral-800 dark:text-white">Menu Terlaris</h3>
            {reportData.topMenu.length === 0 ? (
              <p className="text-center text-neutral-500 dark:text-neutral-400 py-8">Tidak ada data</p>
            ) : (
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {reportData.topMenu.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-lg font-bold text-white shadow-sm flex-shrink-0 ${idx === 0 ? 'bg-orange-500' : idx === 1 ? 'bg-neutral-700' : idx === 2 ? 'bg-neutral-600' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'}`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-neutral-900 dark:text-white truncate">{item.masakan?.nama_masakan || 'Unknown'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                          {item.masakan?.kategori || 'Menu'}
                        </span>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">{item.total} terjual</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-neutral-900 dark:text-white">Rp {(item.revenue / 1000).toFixed(0)}k</p>
                      {idx === 0 && (
                        <div className="flex items-center justify-end gap-1 text-orange-500 mt-0.5">
                          <Star className="w-3 h-3 fill-current" />
                          <span className="text-[10px] font-bold uppercase">Top 1</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Payment Methods */}
          <Card>
            <h3 className="text-lg font-semibold mb-6 text-neutral-800 dark:text-white">Metode Pembayaran</h3>
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              <div className="flex items-center justify-between py-4 first:pt-0">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400"><Banknote className="w-5 h-5" /></div>
                  <div><p className="font-medium text-neutral-900 dark:text-white">Tunai</p><p className="text-xs text-neutral-500 dark:text-neutral-400">Cash Payment</p></div>
                </div>
                <span className="text-lg font-bold text-neutral-900 dark:text-white">{reportData.paymentMethods.tunai}</span>
              </div>
              <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400"><CreditCard className="w-5 h-5" /></div>
                  <div><p className="font-medium text-neutral-900 dark:text-white">Debit</p><p className="text-xs text-neutral-500 dark:text-neutral-400">Card Payment</p></div>
                </div>
                <span className="text-lg font-bold text-neutral-900 dark:text-white">{reportData.paymentMethods.debit}</span>
              </div>
              <div className="flex items-center justify-between py-4 last:pb-0">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400"><Smartphone className="w-5 h-5" /></div>
                  <div><p className="font-medium text-neutral-900 dark:text-white">QRIS</p><p className="text-xs text-neutral-500 dark:text-neutral-400">Digital Payment</p></div>
                </div>
                <span className="text-lg font-bold text-neutral-900 dark:text-white">{reportData.paymentMethods.qris}</span>
              </div>
            </div>
          </Card>
        </div>

      </div>
    </DashboardLayout>
  );
}