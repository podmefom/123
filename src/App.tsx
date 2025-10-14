import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/auth/LoginForm';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Dashboard } from './components/dashboard/Dashboard';
import { ProjectsList } from './components/projects/ProjectsList';
import { UploadArea } from './components/upload/UploadArea';
import { AddEmployee } from './components/admin/AddEmployee';
import { EmployeesList } from './components/admin/EmployeesList';
import { SalaryManagement } from './components/admin/SalaryManagement';
import { Calendar } from './components/calendar/Calendar';
import Script from './components/script/Script';
import { Reports } from './components/reports/Reports';
import { ProjectDetail } from './components/projects/ProjectDetail';
import { Messenger } from './components/messenger/Messenger';

function AppContent() {
  const { isAuthenticated, loading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [messengerTargetUser, setMessengerTargetUser] = useState<string | null>(null);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Таймаут для загрузки
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setLoadingTimeout(true);
      }, 10000);
      return () => clearTimeout(timer);
    } else {
      setLoadingTimeout(false);
    }
  }, [loading]);

  // Слушаем события для открытия чата в мессенджере
  useEffect(() => {
    const handleOpenMessengerChat = (event: CustomEvent) => {
      setMessengerTargetUser(event.detail.userId);
      setActiveTab('messenger');
    };

    window.addEventListener('openMessengerChat', handleOpenMessengerChat as EventListener);

    // Проверяем localStorage на наличие запроса открыть чат
    const targetUserId = localStorage.getItem('messenger_open_chat');
    if (targetUserId) {
      setMessengerTargetUser(targetUserId);
      localStorage.removeItem('messenger_open_chat');
    }

    return () => {
      window.removeEventListener('openMessengerChat', handleOpenMessengerChat as EventListener);
    };
  }, []);

  if (loading) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 mb-4">Загрузка...</p>
          {loadingTimeout && (
            <div className="mt-4 space-y-2">
              <p className="text-amber-600 text-sm">Загрузка занимает слишком много времени</p>
              <button
                onClick={() => {
                  logout();
                  window.location.reload();
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Выйти и перезагрузить
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId);
    setActiveTab('project-detail');
  };

  const handleBackToProjects = () => {
    setSelectedProjectId(null);
    setActiveTab('projects');
  };
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'projects':
        return <ProjectsList onProjectSelect={handleProjectSelect} />;
      case 'project-detail':
        return selectedProjectId ? (
          <ProjectDetail 
            projectId={selectedProjectId} 
            onBack={handleBackToProjects}
          />
        ) : <ProjectsList onProjectSelect={handleProjectSelect} />;
      case 'reports':
        return <Reports />;
      case 'add-employee':
        return <AddEmployee />;
      case 'employees':
        return <EmployeesList />;
      case 'salary':
        return <SalaryManagement />;
      case 'calendar':
        return <Calendar />;
      case 'messenger':
        return <Messenger targetUserId={messengerTargetUser} onClearTarget={() => setMessengerTargetUser(null)} />;
      case 'script':
        return <Script />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col md:flex-row overflow-hidden">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 md:ml-0">
        <Header />
        <main className="flex-1 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;