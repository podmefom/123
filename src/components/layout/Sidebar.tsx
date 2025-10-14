import React, { useState } from 'react';
import { 
  Home, 
  FolderOpen, 
  Upload, 
  Calendar, 
  Users, 
  Camera,
  Palette,
  UserPlus,
  DollarSign,
  MessageCircle,
  FileText,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../utils/cn';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { user } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  // Проверяем наличие непрочитанных сообщений
  const getUnreadMessagesCount = () => {
    try {
      const savedChats = localStorage.getItem('messenger_chats');
      if (savedChats) {
        const chats = JSON.parse(savedChats);
        return chats.reduce((total: number, chat: any) => {
          // Считаем только непрочитанные сообщения для текущего пользователя
          const userUnread = chat.unreadCount && chat.unreadCount[user?.id] ? chat.unreadCount[user.id] : 0;
          return total + userUnread;
        }, 0);
      }
    } catch (error) {
      console.error('Ошибка при подсчете непрочитанных сообщений:', error);
    }
    return 0;
  };

  const unreadCount = getUnreadMessagesCount();

  const getNavigationItems = () => {
    const baseItems = [
      { id: 'dashboard', label: 'Главная', icon: Home },
      { id: 'projects', label: 'Проекты', icon: FolderOpen },
      { id: 'reports', label: 'Отчеты', icon: MessageCircle },
    ];

    const roleSpecificItems = {
      photographer: [],
      designer: [],
      admin: [
        { id: 'add-employee', label: 'Добавить сотрудника', icon: UserPlus },
      ]
    };

    const commonItems = [
      { id: 'employees', label: 'Сотрудники', icon: Users },
      { id: 'salary', label: 'Зарплаты', icon: DollarSign },
      { id: 'calendar', label: 'Календарь', icon: Calendar },
      { id: 'messenger', label: 'Мессенджер', icon: MessageCircle, badge: unreadCount },
      { id: 'script', label: 'Скрипт', icon: FileText },
    ];

    return [
      ...baseItems,
      ...(roleSpecificItems[user?.role || 'photographer'] || []),
      ...commonItems
    ];
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      
      {/* Mobile toggle button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border border-gray-200"
      >
        {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <div className={`
        bg-white border-r border-gray-200 h-full flex flex-col transition-all duration-300 z-50
        fixed md:relative
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        w-64 md:w-64
      `}>
        <div className="p-4 md:p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center">
              <Camera className="h-4 w-4 md:h-6 md:w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-gray-900">PhotoAlbums</h1>
              <p className="text-xs md:text-sm text-gray-500">Управление проектами</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 md:p-4 overflow-y-auto">
          <ul className="space-y-1">
            {getNavigationItems().map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      onTabChange(item.id);
                      setIsMobileOpen(false); // Close mobile menu on selection
                    }}
                    className={cn(
                      'w-full flex items-center space-x-3 px-3 py-2.5 md:py-2 rounded-lg text-left transition-colors relative',
                      activeTab === item.id
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                      (user?.role !== 'admin' && item.id === 'add-employee')
                        ? 'opacity-50 cursor-not-allowed'
                        : ''
                    )}
                    disabled={user?.role !== 'admin' && item.id === 'add-employee'}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span className="font-medium text-sm md:text-base">{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center ml-auto">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-3 md:p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <img
              src={user?.avatar || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop'}
              alt={user?.name}
              className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate text-sm md:text-base">{user?.name}</p>
              <p className="text-xs md:text-sm text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}