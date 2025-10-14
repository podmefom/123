import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Paperclip, Download, Eye, Users, Search, Plus, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { useAuth } from '../../contexts/AuthContext';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  file?: {
    name: string;
    size: number;
    type: string;
    url: string;
  };
}

interface Chat {
  id: string;
  participants: string[]; // ID участников
  participantNames: string[]; // Имена участников
  messages: Message[];
  lastMessage?: Message;
  unreadCount: { [userId: string]: number }; // Количество непрочитанных для каждого участника
  createdAt: Date;
}

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartChat: (userId: string) => void;
}

function NewChatModal({ isOpen, onClose, onStartChat }: NewChatModalProps) {
  const { user, users } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const availableUsers = users.filter(u => {
    if (!user) return false;
    if (u.id === user.id) return false; // Не показываем себя
    
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (u.department || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const getRoleLabel = (role: string) => {
    const map = {
      photographer: 'Фотограф',
      designer: 'Дизайнер',
      admin: 'Администратор'
    };
    return map[role as keyof typeof map] || role;
  };

  const getRoleColor = (role: string) => {
    const colors = {
      photographer: 'bg-blue-100 text-blue-800',
      designer: 'bg-purple-100 text-purple-800',
      admin: 'bg-green-100 text-green-800'
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Начать новый чат</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск сотрудников..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2">
            {availableUsers.map(employee => (
              <button
                key={employee.id}
                onClick={() => {
                  onStartChat(employee.id);
                  onClose();
                }}
                className="w-full p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <img
                    src={employee.avatar || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop'}
                    alt={employee.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900 truncate">{employee.name}</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(employee.role)}`}>
                        {getRoleLabel(employee.role)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">{employee.department || 'Не указан'}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {availableUsers.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                {searchTerm ? 'Сотрудники не найдены' : 'Нет доступных сотрудников'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface MessengerProps {
  targetUserId?: string | null;
  onClearTarget?: () => void;
}

export function Messenger({ targetUserId, onClearTarget }: MessengerProps) {
  const { user, users } = useAuth();
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Автоматически открываем чат с целевым пользователем
  useEffect(() => {
    if (targetUserId && user) {
      const chatId = findOrCreateChat(targetUserId);
      setActiveChat(chatId);
      if (onClearTarget) {
        onClearTarget();
      }
    }
  }, [targetUserId, user]);

  // Загружаем чаты из localStorage
  useEffect(() => {
    const savedChats = localStorage.getItem('messenger_chats');
    if (savedChats) {
      try {
        const parsedChats = JSON.parse(savedChats);
        const chatsWithDates = parsedChats.map((chat: any) => ({
          ...chat,
          createdAt: new Date(chat.createdAt),
          messages: chat.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          })),
          lastMessage: chat.lastMessage ? {
            ...chat.lastMessage,
            timestamp: new Date(chat.lastMessage.timestamp)
          } : undefined
        }));
        setChats(chatsWithDates);
      } catch (error) {
        console.error('Ошибка при загрузке чатов:', error);
        setChats([]);
      }
    }
  }, []);

  // Сохраняем чаты в localStorage при изменении
  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem('messenger_chats', JSON.stringify(chats));
    }
  }, [chats]);

  // Автоскролл к последнему сообщению
  useEffect(() => {
    scrollToBottom();
  }, [activeChat, chats]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Получаем чаты, в которых участвует текущий пользователь
  const getUserChats = () => {
    if (!user) return [];
    return chats.filter(chat => chat.participants.includes(user.id));
  };

  // Создаем или находим чат между двумя пользователями
  const findOrCreateChat = (otherUserId: string): string => {
    if (!user) return '';

    // Ищем существующий чат
    const existingChat = chats.find(chat => 
      chat.participants.length === 2 &&
      chat.participants.includes(user.id) &&
      chat.participants.includes(otherUserId)
    );

    if (existingChat) {
      return existingChat.id;
    }

    // Создаем новый чат
    const otherUser = users.find(u => u.id === otherUserId);
    if (!otherUser) return '';

    const newChat: Chat = {
      id: Math.random().toString(36).substr(2, 9),
      participants: [user.id, otherUserId],
      participantNames: [user.name, otherUser.name],
      messages: [],
      unreadCount: { [user.id]: 0, [otherUserId]: 0 },
      createdAt: new Date()
    };

    setChats(prev => [...prev, newChat]);

    return newChat.id;
  };

  const handleStartChat = (userId: string) => {
    const chatId = findOrCreateChat(userId);
    setActiveChat(chatId);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() && !selectedFile) return;
    if (!activeChat || !user) return;

    const message: Message = {
      id: Math.random().toString(36).substr(2, 9),
      senderId: user.id,
      senderName: user.name,
      content: newMessage.trim(),
      timestamp: new Date(),
      file: selectedFile ? {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
        url: URL.createObjectURL(selectedFile)
      } : undefined
    };

    setChats(prev => {
      const updatedChats = prev.map(chat => {
        if (chat.id === activeChat) {
          // Увеличиваем счетчик непрочитанных для других участников
          const newUnreadCount = { ...chat.unreadCount };
          chat.participants.forEach(participantId => {
            if (participantId !== user.id) {
              newUnreadCount[participantId] = (newUnreadCount[participantId] || 0) + 1;
            }
          });

          return {
            ...chat,
            messages: [...chat.messages, message],
            lastMessage: message,
            unreadCount: newUnreadCount
          };
        }
        return chat;
      });
      return updatedChats;
    });

    setNewMessage('');
    setSelectedFile(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert('Размер файла не должен превышать 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  // Отмечаем сообщения как прочитанные при открытии чата
  const markAsRead = (chatId: string) => {
    if (!user) return;

    setChats(prev => {
      const updatedChats = prev.map(chat => {
        if (chat.id === chatId) {
          const newUnreadCount = { ...chat.unreadCount };
          newUnreadCount[user.id] = 0;
          return { ...chat, unreadCount: newUnreadCount };
        }
        return chat;
      });
      return updatedChats;
    });
  };

  const handleChatSelect = (chatId: string) => {
    setActiveChat(chatId);
    markAsRead(chatId);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Сегодня';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Вчера';
    } else {
      return date.toLocaleDateString('ru-RU');
    }
  };

  const getOtherParticipant = (chat: Chat) => {
    if (!user) return null;
    const otherParticipantId = chat.participants.find(id => id !== user.id);
    return users.find(u => u.id === otherParticipantId);
  };

  const userChats = getUserChats();
  const filteredChats = userChats.filter(chat => {
    const otherParticipant = getOtherParticipant(chat);
    if (!otherParticipant) return false;
    
    return otherParticipant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           otherParticipant.email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const currentChat = chats.find(chat => chat.id === activeChat);
  const currentOtherParticipant = currentChat ? getOtherParticipant(currentChat) : null;

  if (!user) return null;

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Мессенджер</h1>
            <p className="text-gray-600 mt-1">
              Общение с коллегами и обмен файлами
            </p>
          </div>
          <Button onClick={() => setShowNewChatModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Новый чат
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Список чатов */}
        <div className="w-80 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск чатов..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredChats.length === 0 ? (
              <div className="p-6 text-center">
                <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-3">
                  {searchTerm ? 'Чаты не найдены' : 'У вас пока нет чатов'}
                </p>
                {!searchTerm && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setShowNewChatModal(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Начать чат
                  </Button>
                )}
              </div>
            ) : (
              filteredChats
                .sort((a, b) => {
                  const aTime = a.lastMessage?.timestamp || a.createdAt;
                  const bTime = b.lastMessage?.timestamp || b.createdAt;
                  return bTime.getTime() - aTime.getTime();
                })
                .map(chat => {
                  const otherParticipant = getOtherParticipant(chat);
                  if (!otherParticipant) return null;

                  const unreadCount = chat.unreadCount[user.id] || 0;

                  return (
                    <button
                      key={chat.id}
                      onClick={() => handleChatSelect(chat.id)}
                      className={`w-full p-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                        activeChat === chat.id ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={otherParticipant.avatar || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop'}
                          alt={otherParticipant.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-gray-900 truncate">
                              {otherParticipant.name}
                            </h4>
                            {unreadCount > 0 && (
                              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                                {unreadCount > 99 ? '99+' : unreadCount}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 capitalize truncate">
                            {otherParticipant.role} • {otherParticipant.department || 'Не указан'}
                          </p>
                          {chat.lastMessage && (
                            <p className="text-xs text-gray-400 truncate mt-1">
                              {chat.lastMessage.senderId === user.id ? 'Вы: ' : ''}
                              {chat.lastMessage.content || 'Файл'}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
            )}
          </div>
        </div>

        {/* Область сообщений */}
        <div className="flex-1 flex flex-col">
          {activeChat && currentChat && currentOtherParticipant ? (
            <>
              {/* Заголовок чата */}
              <div className="p-4 border-b border-gray-200 bg-white">
                <div className="flex items-center space-x-3">
                  <img
                    src={currentOtherParticipant.avatar || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop'}
                    alt={currentOtherParticipant.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900">{currentOtherParticipant.name}</h3>
                    <p className="text-sm text-gray-500 capitalize">
                      {currentOtherParticipant.role} • {currentOtherParticipant.department || 'Не указан'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Сообщения */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {currentChat.messages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Начните общение с {currentOtherParticipant.name}</p>
                  </div>
                ) : (
                  currentChat.messages.map((message, index) => {
                    const showDate = index === 0 || 
                      formatDate(message.timestamp) !== formatDate(currentChat.messages[index - 1].timestamp);
                    
                    return (
                      <div key={message.id}>
                        {showDate && (
                          <div className="text-center my-4">
                            <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                              {formatDate(message.timestamp)}
                            </span>
                          </div>
                        )}
                        <div
                          className={`flex ${
                            message.senderId === user.id ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.senderId === user.id
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            {message.content && (
                              <p className="text-sm break-words">{message.content}</p>
                            )}
                            {message.file && (
                              <div className="mt-2 p-2 bg-black bg-opacity-10 rounded">
                                <div className="flex items-center space-x-2">
                                  <Paperclip className="h-3 w-3" />
                                  <span className="text-xs truncate">{message.file.name}</span>
                                </div>
                                <div className="text-xs opacity-75 mt-1">
                                  {formatFileSize(message.file.size)}
                                </div>
                                <div className="flex space-x-1 mt-2">
                                  {message.file.type.startsWith('image/') && (
                                    <button
                                      onClick={() => {
                                        const modal = document.createElement('div');
                                        modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4';
                                        modal.innerHTML = `
                                          <div class="relative max-w-4xl max-h-full">
                                            <img src="${message.file!.url}" alt="${message.file!.name}" class="max-w-full max-h-full object-contain rounded-lg">
                                            <button class="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75">
                                              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                              </svg>
                                            </button>
                                          </div>
                                        `;
                                        modal.onclick = (e) => {
                                          if (e.target === modal || e.target.closest('button')) {
                                            document.body.removeChild(modal);
                                          }
                                        };
                                        document.body.appendChild(modal);
                                      }}
                                      className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded hover:bg-opacity-30"
                                    >
                                      <Eye className="h-3 w-3" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      const link = document.createElement('a');
                                      link.href = message.file!.url;
                                      link.download = message.file!.name;
                                      document.body.appendChild(link);
                                      link.click();
                                      document.body.removeChild(link);
                                    }}
                                    className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded hover:bg-opacity-30"
                                  >
                                    <Download className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            )}
                            <div className="text-xs opacity-75 mt-1">
                              {formatTime(message.timestamp)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Область ввода */}
              <div className="border-t border-gray-200 p-4 bg-white">
                {selectedFile && (
                  <div className="mb-3 p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Paperclip className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700 truncate">
                        {selectedFile.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({formatFileSize(selectedFile.size)})
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
                <div className="flex items-end space-x-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Paperclip className="h-5 w-5" />
                  </button>
                  <div className="flex-1">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Введите сообщение..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={1}
                    />
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() && !selectedFile}
                    size="sm"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Выберите чат</h3>
                <p className="text-gray-600 mb-4">
                  Выберите существующий чат или создайте новый
                </p>
                <Button onClick={() => setShowNewChatModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Начать новый чат
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal для создания нового чата */}
      <NewChatModal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        onStartChat={handleStartChat}
      />
    </div>
  );
}