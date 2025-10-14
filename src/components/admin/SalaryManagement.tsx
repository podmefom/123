import React, { useState, useEffect } from 'react';
import { DollarSign, Search, Filter, Calendar, MessageCircle, Phone, Mail, X, Calculator, FileText, Plus, Eye } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { useAuth } from '../../contexts/AuthContext';

interface SalaryCalculation {
  id: string;
  employeeId: string;
  employeeName: string;
  role: string;
  department: string;
  projectType: 'individual' | 'kindergarten' | 'collective_11' | 'collective_9' | 'collective_4';
  infoCollectionPercent: number;
  photosProcessed: boolean;
  revisionsApproved: boolean;
  magazinesPrinted: boolean;
  deadlinesMet: boolean;
  krMagazines: number;
  calculatedSalary: number;
  paymentStages: {
    infoCollection: number;
    photosProcessed: number;
    revisionsApproved: number;
    magazinesPrinted: number;
  };
  month: string;
}

interface SalaryCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (calculation: Omit<SalaryCalculation, 'id'>) => void;
  employee?: any;
}

function SalaryCalculatorModal({ isOpen, onClose, onSave, employee }: SalaryCalculatorModalProps) {
  const [formData, setFormData] = useState({
    projectType: 'individual' as SalaryCalculation['projectType'],
    infoCollectionPercent: 0,
    photosProcessed: false,
    revisionsApproved: false,
    magazinesPrinted: false,
    deadlinesMet: true,
    krMagazines: 0,
    month: new Date().toISOString().slice(0, 7)
  });

  const calculateSalary = () => {
    const baseRates = {
      individual: { base: 210, bonus: 90 },
      kindergarten: { base: 210, bonus: 90 },
      collective_11: { base: 175, bonus: 75 },
      collective_9: { base: 175, bonus: 75 },
      collective_4: { base: 175, bonus: 75 }
    };

    const rate = baseRates[formData.projectType];
    const infoFactor = (100 - formData.infoCollectionPercent) / 1.5;
    let bonus = rate.bonus;
    
    // Штраф за несоблюдение дедлайнов
    if (!formData.deadlinesMet) {
      bonus *= 0.5;
    }

    const baseSalary = rate.base * (1 - infoFactor / 100) + bonus;
    const krBonus = formData.krMagazines * 200;
    
    return baseSalary + krBonus;
  };

  const calculatePaymentStages = (totalSalary: number) => {
    return {
      infoCollection: totalSalary * 0.35,
      photosProcessed: totalSalary * 0.30,
      revisionsApproved: totalSalary * 0.20,
      magazinesPrinted: totalSalary * 0.15
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const calculatedSalary = calculateSalary();
    const paymentStages = calculatePaymentStages(calculatedSalary);

    const calculation: Omit<SalaryCalculation, 'id'> = {
      employeeId: employee.id,
      employeeName: employee.name,
      role: employee.role,
      department: employee.department || 'Не указан',
      ...formData,
      calculatedSalary,
      paymentStages
    };

    onSave(calculation);
    onClose();
  };

  if (!isOpen || !employee) return null;

  const currentSalary = calculateSalary();
  const stages = calculatePaymentStages(currentSalary);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Расчет зарплаты - {employee.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Тип проекта</label>
              <select
                value={formData.projectType}
                onChange={(e) => setFormData(prev => ({ ...prev, projectType: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="individual">Индивидуальный концепт</option>
                <option value="kindergarten">Детский сад</option>
                <option value="collective_11">Коллективный "11"</option>
                <option value="collective_9">Коллективный "9"</option>
                <option value="collective_4">Коллективный "4"</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Месяц</label>
              <input
                type="month"
                value={formData.month}
                onChange={(e) => setFormData(prev => ({ ...prev, month: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Процент собранной информации (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={formData.infoCollectionPercent}
              onChange={(e) => setFormData(prev => ({ ...prev, infoCollectionPercent: Number(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Количество журналов КР
            </label>
            <input
              type="number"
              min="0"
              value={formData.krMagazines}
              onChange={(e) => setFormData(prev => ({ ...prev, krMagazines: Number(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">Этапы выполнения</h3>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.photosProcessed}
                onChange={(e) => setFormData(prev => ({ ...prev, photosProcessed: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Обработанные фотографии скинуты</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.revisionsApproved}
                onChange={(e) => setFormData(prev => ({ ...prev, revisionsApproved: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Правки согласованы</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.magazinesPrinted}
                onChange={(e) => setFormData(prev => ({ ...prev, magazinesPrinted: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Журналы напечатаны</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.deadlinesMet}
                onChange={(e) => setFormData(prev => ({ ...prev, deadlinesMet: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Все дедлайны соблюдены</span>
            </label>
          </div>

          {/* Предварительный расчет */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-3">Предварительный расчет</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Общая сумма:</span>
                <span className="font-medium">{currentSalary.toFixed(2)} ₽</span>
              </div>
              <div className="border-t border-blue-200 pt-2 mt-2">
                <div className="flex justify-between">
                  <span>За сбор информации (35%):</span>
                  <span>{stages.infoCollection.toFixed(2)} ₽</span>
                </div>
                <div className="flex justify-between">
                  <span>За обработанные фото (30%):</span>
                  <span>{stages.photosProcessed.toFixed(2)} ₽</span>
                </div>
                <div className="flex justify-between">
                  <span>После согласования правок (20%):</span>
                  <span>{stages.revisionsApproved.toFixed(2)} ₽</span>
                </div>
                <div className="flex justify-between">
                  <span>После печати журналов (15%):</span>
                  <span>{stages.magazinesPrinted.toFixed(2)} ₽</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={onClose}>Отмена</Button>
            <Button type="submit">Сохранить расчет</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function SalaryManagement() {
  const { user, users } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('2024-02');
  const [showCalculator, setShowCalculator] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [salaryCalculations, setSalaryCalculations] = useState<SalaryCalculation[]>([]);

  // Загружаем расчеты зарплат из localStorage
  useEffect(() => {
    const savedCalculations = localStorage.getItem('salary_calculations');
    if (savedCalculations) {
      try {
        setSalaryCalculations(JSON.parse(savedCalculations));
      } catch (error) {
        console.error('Ошибка при загрузке расчетов зарплат:', error);
      }
    }
  }, []);

  // Сохраняем расчеты в localStorage при изменении
  useEffect(() => {
    if (salaryCalculations.length > 0) {
      localStorage.setItem('salary_calculations', JSON.stringify(salaryCalculations));
    }
  }, [salaryCalculations]);

  const handleSaveCalculation = (calculation: Omit<SalaryCalculation, 'id'>) => {
    const newCalculation: SalaryCalculation = {
      ...calculation,
      id: Math.random().toString(36).substr(2, 9)
    };
    setSalaryCalculations(prev => {
      const updated = [...prev, newCalculation];
      localStorage.setItem('salary_calculations', JSON.stringify(updated));
      return updated;
    });
  };

  const filteredCalculations = salaryCalculations.filter(calc => {
    const matchesSearch = calc.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         calc.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMonth = calc.month === selectedMonth;
    return matchesSearch && matchesMonth;
  });

  const totalSalaries = filteredCalculations.reduce((sum, calc) => sum + calc.calculatedSalary, 0);

  const getProjectTypeLabel = (type: string) => {
    const labels = {
      individual: 'Индивидуальный концепт',
      kindergarten: 'Детский сад',
      collective_11: 'Коллективный "11"',
      collective_9: 'Коллективный "9"',
      collective_4: 'Коллективный "4"'
    };
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Зарплаты сотрудников</h1>
            <p className="text-gray-600 mt-1">Динамический расчет зарплат по проектам</p>
          </div>
          {user?.role === 'admin' && (
            <div className="flex space-x-3">
              <Button onClick={() => setShowCalculator(true)}>
                <Calculator className="h-4 w-4 mr-2" />
                Рассчитать зарплату
              </Button>
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Экспорт отчета
              </Button>
            </div>
          )}
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Общая сумма</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {totalSalaries.toLocaleString('ru-RU')} ₽
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                  <DollarSign className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Расчетов</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{filteredCalculations.length}</p>
                </div>
                <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
                  <Calculator className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Информация о расчете зарплат */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calculator className="h-5 w-5 mr-2 text-blue-600" />
              Система расчета зарплат
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Разделение зарплаты */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Разделение зарплаты:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Выплата за сбор информации</span>
                      <span className="font-semibold text-blue-700">35%</span>
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Выплата в момент скидывания обработанных фотографий</span>
                      <span className="font-semibold text-green-700">30%</span>
                    </div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Выплата после согласования правок</span>
                      <span className="font-semibold text-yellow-700">20%</span>
                    </div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Выплата после печати журналов</span>
                      <span className="font-semibold text-purple-700">15%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Формулы расчета */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Формулы расчета зарплаты менеджера:</h3>
                <div className="space-y-3">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Индивидуальный концепт и Детский сад:</h4>
                    <code className="text-sm text-gray-700 bg-white px-2 py-1 rounded">
                      210 × (1 – (100% – Процент собранной инфы) / 1.5) + 90¹
                    </code>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Коллективный "11", "9", "4":</h4>
                    <code className="text-sm text-gray-700 bg-white px-2 py-1 rounded">
                      175 × (1 – (100% – Процент собранной инфы) / 1.5) + 75¹
                    </code>
                  </div>
                </div>
              </div>

              {/* Условия и штрафы */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Условия выплат:</h3>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="text-red-600 mr-3 mt-0.5">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-red-900 mb-2">Штрафы за несоблюдение дедлайнов:</h4>
                      <p className="text-sm text-red-800 mb-3">
                        ¹ зависит от соблюдения дедлайнов по скидыванию исходников, сбору номеров фото, 
                        скидыванию обработанных фото, получению отзывов, разделению по группам, 
                        бронированию студии и прочее.
                      </p>
                      <p className="text-sm text-red-800 font-medium">
                        За несоблюдение сроков любой задачи, которая связана со сбором какой-либо информации, 
                        нужной для журнала, из второго слагаемого формулы будет вычитаться 50%.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Дополнительные выплаты */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Дополнительные выплаты:</h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="text-green-600 mr-3">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-medium text-green-900">Оплата за журнал КР:</h4>
                      <p className="text-sm text-green-800">
                        200 рублей за журнал. Если в классе журналов несколько, 
                        то 200 рублей умножается на количество журналов КР.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Фильтры */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Поиск сотрудников..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Таблица расчетов */}
        <Card>
          <CardHeader>
            <CardTitle>
              Расчеты зарплат за {new Date(selectedMonth + '-01').toLocaleDateString('ru-RU', { year: 'numeric', month: 'long' })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredCalculations.length === 0 ? (
              <div className="text-center py-8">
                <Calculator className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-3">Нет расчетов за выбранный период</p>
                {user?.role === 'admin' && (
                  <Button onClick={() => setShowCalculator(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Создать первый расчет
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Сотрудник</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Тип проекта</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Прогресс</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">Зарплата</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCalculations.map((calc) => (
                      <tr key={calc.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{calc.employeeName}</p>
                            <p className="text-sm text-gray-500">{calc.department}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            {getProjectTypeLabel(calc.projectType)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center text-xs">
                              <div className={`w-2 h-2 rounded-full mr-2 ${calc.infoCollectionPercent > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                              Информация: {calc.infoCollectionPercent}%
                            </div>
                            <div className="flex items-center text-xs">
                              <div className={`w-2 h-2 rounded-full mr-2 ${calc.photosProcessed ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                              Фото обработаны
                            </div>
                            <div className="flex items-center text-xs">
                              <div className={`w-2 h-2 rounded-full mr-2 ${calc.revisionsApproved ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                              Правки согласованы
                            </div>
                            <div className="flex items-center text-xs">
                              <div className={`w-2 h-2 rounded-full mr-2 ${calc.magazinesPrinted ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                              Журналы напечатаны
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div>
                            <p className="font-medium text-gray-900">
                              {calc.calculatedSalary.toLocaleString('ru-RU')} ₽
                            </p>
                            {calc.krMagazines > 0 && (
                              <p className="text-xs text-gray-500">
                                +{calc.krMagazines} КР журналов
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            Детали
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Calculator Modal */}
      {showCalculator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Выберите сотрудника</h2>
              <button
                onClick={() => setShowCalculator(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {users.map(employee => (
                  <button
                    key={employee.id}
                    onClick={() => {
                      setSelectedEmployee(employee);
                      setShowCalculator(false);
                    }}
                    className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <p className="font-medium text-gray-900">{employee.name}</p>
                    <p className="text-sm text-gray-500">{employee.department || 'Не указан'}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Salary Calculator Modal */}
      <SalaryCalculatorModal
        isOpen={!!selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
        onSave={handleSaveCalculation}
        employee={selectedEmployee}
      />
    </>
  );
}