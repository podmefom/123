import React, { useState } from 'react';
import { Search, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4">
      <div className="flex items-center justify-between">
        {/* Mobile spacing for hamburger menu */}
        <div className="w-10 md:w-0"></div>

        {/* Desktop search */}
        <div className="flex-1 max-w-lg mx-4 md:mx-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск проектов, файлов, пользователей..."
              className="w-full pl-10 pr-4 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2 md:space-x-4">
          <div className="flex items-center space-x-2 md:space-x-3">
            <img
              src={user?.avatar || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop'}
              alt={user?.name}
              className="w-6 h-6 md:w-8 md:h-8 rounded-full object-cover"
            />
            <div className="hidden lg:block">
              <p className="text-sm font-medium text-gray-900 truncate max-w-32">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm" 
            onClick={logout}
            className="text-gray-500 hover:text-red-600"
          >
            <LogOut className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}