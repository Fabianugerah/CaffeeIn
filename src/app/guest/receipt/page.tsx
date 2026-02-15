// src/app/guest/receipt/page.tsx
'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useCartStore } from '@/store/cartStore';
import { Check, Download, Home } from 'lucide-react';
import DigitalReceipt from '@/components/payment/DigitalReceipt';
import PaymentSteps from '@/components/payment/PaymentSteps';
import Navbar from '@/components/layout/NavbarCustomer';
import Footer from '@/components/layout/FooterCustomer';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

function ReceiptContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [transaksi, setTransaksi] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [confirmPrintOpen, setConfirmPrintOpen] = useState(false);
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);

  // Ambil fungsi clearCart dari store
  const clearCart = useCartStore((state) => state.clearCart);

  // State dummy untuk Navbar props
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const transaksiId = searchParams.get('transaksi');
    if (transaksiId) {
      fetchTransaksi(parseInt(transaksiId));
    } else {
      router.push('/guest/order');
    }
  }, [searchParams]);

  const fetchTransaksi = async (transaksiId: number) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transaksi')
        .select(`
          *,
          order:id_order(
            id_order,
            no_meja,
            nama_pelanggan,
            tipe_pesanan,
            detail_order(
              *,
              masakan(nama_masakan)
            )
          )
        `)
        .eq('id_transaksi', transaksiId)
        .single();

      if (error) throw error;

      setTransaksi(data);

      // LOGIKA PENTING:
      // Jika data transaksi berhasil ditemukan (artinya pembayaran sukses),
      // maka kita KOSONGKAN keranjang belanja agar user bisa pesan baru lagi.
      clearCart();

    } catch (error) {
      console.error('Error fetching receipt:', error);
      alert('Gagal memuat struk pembayaran');
      router.push('/guest/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('digital-receipt');
    if (!element) return;

    try {
      setIsDownloading(true);
      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = 80;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [pdfWidth, pdfHeight]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      const dateObj = new Date(transaksi.tanggal);
      const dateStr = dateObj.toISOString().slice(0, 10).replace(/-/g, '');
      const receiptCode = `${dateStr}${transaksi.id_transaksi.toString().padStart(4, '0')}`;
      
      pdf.save(`Struk-${receiptCode}.pdf`);

    } catch (error) {
      console.error('Gagal PDF:', error);
      alert('Gagal cetak PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleBackToMenu = () => {
    router.push('/guest/menu');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-950 transition-colors duration-300">
        <div className="animate-spin w-8 h-8 border-4 border-neutral-300 dark:border-neutral-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!transaksi) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white flex flex-col transition-colors duration-300">
      {/* Confirm Print Dialog */}
      <ConfirmDialog
        isOpen={confirmPrintOpen}
        onClose={() => setConfirmPrintOpen(false)}
        onConfirm={() => {
          setConfirmPrintOpen(false);
          handleDownloadPDF();
        }}
        title="Cetak Struk?"
        message="Apakah kamu yakin ingin mencetak struk ini?"
        type="info"
        confirmText="Cetak"
      />

      {/* Confirm Close Dialog */}
      <ConfirmDialog
        isOpen={confirmCloseOpen}
        onClose={() => setConfirmCloseOpen(false)}
        onConfirm={() => {
          setConfirmCloseOpen(false);
          handleBackToMenu();
        }}
        title="Kembali ke Menu?"
        message="Apakah kamu yakin ingin kembali ke menu utama?"
        type="warning"
        confirmText="Ya, Kembali"
      />

      {/* Navbar */}
      <div className="print:hidden">
        <Navbar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
      </div>

      <main className="flex-1 flex flex-col items-center justify-center pt-12 sm:pt-16 lg:pt-20 px-4 sm:px-6 lg:px-8 pb-10 relative">
        {/* Background Glow Effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[400px] lg:w-[500px] h-[300px] sm:h-[400px] lg:h-[500px] bg-green-500/5 dark:bg-blue-500/10 rounded-full blur-[100px] lg:blur-[120px] -z-10 pointer-events-none"></div>

        <div className="w-full max-w-5xl mx-auto space-y-6 sm:space-y-8">

          {/* Step 3: Confirmation */}
          <div className="print:hidden px-4 sm:px-0">
            <PaymentSteps currentStep={3} />
          </div>

          {/* Judul Halaman */}
          <div className="text-center space-y-2 sm:space-y-3 mb-6 sm:mb-8 print:hidden animate-fade-in-down px-4 sm:px-0">

            <div className="mx-auto mb-4 sm:mb-6 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-green-500 shadow-lg shadow-green-500/30">
              <Check className="h-8 w-8 sm:h-10 sm:w-10 text-white stroke-[3]" />
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-900 dark:text-white">
              Pembayaran Berhasil!
            </h1>
            <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 max-w-md mx-auto">
              Terima kasih telah memesan. Pesanan Anda sedang disiapkan.
            </p>
          </div>

          {/* Komponen Struk Digital & Buttons */}
          <div className="animate-scale-in flex flex-col items-center gap-6 w-full max-w-sm mx-auto px-4 sm:px-0 pb-10">
            
            {/* Struk Digital */}
            <DigitalReceipt transaksi={transaksi} />

            {/* Action Buttons */}
            <div className="flex flex-col w-full gap-3 print:hidden">
              <Button
                onClick={() => setConfirmPrintOpen(true)}
                disabled={isDownloading}
                className="bg-neutral-800 hover:bg-neutral-700 text-white border-none h-12 flex items-center justify-center"
              >
                {isDownloading ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                <span className="text-xs sm:text-sm">Cetak Struk</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => setConfirmCloseOpen(true)}
                className="w-full border border-neutral-200 dark:border-neutral-800 text-black dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 bg-transparent h-12 flex items-center justify-center"
              >
                <Home className="w-4 h-4 mr-2" />
                <span className="text-xs sm:text-sm">Menu Utama</span>
              </Button>
            </div>

          </div>

        </div>
      </main>

      {/* Footer */}
      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}

export default function ReceiptPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-950 transition-colors duration-300">
        <div className="animate-spin w-8 h-8 border-4 border-neutral-300 dark:border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    }>
      <ReceiptContent />
    </Suspense>
  );
}