import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database Types
export type Database = {
  public: {
    Tables: {
      level: {
        Row: {
          id_level: number;
          nama_level: string;
          created_at: string;
          updated_at: string;
        };
      };
      users: {
        Row: {
          id_user: number;
          username: string;
          password: string;
          nama_user: string;
          id_level: number;
          created_at: string;
          updated_at: string;
        };
      };
      masakan: {
        Row: {
          id_masakan: number;
          nama_masakan: string;
          harga: number;
          status_masakan: string;
          kategori: string | null;
          deskripsi: string | null;
          gambar: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      order: {
        Row: {
          id_order: number;
          no_meja: string;
          tanggal: string;
          id_user: number;
          keterangan: string | null;
          status_order: string;
          total_harga: number;
          created_at: string;
          updated_at: string;
        };
      };
      detail_order: {
        Row: {
          id_detail_order: number;
          id_order: number;
          id_masakan: number;
          jumlah: number;
          harga_satuan: number;
          subtotal: number;
          keterangan: string | null;
          status_detail_order: string;
          created_at: string;
          updated_at: string;
        };
      };
      transaksi: {
        Row: {
          id_transaksi: number;
          id_user: number;
          id_order: number;
          tanggal: string;
          total_bayar: number;
          uang_diterima: number | null;
          kembalian: number | null;
          metode_pembayaran: string;
          created_at: string;
          updated_at: string;
        };
      };
    };
  };
};