'use client';

import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api/auth';
import { LogOut, User, Menu } from 'lucide-react';
import Button from '@/components/ui/Button';

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      logout();
      router.push('/login');
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3 fixed w-full top-0 z-30">
      <div className="flex items-center justify-between">
        {/* Left: Menu Button + Logo */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-xl font-bold text-white">O</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-gray-800">Ordly</h1>
              <p className="text-xs text-gray-500">Restaurant POS</p>
            </div>
          </div>
        </div>

        {/* Right: User Info + Logout */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {user?.nama_user}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {user?.level?.nama_level}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </nav>
  );
}