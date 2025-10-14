import React, { useState, useEffect } from 'react';
import { FileText, Upload, Download, Eye, Trash2, X, Plus, Search } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase.ts';

interface Report {
  id: string;
  title: string;
  description: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: Date;
  fileUrl?: string;
  filePath?: string;
}

interface UploadReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (report: Omit<Report, 'id' | 'uploadedAt'> & { file: File }) => void;
}

function UploadReportModal({ isOpen, onClose, onUpload }: UploadReportModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    file: null as File | null
  });
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
          file.type === 'application/msword' || 
          file.type === 'text/plain') {
        setFormData(prev => ({ ...prev, file }));
      } else {
        alert('Поддерживаются только файлы Word (.doc, .docx) и текстовые файлы (.txt)');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
          file.type === 'application/msword' || 
          file.type === 'text/plain') {
        setFormData(prev => ({ ...prev, file }));
      } else {
        alert('Поддерживаются только файлы Word (.doc, .docx) и текстовые файлы (.txt)');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.file || !formData.title.trim() || !user) return;

    setIsUploading(true);

    try {
      const report: Omit<Report, 'id' | 'uploadedAt'> = {
        title: formData.title,
        description: formData.description,
        fileName: formData.file.name,
        fileType: formData.file.type,
        fileSize: formData.file.size,
        uploadedBy: user.id,
        uploadedByName: user.name || user.email || 'Неизвестный',
      };

      onUpload({
        ...report,
        file: formData.file
      });

      setFormData({ title: '', description: '', file: null });
      onClose();
    } catch (error) {
      console.error('Ошибка при загрузке:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Загрузить отчет</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isUploading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Название отчета *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Например: Отчет по проекту за февраль 2024"
              required
              disabled={isUploading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Описание
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Краткое описание содержания отчета"
              disabled={isUploading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Файл отчета *
            </label>
            <div
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept=".doc,.docx,.txt"
                disabled={isUploading}
              />
              
              {formData.file ? (
                <div className="space-y-2">
                  <FileText className="h-12 w-12 text-green-600 mx-auto" />
                  <div>
                    <p className="font-medium text-gray-900">{formData.file.name}</p>
                    <p className="text-sm text-gray-500">{formatFileSize(formData.file.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, file: null }))}
                    className="text-red-600 hover:text-red-700 text-sm"
                    disabled={isUploading}
                  >
                    Удалить файл
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <div className="bg-blue-100 p-4 rounded-full">
                      <Upload className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Перетащите файл сюда или нажмите для выбора
                    </h3>
                    <p className="text-gray-600 mt-1">
                      Поддерживаются файлы Word (.doc, .docx) и текстовые файлы (.txt)
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isUploading}
            >
              Отмена
            </Button>
            <Button 
              type="submit" 
              disabled={!formData.file || !formData.title.trim() || isUploading}
            >
              {isUploading ? 'Загрузка...' : 'Загрузить отчет'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function Reports() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('reports')
        .select(`
          id, 
          title, 
          description, 
          report_type,
          created_by, 
          created_at,
          data
        `)
        .order('created_at', { ascending: false });
  
      if (error) {
        console.error('Ошибка при загрузке отчетов:', error);
        return;
      }
  
      const formattedReports: Report[] = data.map((report: any) => ({
        id: report.id,
        title: report.title,
        description: report.description || '',
        fileName: report.data?.fileName || 'Неизвестный файл',
        fileType: report.data?.fileType || 'application/octet-stream',
        fileSize: report.data?.fileSize || 0,
        uploadedBy: report.created_by,
        uploadedByName: report.data?.uploadedByName || 'Неизвестный',
        uploadedAt: new Date(report.created_at),
        fileUrl: report.data?.fileUrl,
        filePath: report.data?.filePath
      }));
  
      setReports(formattedReports);
    } catch (error) {
      console.error('Ошибка:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadReport = async (reportData: Omit<Report, 'id' | 'uploadedAt'> & { file: File }) => {
    try {
      console.log('Starting file upload...');
  
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        throw new Error('Пользователь не аутентифицирован');
      }
  
      console.log('User:', currentUser.id);
  
      // Загрузка файла
      const fileName = `${currentUser.id}/${Date.now()}_${reportData.fileName.replace(/\s+/g, '_')}`;
      
      console.log('Uploading to path:', fileName);
  
      const { error: uploadError } = await supabase.storage
        .from('reports')
        .upload(fileName, reportData.file);
  
      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw uploadError;
      }
  
      console.log('File uploaded successfully');
  
      // Получаем URL
      const { data: publicUrlData } = supabase.storage
        .from('reports')
        .getPublicUrl(fileName);
  
      console.log('Public URL:', publicUrlData.publicUrl);
  
      // Сохраняем в БД с правильным report_type
      const { data, error: dbError } = await supabase
        .from('reports')
        .insert([{
          title: reportData.title,
          description: reportData.description,
          report_type: 'document', // Используем значение по умолчанию
          created_by: currentUser.id,
          data: {
            fileName: reportData.fileName,
            fileType: reportData.fileType,
            fileSize: reportData.fileSize,
            fileUrl: publicUrlData.publicUrl,
            filePath: fileName,
            uploadedByName: reportData.uploadedByName
          }
        }])
        .select();
  
      if (dbError) {
        console.error('Database error:', dbError);
        throw dbError;
      }
  
      console.log('Database record created:', data);
  
      await fetchReports();
  
      console.log('Upload completed successfully');
  
    } catch (err) {
      console.error('Full upload error:', err);
      throw err;
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      const report = reports.find(r => r.id === reportId);
      
      if (!report) return;

      // Удаляем файл из storage если есть filePath
      if (report.filePath) {
        const { error: storageError } = await supabase.storage
          .from('reports')
          .remove([report.filePath!]);

        if (storageError) {
          console.error('Ошибка удаления файла:', storageError);
        }
      }

      // Удаляем запись из БД
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;

      // Обновляем локальное состояние
      setReports(prev => prev.filter(r => r.id !== reportId));

    } catch (error) {
      console.error('Ошибка при удалении отчета:', error);
    }
  };

  const handleDownloadReport = async (report: Report) => {
    try {
      if (!report.filePath) {
        alert('Файл не доступен для скачивания');
        return;
      }
  
      console.log('Starting download for:', report.filePath);
  
      // Скачиваем файл как blob - это гарантирует скачивание
      const { data, error } = await supabase.storage
        .from('reports')
        .download(report.filePath);
  
      if (error) {
        console.error('Download error:', error);
        throw new Error(`Ошибка загрузки: ${error.message}`);
      }
  
      // Создаем blob URL из полученных данных
      const blob = new Blob([data], { type: report.fileType || 'application/octet-stream' });
      const blobUrl = URL.createObjectURL(blob);
      
      // Создаем скрытую ссылку для скачивания
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = report.fileName; // Важнейший параметр - заставляет скачивать
      
      // Дополнительные атрибуты для надежности
      link.setAttribute('download', report.fileName);
      link.setAttribute('type', 'application/octet-stream');
      link.style.display = 'none';
      link.target = '_blank';
      
      // Добавляем в DOM и кликаем
      document.body.appendChild(link);
      link.click();
      
      // Убираем ссылку и очищаем URL
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
  
      console.log('File downloaded successfully:', report.fileName);
  
    } catch (error) {
      console.error('Full download error:', error);
      
      // Fallback: пробуем через signed URL если blob не сработал
      try {
        console.log('Trying fallback with signed URL...');
        
        const { data: signedData, error: signedError } = await supabase.storage
          .from('reports')
          .createSignedUrl(report.filePath, 60, {
            download: report.fileName
          });
  
        if (signedError) {
          console.error('Signed URL error:', signedError);
          throw new Error(`Signed URL failed: ${signedError.message}`);
        }
  
        // Открываем signed URL в новой вкладке
        window.open(signedData.signedUrl, '_blank');
        console.log('Opened via signed URL');
  
      } catch (signedError) {
        console.error('All download methods failed:', signedError);
        alert('Не удалось скачать файл. Попробуйте позже или обратитесь к администратору.');
      }
    }
  };

  const canViewReport = (report: Report): boolean => {
    if (user?.role === 'admin') return true;
    return user?.id === report.uploadedBy;
  };

  const canDeleteReport = (report: Report): boolean => {
    if (user?.role === 'admin') return true;
    return user?.id === report.uploadedBy;
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.uploadedByName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch && canViewReport(report);
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('word') || fileType.includes('document')) {
      return <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
        <FileText className="h-6 w-6 text-blue-600" />
      </div>;
    }
    return <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
      <FileText className="h-6 w-6 text-gray-600" />
    </div>;
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-64">
        <div className="text-lg text-gray-600">Загрузка отчетов...</div>
      </div>
    );
  }

  return (
    <>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Отчеты сотрудников</h1>
            <p className="text-gray-600 mt-1">
              {user?.role === 'admin' 
                ? 'Просматривайте отчеты всех сотрудников' 
                : 'Загружайте и управляйте своими отчетами'
              }
            </p>
          </div>
          <Button onClick={() => setShowUploadModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Загрузить отчет
          </Button>
        </div>

        {/* Поиск */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск отчетов..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </CardContent>
        </Card>

        {/* Список отчетов */}
        <div className="space-y-4">
          {filteredReports.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <div className="text-gray-400 mb-4">
                  <FileText className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? 'Отчеты не найдены' : 'Нет отчетов'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm 
                    ? 'Попробуйте изменить параметры поиска'
                    : 'Загрузите первый отчет, чтобы начать работу'
                  }
                </p>
                {!searchTerm && (
                  <Button onClick={() => setShowUploadModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Загрузить первый отчет
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredReports.map((report) => (
              <Card key={report.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {getFileIcon(report.fileType)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {report.title}
                          </h3>
                          {report.description && (
                            <p className="text-gray-600 mb-2">{report.description}</p>
                          )}
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>Файл: {report.fileName}</span>
                            <span>Размер: {formatFileSize(report.fileSize)}</span>
                            <span>Автор: {report.uploadedByName}</span>
                            <span>Дата: {report.uploadedAt.toLocaleDateString('ru-RU')}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDownloadReport(report)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Скачать
                          </Button>
                          
                          {canDeleteReport(report) && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteReport(report.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <UploadReportModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={handleUploadReport}
      />
    </>
  );
}