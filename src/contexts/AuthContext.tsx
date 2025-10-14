import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useSupabaseAuth, Profile } from '../hooks/useSupabaseAuth';
import { supabase } from '../lib/supabase';
import { Project, ProjectFile } from '../types/user';

interface AuthContextType {
  user: Profile | null;
  users: Profile[];
  projects: Project[];
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (userData: Omit<Profile, 'id' | 'created_at' | 'updated_at'> & { password: string }) => Promise<boolean>;
  addUser: (userData: Omit<Profile, 'id' | 'created_at' | 'updated_at'> & { password: string }) => Promise<void>;
  updateUser: (id: string, userData: Partial<Profile>) => Promise<void>;
  updateUserPassword: (userId: string, password: string) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  addProject: (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProject: (id: string, projectData: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addFileToProject: (projectId: string, file: Omit<ProjectFile, 'id' | 'uploadedAt'>) => Promise<void>;
  removeFileFromProject: (projectId: string, fileId: string) => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
  dataLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user: supabaseUser, profile, loading, signIn, signOut, signUp } = useSupabaseAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      await signIn(email, password);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    await signOut();
  };

  const register = async (userData: Omit<Profile, 'id' | 'created_at' | 'updated_at'> & { password: string }): Promise<boolean> => {
    try {
      await signUp(userData.email, userData.password, {
        name: userData.name,
        role: userData.role,
        department: userData.department || undefined,
        position: userData.position || undefined,
        salary: userData.salary || undefined,
        phone: userData.phone || undefined,
        telegram: userData.telegram || undefined,
      });
      return true;
    } catch (error) {
      console.error('Register error:', error);
      return false;
    }
  };

  const addUser = async (userData: Omit<Profile, 'id' | 'created_at' | 'updated_at'> & { password: string }): Promise<void> => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('Not authenticated');
    }

    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create user');
    }

    await fetchUsers();
  };

  const updateUser = async (id: string, userData: Partial<Profile>): Promise<void> => {
    const { error } = await supabase
      .from('profiles')
      .update(userData)
      .eq('id', id);

    if (error) {
      throw error;
    }
    
    await fetchUsers();
  };

  const updateUserPassword = async (userId: string, password: string): Promise<void> => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('Not authenticated');
    }

    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-user-password`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update password');
    }
  };

  const deleteUser = async (id: string): Promise<void> => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('Not authenticated');
    }

    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user/${id}`;

    const response = await fetch(apiUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete user');
    }

    await fetchUsers();
  };

  const fetchUsers = async () => {
    try {
      console.log('Fetching users...');
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        setUsers([]);
      } else {
        console.log('Users fetched:', data);
        const transformedUsers = (data || []).map((user: any) => ({
          ...user,
          createdAt: new Date(user.created_at),
          updatedAt: new Date(user.updated_at)
        }));
        setUsers(transformedUsers);
      }
    } catch (err) {
      console.error('Exception fetching users:', err);
      setUsers([]);
    }
  };

  const fetchProjects = async () => {
    try {
      console.log('Fetching projects...');
      
      // Сначала получаем базовую информацию о проектах
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select(`
          *,
          manager:profiles!projects_manager_id_fkey(*)
        `)
        .order('created_at', { ascending: false });
  
      if (projectsError) {
        console.error('Error fetching projects:', projectsError);
        setProjects([]);
        return;
      }
  
      // Затем отдельно получаем members и files для каждого проекта
      const projectsWithDetails = await Promise.all(
        (projectsData || []).map(async (project: any) => {
          // Получаем members для проекта
          const { data: membersData } = await supabase
            .from('project_members')
            .select(`
              user_id,
              role,
              profiles(*)
            `)
            .eq('project_id', project.id);
  
          // Получаем files для проекта
          const { data: filesData } = await supabase
            .from('project_files')
            .select('*')
            .eq('project_id', project.id);
  
          // Трансформируем данные
          return {
            id: project.id,
            title: project.title,
            albumType: project.album_type,
            description: project.description,
            status: project.status,
            manager: project.manager,
            photographers: membersData
              ?.filter((m: any) => m.role === 'photographer')
              ?.map((m: any) => m.profiles) || [],
            designers: membersData
              ?.filter((m: any) => m.role === 'designer')
              ?.map((m: any) => m.profiles) || [],
            deadline: new Date(project.deadline),
            createdAt: new Date(project.created_at),
            updatedAt: new Date(project.updated_at),
            photosCount: filesData?.filter((f: any) => 
              f.file_type.startsWith('image/')
            ).length || 0,
            designsCount: filesData?.filter((f: any) =>
              f.file_type.includes('design') ||
              f.name.toLowerCase().includes('макет') ||
              f.name.toLowerCase().includes('design')
            ).length || 0,
            files: filesData?.map((file: any) => ({
              id: file.id,
              name: file.name,
              type: file.file_type,
              size: file.file_size,
              preview: file.preview_url,
              uploadedBy: users.find(u => u.id === file.uploaded_by) || { name: 'Unknown' },
              uploadedAt: new Date(file.uploaded_at)
            })) || []
          };
        })
      );
  
      console.log('Projects fetched:', projectsWithDetails);
      setProjects(projectsWithDetails);
  
    } catch (err) {
      console.error('Exception fetching projects:', err);
      setProjects([]);
    }
  };
  

// Fetch data when user changes
  React.useEffect(() => {
    if (profile) {
      setDataLoading(true);
      
      // Загружаем пользователей сначала
      fetchUsers().then(() => {
        // Затем загружаем проекты после того как users загружены
        fetchProjects().finally(() => setDataLoading(false));
      });
    }
  }, [profile]);

  const addProject = async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        title: projectData.title,
        album_type: projectData.albumType,
        description: projectData.description,
        status: projectData.status,
        manager_id: projectData.manager?.id,
        deadline: projectData.deadline.toISOString().split('T')[0]
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Add project members
    const members = [
      ...projectData.photographers.map(p => ({ project_id: project.id, user_id: p.id, role: 'photographer' as const })),
      ...projectData.designers.map(d => ({ project_id: project.id, user_id: d.id, role: 'designer' as const }))
    ];

    if (members.length > 0) {
      const { error: membersError } = await supabase
        .from('project_members')
        .insert(members);

      if (membersError) {
        throw membersError;
      }
    }

    await fetchProjects();
  };

  const updateProject = async (id: string, projectData: Partial<Project>): Promise<void> => {
    const updateData: any = {};
    
    if (projectData.title) updateData.title = projectData.title;
    if (projectData.albumType) updateData.album_type = projectData.albumType;
    if (projectData.description !== undefined) updateData.description = projectData.description;
    if (projectData.status) updateData.status = projectData.status;
    if (projectData.manager) updateData.manager_id = projectData.manager.id;
    if (projectData.deadline) updateData.deadline = projectData.deadline.toISOString().split('T')[0];

    const { error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', id);

    if (error) {
      throw error;
    }

    // Update project members if provided
    if (projectData.photographers || projectData.designers) {
      // Remove existing members
      await supabase
        .from('project_members')
        .delete()
        .eq('project_id', id);

      // Add new members
      const members = [
        ...(projectData.photographers || []).map(p => ({ project_id: id, user_id: p.id, role: 'photographer' as const })),
        ...(projectData.designers || []).map(d => ({ project_id: id, user_id: d.id, role: 'designer' as const }))
      ];

      if (members.length > 0) {
        const { error: membersError } = await supabase
          .from('project_members')
          .insert(members);

        if (membersError) {
          throw membersError;
        }
      }
    }

    await fetchProjects();
  };

  const deleteProject = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    await fetchProjects();
  };

  const addFileToProject = async (projectId: string, fileData: Omit<ProjectFile, 'id' | 'uploadedAt'>): Promise<void> => {
    const { error } = await supabase
      .from('project_files')
      .insert({
        project_id: projectId,
        name: fileData.name,
        file_type: fileData.type,
        file_size: fileData.size,
        preview_url: fileData.preview,
        file_url: fileData.preview || '#', // In a real app, you'd upload to storage
        uploaded_by: profile?.id
      });

    if (error) {
      throw error;
    }

    await fetchProjects();
  };

  const removeFileFromProject = async (projectId: string, fileId: string): Promise<void> => {
    const { error } = await supabase
      .from('project_files')
      .delete()
      .eq('id', fileId);

    if (error) {
      throw error;
    }

    await fetchProjects();
  };

  // Legacy methods for backward compatibility
  const legacyAddProject = async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
    const newProject: Project = {
      ...projectData,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      updatedAt: new Date(),
      photosCount: 0,
      designsCount: 0,
      files: []
    };
    setProjects(prev => {
      const updatedProjects = [...prev, newProject];
      localStorage.setItem('projects', JSON.stringify(updatedProjects));
      return updatedProjects;
    });
  };

  const legacyUpdateProject = async (id: string, projectData: Partial<Project>): Promise<void> => {
    setProjects(prev => {
      const updatedProjects = prev.map(p => 
        p.id === id 
          ? { 
              ...p, 
              ...projectData, 
              updatedAt: new Date(),
              photosCount: projectData.files ? projectData.files.filter(f => f.type.startsWith('image/')).length : p.photosCount,
              designsCount: projectData.files ? projectData.files.filter(f => f.type.includes('design') || f.name.toLowerCase().includes('макет') || f.name.toLowerCase().includes('design')).length : p.designsCount
            }
          : p
      );
      localStorage.setItem('projects', JSON.stringify(updatedProjects));
      return updatedProjects;
    });
  };

  const legacyDeleteProject = async (id: string): Promise<void> => {
    setProjects(prev => {
      const updatedProjects = prev.filter(p => p.id !== id);
      localStorage.setItem('projects', JSON.stringify(updatedProjects));
      return updatedProjects;
    });
  };

  const legacyAddFileToProject = async (projectId: string, fileData: Omit<ProjectFile, 'id' | 'uploadedAt'>): Promise<void> => {
    const newFile: ProjectFile = {
      ...fileData,
      id: Math.random().toString(36).substr(2, 9),
      uploadedAt: new Date()
    };

    setProjects(prev => {
      const updatedProjects = prev.map(p => {
        if (p.id === projectId) {
          const updatedFiles = [...p.files, newFile];
          return {
            ...p,
            files: updatedFiles,
            photosCount: updatedFiles.filter(f => f.type.startsWith('image/')).length,
            designsCount: updatedFiles.filter(f => f.type.includes('design') || f.name.toLowerCase().includes('макет') || f.name.toLowerCase().includes('design')).length,
            updatedAt: new Date()
          };
        }
        return p;
      });
      localStorage.setItem('projects', JSON.stringify(updatedProjects));
      return updatedProjects;
    });
  };

  const legacyRemoveFileFromProject = async (projectId: string, fileId: string): Promise<void> => {
    setProjects(prev => {
      const updatedProjects = prev.map(p => {
        if (p.id === projectId) {
          const updatedFiles = p.files.filter(f => f.id !== fileId);
          return {
            ...p,
            files: updatedFiles,
            photosCount: updatedFiles.filter(f => f.type.startsWith('image/')).length,
            designsCount: updatedFiles.filter(f => f.type.includes('design') || f.name.toLowerCase().includes('макет') || f.name.toLowerCase().includes('design')).length,
            updatedAt: new Date()
          };
        }
        return p;
      });
      localStorage.setItem('projects', JSON.stringify(updatedProjects));
      return updatedProjects;
    });
  };

  const value: AuthContextType = {
    user: profile,
    users,
    projects,
    login,
    logout,
    register,
    addUser,
    updateUser,
    updateUserPassword,
    deleteUser,
    addProject: profile ? addProject : legacyAddProject,
    updateProject: profile ? updateProject : legacyUpdateProject,
    deleteProject: profile ? deleteProject : legacyDeleteProject,
    addFileToProject: profile ? addFileToProject : legacyAddFileToProject,
    removeFileFromProject: profile ? removeFileFromProject : legacyRemoveFileFromProject,
    isAuthenticated: !!profile,
    loading,
    dataLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};