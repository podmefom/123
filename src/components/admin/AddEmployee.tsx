import React, { useState } from 'react';
import { UserPlus, Eye, EyeOff, Upload, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { useAuth } from '../../contexts/AuthContext';

export function AddEmployee() {
  const { user, addUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    telegram: '',
    password: '',
    role: 'photographer',
    department: '',
    position: '',
    salary: '',
    avatar: ''
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Размер файла не должен превышать 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setError('Можно загружать только изображения');
        return;
      }
      
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    setFormData(prev => ({ ...prev, avatar: '' }));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (user?.role !== 'admin') {
      alert('У вас нет прав для выполнения этого действия');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await addUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        telegram: formData.telegram,
        role: formData.role as 'photographer' | 'designer' | 'admin',
        department: formData.department,
        position: formData.position,
        salary: formData.salary ? parseInt(formData.salary) : undefined,
        avatar: avatarPreview || undefined
      });
      
      setLoading(false);
      setSuccess(true);
      setAvatarFile(null);
      setAvatarPreview(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        telegram: '',
        password: '',
        role: 'photographer',
        department: '',
        position: '',
        salary: '',
        avatar: ''
      });
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error adding employee:', err);
      setError(err?.message || 'Ошибка при создании сотрудника');
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (user?.role !== 'admin') {
    return (
      <div className="p-6">
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-red-500 mb-4">
              <UserPlus className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Доступ запрещен</h3>
            <p className="text-gray-600">
              Только администраторы могут добавлять новых сотрудников
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Добавить сотрудника</h1>
        <p className="text-gray-600 mt-1">
          Создайте новый аккаунт для сотрудника компании
        </p>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-green-600">
              <UserPlus className="h-5 w-5" />
            </div>
            <div className="ml-3">
              <p className="text-green-800 font-medium">Сотрудник успешно добавлен!</p>
              <p className="text-green-700 text-sm">Данные для входа отправлены на указанный email</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-600">
              <UserPlus className="h-5 w-5" />
            </div>
            <div className="ml-3">
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Информация о сотруднике</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
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
                      id="avatar-upload"
                    />
                    <label
                      htmlFor="avatar-upload"
                      className="cursor-pointer inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Выбрать фото
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      JPG, PNG до 5MB
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Полное имя *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email для входа *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Этот email будет использоваться для входа"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Телефон
                  </label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telegram
                  </label>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Пароль *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Роль *
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="photographer">Фотограф</option>
                    <option value="designer">Дизайнер</option>
                    <option value="admin">Администратор</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Отдел
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    placeholder="Например: Фотостудия, Дизайн"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Должность
                  </label>
                  <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                    placeholder="Например: Старший фотограф"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Зарплата (руб.)
                  </label>
                  <input
                    type="number"
                    name="salary"
                    value={formData.salary}
                    onChange={handleChange}
                    placeholder="50000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline">
                  Отмена
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Создание...' : 'Создать сотрудника'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
          <h4 className="font-medium text-blue-900 mb-3">Информация для входа:</h4>
          <div className="text-sm text-blue-700">
            <p>Сотрудники смогут войти в систему используя:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong>Email:</strong> тот который вы укажете в поле "Email для входа"</li>
              <li><strong>Пароль:</strong> тот который вы укажете в поле "Пароль"</li>
            </ul>
            <p className="mt-2 text-xs">Убедитесь, что сообщили сотруднику его данные для входа</p>
          </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}