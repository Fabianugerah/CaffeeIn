// src/app/dashboard/waiter/orders/page.tsx (WITH STYLED DIALOGS)
'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import AlertDialog from '@/components/ui/Alertdialog';
import {
  ShoppingCart,
  Search,
  Eye,
  Clock,
  CheckCircle,
  RefreshCw,
  Package,
  Truck,
  XCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function WaiterOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [search, setSearch] = useState('');

  // Dialog states
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [orderToComplete, setOrderToComplete] = useState<number | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
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
        .in('status_order', ['pending', 'proses'])
        .order('created_at', { ascending: false });

      if (!error && data) {
        setOrders(data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    if (search) {
      filtered = filtered.filter(
        (order) =>
          order.id_order.toString().includes(search) ||
          order.no_meja.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFilteredOrders(filtered);
  };

  const handleCompleteOrderClick = (orderId: number) => {
    setOrderToComplete(orderId);
    setShowConfirmDialog(true);
  };

  const handleConfirmComplete = async () => {
    if (!orderToComplete) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('order')
        .update({ status_order: 'selesai' })
        .eq('id_order', orderToComplete);

      if (error) throw error;

      // Success
      setShowConfirmDialog(false);
      setShowDetailModal(false);
      setShowSuccessAlert(true);
      fetchOrders();
    } catch (error: any) {
      console.error('Error completing order:', error);
      setErrorMessage(error.message || 'Terjadi kesalahan saat memproses pesanan');
      setShowConfirmDialog(false);
      setShowErrorAlert(true);
    } finally {
      setProcessing(false);
      setOrderToComplete(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      proses: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      selesai: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800',
      dibatalkan: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800',
    };
    return styles[status as keyof typeof styles] || 'bg-neutral-100 text-neutral-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'proses':
        return <Truck className="w-4 h-4" />;
      case 'selesai':
        return <CheckCircle className="w-4 h-4" />;
      case 'dibatalkan':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status_order === 'pending').length,
    proses: orders.filter((o) => o.status_order === 'proses').length,
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-800 dark:text-white">Daftar Pesanan</h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1">
              Monitor pesanan yang sedang berjalan
            </p>
          </div>
          <Button onClick={fetchOrders} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Total Pesanan</p>
            <p className="text-2xl font-bold text-neutral-800 dark:text-white">{stats.total}</p>
          </Card>
          <Card>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Pending</p>
            <p className="text-2xl font-bold text-neutral-800 dark:text-white">{stats.pending}</p>
          </Card>
          <Card>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Proses</p>
            <p className="text-2xl font-bold text-neutral-800 dark:text-white">{stats.proses}</p>
          </Card>
        </div>

        {/* Search Filter */}
        <div className="flex flex-col md:flex-row gap-4 pt-8">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Cari order ID atau meja..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-500 transition-all placeholder:text-neutral-400"
            />
          </div>
        </div>

        {/* Orders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.length === 0 ? (
            <div className="col-span-full">
              <Card>
                <div className="text-center py-12">
                  <ShoppingCart className="w-16 h-16 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" />
                  <p className="text-neutral-500 dark:text-neutral-400 font-medium mb-1">
                    Tidak ada pesanan aktif
                  </p>
                  <p className="text-sm text-neutral-400 dark:text-neutral-500">
                    Semua pesanan sudah selesai atau belum ada pesanan baru
                  </p>
                </div>
              </Card>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <Card key={order.id_order} className="hover:shadow-lg transition-shadow">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-lg text-neutral-800 dark:text-white">
                        Order #{order.id_order}
                      </h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        {new Date(order.tanggal).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                    <span
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusBadge(
                        order.status_order
                      )}`}
                    >
                      {getStatusIcon(order.status_order)}
                      {order.status_order.toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-600 dark:text-neutral-400">Meja</span>
                      <span className="font-semibold text-neutral-900 dark:text-white">
                        {order.no_meja}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-600 dark:text-neutral-400">Items</span>
                      <span className="font-semibold text-neutral-900 dark:text-white">
                        {order.detail_order?.length || 0}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-neutral-200 dark:border-neutral-700">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-medium text-neutral-700 dark:text-neutral-300">Total</span>
                      <span className="text-2xl font-bold text-neutral-900 dark:text-white">
                        Rp {parseFloat(order.total_harga).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowDetailModal(true);
                        }}
                        className="flex-1 flex items-center justify-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Detail
                      </Button>
                      {order.status_order === 'proses' && (
                        <Button
                          size="sm"
                          onClick={() => handleCompleteOrderClick(order.id_order)}
                          className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700"
                        >
                          Selesai
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Detail Modal */}
        <Modal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedOrder(null);
          }}
          title={`Detail Order #${selectedOrder?.id_order}`}
        >
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-700">
                <div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Nomor Meja</p>
                  <p className="font-semibold text-lg text-neutral-900 dark:text-white">
                    {selectedOrder.no_meja}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Status</p>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusBadge(
                      selectedOrder.status_order
                    )}`}
                  >
                    {getStatusIcon(selectedOrder.status_order)}
                    {selectedOrder.status_order.toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Tanggal</p>
                  <p className="font-semibold text-neutral-900 dark:text-white">
                    {new Date(selectedOrder.tanggal).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Customer</p>
                  <p className="font-semibold text-neutral-900 dark:text-white">
                    {selectedOrder.users?.nama_user || '-'}
                  </p>
                </div>
              </div>

              {selectedOrder.keterangan && (
                <div className="pb-4 border-b border-neutral-200 dark:border-neutral-700">
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Keterangan</p>
                  <p className="text-sm bg-neutral-50 dark:bg-neutral-800 p-3 rounded-lg text-neutral-900 dark:text-white">
                    {selectedOrder.keterangan}
                  </p>
                </div>
              )}

              <div>
                <h4 className="font-semibold mb-3 text-neutral-900 dark:text-white">Item Pesanan</h4>
                <div className="space-y-2">
                  {selectedOrder.detail_order?.map((detail: any) => (
                    <div
                      key={detail.id_detail_order}
                      className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-neutral-800 dark:text-white">
                          {detail.masakan?.nama_masakan}
                        </p>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                          {detail.jumlah} x Rp{' '}
                          {parseFloat(detail.harga_satuan).toLocaleString('id-ID')}
                        </p>
                      </div>
                      <p className="font-bold text-neutral-800 dark:text-white">
                        Rp {parseFloat(detail.subtotal).toLocaleString('id-ID')}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-bold text-neutral-900 dark:text-white">Total</span>
                    <span className="text-2xl font-bold text-neutral-900 dark:text-white">
                      Rp {parseFloat(selectedOrder.total_harga).toLocaleString('id-ID')}
                    </span>
                  </div>

                  {selectedOrder.status_order === 'proses' && (
                    <Button
                      onClick={() => handleCompleteOrderClick(selectedOrder.id_order)}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <div className="flex items-center justify-center gap-2">
                        
                        Konfirmasi Pesanan
                      </div>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* Confirm Dialog */}
        <ConfirmDialog
          isOpen={showConfirmDialog}
          onClose={() => setShowConfirmDialog(false)}
          onConfirm={handleConfirmComplete}
          title="Konfirmasi Pesanan Selesai"
          message="Apakah Anda yakin pesanan sudah diantar ke meja customer?"
          type="success"
          confirmText="Ya, Sudah Diantar"
          cancelText="Batal"
          loading={processing}
        />

        {/* Success Alert */}
        <AlertDialog
          isOpen={showSuccessAlert}
          onClose={() => setShowSuccessAlert(false)}
          title="Pesanan Berhasil Diselesaikan!"
          message="Pesanan telah berhasil ditandai sebagai selesai."
          type="success"
          buttonText="OK"
        />

        {/* Error Alert */}
        <AlertDialog
          isOpen={showErrorAlert}
          onClose={() => setShowErrorAlert(false)}
          title="Terjadi Kesalahan"
          message={errorMessage}
          type="error"
          buttonText="Tutup"
        />
      </div>
    </DashboardLayout>
  );
}