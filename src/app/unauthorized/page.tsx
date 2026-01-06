'use client';

import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { ShieldAlert } from 'lucide-react';

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <ShieldAlert className="w-20 h-20 text-red-500 mx-auto mb-6" />
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          403 - Unauthorized
        </h1>
        <p className="text-gray-600 mb-8">
          Anda tidak memiliki akses ke halaman ini.
        </p>
        <Button onClick={() => router.back()}>
          Kembali
        </Button>
      </div>
    </div>
  );
}