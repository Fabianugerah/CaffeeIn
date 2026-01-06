'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/lib/services/authService';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Eye, EyeOff, LogIn } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login(formData.username, formData.password);

      if (!response.success) {
        setError(response.error || 'Login gagal');
        setLoading(false);
        return;
      }

      // Save to store
      setAuth(response.user);

      // Redirect based on role
      const role = response.user.level?.nama_level;
      switch (role) {
        case 'administrator':
          router.push('/dashboard/admin');
          break;
        case 'waiter':
          router.push('/dashboard/waiter');
          break;
        case 'kasir':
          router.push('/dashboard/kasir');
          break;
        case 'owner':
          router.push('/dashboard/owner');
          break;
        case 'pelanggan':
          router.push('/dashboard/customer');
          break;
        default:
          router.push('/dashboard');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError('Terjadi kesalahan saat login');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 px-4">
      <div className="max-w-md w-full">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
            <span className="text-3xl font-bold text-white">O</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Ordly</h1>
          <p className="text-gray-600">Smart Restaurant Service</p>
          <p className="text-sm text-blue-600 mt-2">Powered by Supabase ⚡</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Masuk ke Akun
          </h2>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Username"
              type="text"
              name="username"
              placeholder="Masukkan username"
              value={formData.username}
              onChange={handleChange}
              required
              autoFocus
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Masukkan password (apa saja)"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Demo: Password bebas (untuk testing cepat)
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Masuk</span>
                </>
              )}
            </Button>
          </form>

          {/* Demo Accounts */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center mb-3">
              Demo Accounts (password: apa saja):
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-blue-50 p-2 rounded">
                <p className="font-semibold text-blue-800">Admin</p>
                <p className="text-blue-600">Username: admin</p>
              </div>
              <div className="bg-green-50 p-2 rounded">
                <p className="font-semibold text-green-800">Waiter</p>
                <p className="text-green-600">Username: waiter1</p>
              </div>
              <div className="bg-amber-50 p-2 rounded">
                <p className="font-semibold text-amber-800">Kasir</p>
                <p className="text-amber-600">Username: kasir1</p>
              </div>
              <div className="bg-purple-50 p-2 rounded">
                <p className="font-semibold text-purple-800">Owner</p>
                <p className="text-purple-600">Username: owner</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-6">
          © 2026 Ordly - UJI KOMPETENSI KEAHLIAN
        </p>
      </div>
    </div>
  );
}