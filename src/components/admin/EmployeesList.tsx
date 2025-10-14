import React, { useState } from 'react';
import { Users, Search, Filter, CreditCard as Edit, Trash2, Mail, X, MessageCircle, Phone, Upload } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import { User } from '../../types/user';

interface EditModalProps {
  employee: User;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, data: Partial<User>) => void;
}

function EditEmployeeModal({ employee, isOpen, onClose, onSave }: EditModalProps) {
  const { updateUserPassword } = useAuth();
  const [formData, setFormData] = useState({
    name: employee.name,
    email: employee.email,
    phone: employee.phone || '',
    telegram: employee.telegram || '',
    role: employee.role,
    department: employee.department || '',
    position: employee.position || '',
    salary: employee.salary?.toString() || '',
    avatar: employee.avatar || '',
    newPassword: ''
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(employee.avatar || null);
  const [loading, setLoading] = useState(false);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Размер файла не должен превышать 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        alert('Можно загружать только изображения');
        return;
      }
      
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    setFormData(prev => ({ ...prev, avatar: '' }));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updateData: Partial<User> = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        telegram: formData.telegram,
        role: formData.role,
        department: formData.department,
        position: formData.position,
        salary: formData.salary ? parseInt(formData.salary) : undefined,
      };

      if (avatarPreview && avatarPreview !== employee.avatar) {
        updateData.avatar = avatarPreview;
      }

      await onSave(employee.id, updateData);

      // Update password if provided
      if (formData.newPassword) {
        await updateUserPassword(employee.id, formData.newPassword);
      }

      onClose();
    } catch (error: any) {
      alert(error.message || 'Ошибка при сохранении');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Редактировать сотрудника</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Avatar Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Фото профиля
            </label>
            <div className="flex items-center space-x-4">
              <div className="relative">
                {avatarPreview ? (
                  <div className="relative">
                    <img
                      src={avatarPreview}
                      alt="Предпросмотр аватара"
                      className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={removeAvatar}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center border-2 border-dashed border-gray-300">
                    <Upload className="h-8 w-8 text-gray-400" />
                  </div>
                )}
              </div>
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                  id="avatar-edit-upload"
                />
                <label
                  htmlFor="avatar-edit-upload"
                  className="cursor-pointer inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Изменить фото
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  JPG, PNG до 5MB
                </p>
              </div>
            </div>
          </div>

          {/* Имя и Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Полное имя *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>


          {/* Телефон и Telegram */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+7 (495) 123-45-67"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telegram</label>
              <input
                type="text"
                name="telegram"
                value={formData.telegram}
                onChange={handleChange}
                placeholder="@username"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Роль и отдел */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Роль *</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="photographer">Фотограф</option>
                <option value="designer">Дизайнер</option>
                <option value="admin">Администратор</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Отдел</label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Должность и зарплата */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Должность</label>
              <input
                type="text"
                name="position"
                value={formData.position}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Зарплата (руб.)</label>
              <input
                type="number"
                name="salary"
                value={formData.salary}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Новый пароль */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Новый пароль (оставьте пустым, если не хотите менять)
            </label>
            <input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Отмена</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function EmployeesList() {
  const { user, users, updateUser, deleteUser, dataLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [editingEmployee, setEditingEmployee] = useState<User | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [contactEmployee, setContactEmployee] = useState<User | null>(null);

  console.log('EmployeesList render - dataLoading:', dataLoading, 'users:', users);

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

  const handleEdit = (emp: User) => setEditingEmployee(emp);
  const handleSave = async (id: string, data: Partial<User>) => {
    await updateUser(id, data);
    setEditingEmployee(null);
  };
  const handleDelete = async (id: string) => {
    if (deleteConfirm === id) {
      await deleteUser(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const handleContact = (emp: User) => {
    setContactEmployee(emp);
  };

  const filteredEmployees = users.filter(emp =>
    (emp.name + emp.email + (emp.department || '')).toLowerCase().includes(searchTerm.toLowerCase()) &&
    (roleFilter === 'all' || emp.role === roleFilter)
  );

  if (dataLoading) {
    return (
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Загрузка сотрудников...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Сотрудники</h1>
            <p className="text-sm md:text-base text-gray-600 mt-1">Управление сотрудниками компании</p>
          </div>
          <Button size="sm" className="md:text-base">
            <Users className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Экспорт списка</span>
            <span className="sm:hidden">Экспорт</span>
          </Button>
        </div>

        {/* Фильтры */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Поиск сотрудников..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center space-x-2 sm:flex-shrink-0">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Все роли</option>
                  <option value="photographer">Фотографы</option>
                  <option value="designer">Дизайнеры</option>
                  <option value="admin">Администраторы</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Список */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
          {filteredEmployees.map((employee) => (
            <Card key={employee.id} className="hover:shadow-lg transition-all duration-200">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-start space-x-4">
                  <img
                    src={employee.avatar || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=60&h=60&fit=crop'}
                    alt={employee.name}
                    className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 truncate">{employee.name}</h3>
                        <p className="text-xs sm:text-sm text-gray-600">{employee.position || 'Не указана'}</p>
                        <p className="text-sm text-gray-500">{employee.department || 'Не указан'}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ml-2 whitespace-nowrap ${getRoleColor(employee.role)}`}>
                        {getRoleLabel(employee.role)}
                      </span>
                    </div>
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{employee.email}</span>
                      </div>
                      {employee.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span className="truncate">{employee.phone}</span>
                        </div>
                      )}
                      {employee.telegram && (
                        <div className="flex items-center text-sm text-gray-600">
                          <MessageCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span className="truncate">{employee.telegram}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          <span className="hidden sm:inline">Дата найма: </span>
                          <span className="sm:hidden">Найм: </span>
                          {employee.createdAt.toLocaleDateString('ru-RU')}
                        </span>
                        {employee.salary && (
                          <span className="font-medium text-gray-900">
                            {employee.salary.toLocaleString('ru-RU')} ₽
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 md:mt-4 flex flex-wrap gap-1 md:gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleContact(employee)}>
                        <Phone className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                        <span className="text-xs md:text-sm">Контакты</span>
                      </Button>
                      {user?.role === 'admin' && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handleEdit(employee)}>
                            <Edit className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                            <span className="hidden sm:inline text-xs md:text-sm">Редактировать</span>
                            <span className="sm:hidden text-xs">Ред.</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className={`${deleteConfirm === employee.id ? 'bg-red-500 text-white hover:bg-red-600' : 'text-red-600 hover:text-red-700'}`}
                            onClick={() => handleDelete(employee.id)}
                          >
                            <Trash2 className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                            <span className="text-xs md:text-sm">
                              {deleteConfirm === employee.id ? 'Подтвердить' : 'Удалить'}
                            </span>
                          </Button>
                        </>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          // Переходим в мессенджер и открываем чат с этим сотрудником
                          localStorage.setItem('messenger_open_chat', employee.id);
                          window.location.hash = '#messenger';
                          // Имитируем клик по вкладке мессенджер
                          const event = new CustomEvent('openMessengerChat', { detail: { userId: employee.id } });
                          window.dispatchEvent(event);
                        }}
                      >
                        <MessageCircle className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                        <span className="hidden sm:inline">Написать в чате</span>
                        <span className="sm:hidden text-xs">Чат</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Пусто */}
        {filteredEmployees.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-gray-400 mb-4">
                <Users className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Сотрудники не найдены</h3>
              <p className="text-gray-600">Попробуйте изменить параметры поиска или фильтрации</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Модалка */}
      {editingEmployee && (
        <EditEmployeeModal
          employee={editingEmployee}
          isOpen={!!editingEmployee}
          onClose={() => setEditingEmployee(null)}
          onSave={handleSave}
        />
      )}

      {/* Contact Modal */}
      {contactEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Связаться с сотрудником</h2>
              <button
                onClick={() => setContactEmployee(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center space-x-4 mb-6">
                <img
                  src={contactEmployee.avatar || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=60&h=60&fit=crop'}
                  alt={contactEmployee.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{contactEmployee.name}</h3>
                  <p className="text-gray-600">{contactEmployee.position || 'Не указана'}</p>
                  <p className="text-sm text-gray-500">{contactEmployee.department || 'Не указан'}</p>
                </div>
              </div>
              <div className="space-y-3">
                <a
                  href={`mailto:${contactEmployee.email}`}
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Mail className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900">Email</p>
                    <p className="text-sm text-gray-600">{contactEmployee.email}</p>
                  </div>
                </a>
                <a
                  href={`tel:+7${Math.floor(Math.random() * 9000000000) + 1000000000}`}
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Phone className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900">Телефон</p>
                    <p className="text-sm text-gray-600">{contactEmployee.phone || 'Не указан'}</p>
                  </div>
                </a>
                {contactEmployee.telegram && (
                  <a
                    href={`https://t.me/${contactEmployee.telegram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <MessageCircle className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900">Telegram</p>
                      <p className="text-sm text-gray-600">{contactEmployee.telegram}</p>
                    </div>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}