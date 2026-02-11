'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  Search,
  CheckCircle,
  User,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import AlertDialog from '@/components/ui/Alertdialog';


// --- KONTEN UTAMA HALAMAN ---
function PembayaranContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((state) => state.user);

  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [processing, setProcessing] = useState(false);
  const [orderToProcess, setOrderToProcess] = useState<number | null>(null);

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');


  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);


  // Effect terpisah untuk handle search params setelah data orders tersedia
  useEffect(() => {
    if (orders.length > 0) {
      const orderId = searchParams.get('order');
      if (orderId) {
        const order = orders.find((o) => o.id_order === parseInt(orderId));
        if (order) {

        }
      }
    }
  }, [searchParams, orders]);

  // Effect untuk filter search
  useEffect(() => {
    const filtered = orders.filter(
      (order) =>
        order.id_order.toString().includes(search) ||
        order.no_meja.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredOrders(filtered);
  }, [search, orders]);

  const fetchOrders = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('order')
        .select(`
        *,
        users:id_user(nama_user),
        detail_order(*, masakan(*))
      `)
        .eq('status_order', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOrders(data || []);
      setFilteredOrders(data || []);

    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleProcessOrderClick = (orderId: number) => {
    setOrderToProcess(orderId);
    setShowConfirmDialog(true);
  };

  const handleConfirmProcess = async () => {
    if (!orderToProcess) return;

    setProcessing(true);

    try {
      const { error } = await supabase
        .from('order')
        .update({ status_order: 'proses' })
        .eq('id_order', orderToProcess);

      if (error) throw error;

      setShowConfirmDialog(false);
      setShowSuccessAlert(true);
      await fetchOrders();
    } catch (error: any) {
      setErrorMessage(error.message || 'Terjadi kesalahan');
      setShowConfirmDialog(false);
      setShowErrorAlert(true);
    } finally {
      setProcessing(false);
      setOrderToProcess(null);
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
        <div>
          <h1 className="text-3xl font-bold text-neutral-800 dark:text-white">Proses Pesanan</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">Validasi pesanan sebelum dikirim ke dapur</p>

        </div>


        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            placeholder="Cari Order ID atau Nomor Meja..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-500 transition-all placeholder:text-neutral-400"
          />
        </div>


        {filteredOrders.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800">
            <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-neutral-400" />
            </div>
            <p className="text-neutral-500 dark:text-neutral-400 font-medium">Tidak ada pesanan menunggu diproses</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrders.map((order) => (
              <div
                key={order.id_order}
                className="cursor-pointer h-full"
              >
                <Card className="hover:shadow-lg transition-shadow group h-full flex flex-col justify-between border border-neutral-200 dark:border-neutral-800">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-lg text-neutral-800 dark:text-white group-hover:text-orange-500 transition-colors">
                          Order #{order.id_order}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-xs font-medium rounded-md border border-neutral-200 dark:border-neutral-700">
                            Meja {order.no_meja}
                          </span>
                          <span className="px-2.5 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-medium rounded-md border border-blue-100 dark:border-blue-800 uppercase">
                            {order.status_order}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="py-4 border-t border-b border-neutral-100 dark:border-neutral-800 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-500 dark:text-neutral-400">Tanggal</span>
                        <span className="text-neutral-900 dark:text-white font-medium">{new Date(order.tanggal).toLocaleDateString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-500 dark:text-neutral-400">Waiter</span>
                        <div className="flex items-center gap-1.5">
                          <User className="w-3 h-3 text-neutral-400" />
                          <span className="text-neutral-900 dark:text-white font-medium">{order.users?.nama_user || '-'}</span>
                        </div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-500 dark:text-neutral-400">Total Items</span>
                        <span className="text-neutral-900 dark:text-white font-medium">{order.detail_order?.length || 0} item</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Total Tagihan</span>
                      <span className="text-xl font-bold text-neutral-900 dark:text-white">
                        Rp {parseFloat(order.total_harga).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  <Button
                    className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProcessOrderClick(order.id_order);
                    }}
                  >
                    Proses Pesanan
                  </Button>

                </Card>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleConfirmProcess}
        title="Proses Pesanan"
        message="Yakin pesanan akan diproses ke dapur?"
        type="success"
        confirmText="Ya, Proses"
        cancelText="Batal"
        loading={processing}
      />

      <AlertDialog
        isOpen={showSuccessAlert}
        onClose={() => setShowSuccessAlert(false)}
        title="Pesanan Diproses!"
        message="Pesanan berhasil dikirim ke dapur."
        type="success"
        buttonText="OK"
      />

      <AlertDialog
        isOpen={showErrorAlert}
        onClose={() => setShowErrorAlert(false)}
        title="Terjadi Kesalahan"
        message={errorMessage}
        type="error"
        buttonText="Tutup"
      />

    </DashboardLayout>
  );
}

// --- DEFAULT EXPORT WITH SUSPENSE ---
export default function KasirPembayaranPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    }>
      <PembayaranContent />
    </Suspense>
  );
}