import React, { useState, useEffect } from 'react';
import { Search, Plus, User, Mail, Shield, ShieldCheck, Edit, Trash2 } from 'lucide-react';
import { User as UserType } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { TableSkeleton, UserCardSkeleton } from './SkeletonLoader';
import ConfirmDialog from './ConfirmDialog';
import EmptyState from './EmptyState';

// Mock data
const mockUsers: UserType[] = [
  {
    id: '1',
    name: 'Admin Geoteste',
    email: 'admin@geoteste.com',
    role: 'admin',
    createdAt: '2025-01-01'
  },
  {
    id: '2',
    name: 'João Silva',
    email: 'joao@geoteste.com',
    role: 'user',
    createdAt: '2025-01-02'
  },
  {
    id: '3',
    name: 'Ana Costa',
    email: 'ana@geoteste.com',
    role: 'user',
    createdAt: '2025-01-03'
  },
];

export const UsersManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState<UserType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    userId: string | null;
    userName: string | null;
  }>({ isOpen: false, userId: null, userName: null });
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user' as 'admin' | 'user',
    password: ''
  });

  // Buscar usuários do Supabase
  useEffect(() => {
    const fetchUsers = async () => {
      if (!isSupabaseConfigured) {
        setUsers(mockUsers);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        const mappedUsers: UserType[] = (data || []).map((profile: any) => {
          const email: string = profile.email || '';
          const fallbackFromEmail = email ? (email.split('@')[0] as string) : '';
          const displayName = profile.full_name || profile.name || fallbackFromEmail || 'Nome não informado';
          return {
            id: profile.id,
            name: displayName,
            email: email || 'email@exemplo.com',
            role: profile.role || 'user',
            createdAt: profile.created_at || new Date().toISOString()
          };
        });

        setUsers(mappedUsers);
      } catch (err: any) {
        console.error('Erro ao buscar usuários:', err);
        setError(err.message || 'Erro ao carregar usuários');
        setUsers(mockUsers); // Fallback para dados mock
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (user?: UserType) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        password: ''
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        role: 'user',
        password: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      role: 'user',
      password: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isSupabaseConfigured) {
      // Fallback para modo demo
      if (editingUser) {
        setUsers(prev => prev.map(user => 
          user.id === editingUser.id 
            ? { ...user, name: formData.name, email: formData.email, role: formData.role }
            : user
        ));
      } else {
        const newUser: UserType = {
          id: Date.now().toString(),
          name: formData.name,
          email: formData.email,
          role: formData.role,
          createdAt: new Date().toISOString()
        };
        setUsers(prev => [...prev, newUser]);
      }
      handleCloseModal();
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (editingUser) {
        // Atualizar usuário existente
        const { error } = await supabase
          .from('profiles')
          .update({
            name: formData.name,
            role: formData.role
          })
          .eq('id', editingUser.id);

        if (error) throw error;

        setUsers(prev => prev.map(user => 
          user.id === editingUser.id 
            ? { ...user, name: formData.name, role: formData.role }
            : user
        ));
        toast.success('Usuário atualizado com sucesso!');
      } else {
        // Criar novo usuário via Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.name,
              role: formData.role
            }
          }
        });

        if (authError) throw authError;

        if (authData.user) {
          // O perfil será criado automaticamente pelo trigger
          // Aguardar um pouco para o trigger processar
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Buscar o perfil criado
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();

          if (profileError) {
            console.warn('Perfil não encontrado, criando manualmente:', profileError);
            // Criar perfil manualmente se o trigger falhou
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: authData.user.id,
                name: formData.name,
                email: formData.email,
                role: formData.role
              });
            if (insertError) throw insertError;
          }

          const newUser: UserType = {
            id: authData.user.id,
            name: formData.name,
            email: formData.email,
            role: formData.role,
            createdAt: new Date().toISOString()
          };
          setUsers(prev => [newUser, ...prev]);
          toast.success('Usuário criado com sucesso!');
        }
      }
      
      handleCloseModal();
    } catch (err: any) {
      console.error('Erro ao salvar usuário:', err);
      setError(err.message || 'Erro ao salvar usuário');
      toast.error(err.message || 'Erro ao salvar usuário');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (userId: string, userName: string) => {
    setConfirmDialog({ isOpen: true, userId, userName });
  };

  const handleDelete = async () => {
    const { userId } = confirmDialog;
    if (!userId) return;

    if (!isSupabaseConfigured) {
      setUsers(prev => prev.filter(user => user.id !== userId));
      toast.success('Usuário excluído com sucesso!');
      setConfirmDialog({ isOpen: false, userId: null, userName: null });
      return;
    }

    try {
      // Deletar perfil (o usuário auth será deletado automaticamente pelo trigger)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => prev.filter(user => user.id !== userId));
      toast.success('Usuário excluído com sucesso!');
    } catch (err: any) {
      console.error('Erro ao deletar usuário:', err);
      setError(err.message || 'Erro ao deletar usuário');
      toast.error(err.message || 'Erro ao deletar usuário');
    } finally {
      setConfirmDialog({ isOpen: false, userId: null, userName: null });
    }
  };

  return (
    <div>
      <div className="flex flex-col space-y-3 mb-4 sm:mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-3 sm:space-y-0">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2 truncate">Gerenciamento de Usuários</h1>
            <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-300">Cadastre e gerencie os usuários do sistema</p>
          </div>
          
          <button
            onClick={() => handleOpenModal()}
            className="w-full sm:w-auto bg-green-600 text-white px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 rounded-lg font-medium hover:bg-green-700 hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center space-x-2 min-h-[44px] touch-manipulation"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="text-sm sm:text-base font-medium">Novo Usuário</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4 sm:mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
          <input
            type="text"
            placeholder="Buscar usuários..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 sm:pl-10 pr-4 py-3 sm:py-3.5 text-sm sm:text-base border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent min-h-[44px] touch-manipulation"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Users List - Desktop: Table, Mobile: Cards */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        {loading ? (
          <>
            {/* Desktop Skeleton */}
            <div className="hidden md:block">
              <TableSkeleton rows={5} />
            </div>
            {/* Mobile Skeleton */}
            <div className="md:hidden space-y-4 p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <UserCardSkeleton key={i} />
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Desktop Table - Hidden on mobile */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                  <tr>
                    <th className="text-left py-3 px-4 lg:px-6 font-medium text-gray-700 dark:text-gray-300">Usuário</th>
                    <th className="text-left py-3 px-4 lg:px-6 font-medium text-gray-700 dark:text-gray-300">Email</th>
                    <th className="text-left py-3 px-4 lg:px-6 font-medium text-gray-700 dark:text-gray-300">Função</th>
                    <th className="text-left py-3 px-4 lg:px-6 font-medium text-gray-700 dark:text-gray-300">Criado em</th>
                    <th className="text-center py-3 px-4 lg:px-6 font-medium text-gray-700 dark:text-gray-300">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="py-3 lg:py-4 px-4 lg:px-6">
                      <div className="flex items-center space-x-2 lg:space-x-3">
                        <div className="w-8 h-8 lg:w-10 lg:h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="text-green-600 dark:text-green-400 w-4 h-4 lg:w-5 lg:h-5" />
                        </div>
                        <p className="font-medium text-gray-900 dark:text-gray-100 text-sm lg:text-base truncate">{user.name}</p>
                      </div>
                    </td>
                    <td className="py-3 lg:py-4 px-4 lg:px-6">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-600 dark:text-gray-300 text-sm lg:text-base truncate">{user.email}</span>
                      </div>
                    </td>
                    <td className="py-3 lg:py-4 px-4 lg:px-6">
                      {user.role === 'admin' ? (
                        <span className="inline-flex items-center space-x-1 lg:space-x-1.5 px-2 lg:px-2.5 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 text-xs font-medium rounded-full">
                          <ShieldCheck className="w-3 h-3 lg:w-3.5 lg:h-3.5 flex-shrink-0" />
                          <span className="hidden lg:inline">Administrador</span>
                          <span className="lg:hidden">Admin</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 lg:space-x-1.5 px-2 lg:px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-medium rounded-full">
                          <Shield className="w-3 h-3 lg:w-3.5 lg:h-3.5 flex-shrink-0" />
                          <span>Usuário</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 lg:py-4 px-4 lg:px-6 text-gray-600 dark:text-gray-300 text-sm lg:text-base">
                      {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3 lg:py-4 px-4 lg:px-6">
                      <div className="flex items-center justify-center space-x-1 lg:space-x-2">
                        <button
                          onClick={() => handleOpenModal(user)}
                          className="p-1.5 lg:p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(user.id, user.name)}
                          className="p-1.5 lg:p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Excluir"
                          disabled={user.id === currentUser?.id}
                        >
                          <Trash2 className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards - Hidden on desktop */}
            <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
              {filteredUsers.map((user) => (
                <div key={user.id} className="p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-start justify-between mb-2 sm:mb-3">
                    <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="text-green-600 dark:text-green-400 w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate">{user.name}</p>
                        <div className="flex items-center space-x-1 sm:space-x-1.5 mt-0.5 sm:mt-1">
                          <Mail className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-400 flex-shrink-0" />
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 truncate">{user.email}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                      {user.role === 'admin' ? (
                        <span className="inline-flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-2.5 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 text-xs font-medium rounded-full">
                          <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                          <span className="hidden xs:inline">Admin</span>
                          <span className="xs:hidden">A</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-medium rounded-full">
                          <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                          <span className="hidden xs:inline">Usuário</span>
                          <span className="xs:hidden">U</span>
                        </span>
                      )}
                      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {new Date(user.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-0.5 sm:space-x-1 flex-shrink-0">
                      <button
                        onClick={() => handleOpenModal(user)}
                        className="p-2 sm:p-2.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(user.id, user.name)}
                        className="p-2 sm:p-2.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
                        title="Excluir"
                        disabled={user.id === currentUser?.id}
                      >
                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        
        {!loading && filteredUsers.length === 0 && (
          <EmptyState
            icon={searchTerm ? Search : User}
            title={searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
            description={
              searchTerm
                ? 'Tente ajustar os termos de busca para encontrar usuários.'
                : 'Comece adicionando o primeiro usuário ao sistema.'
            }
            actionLabel={!searchTerm ? 'Adicionar Usuário' : undefined}
            onAction={!searchTerm ? () => handleOpenModal() : undefined}
            secondaryActionLabel={searchTerm ? 'Limpar Busca' : undefined}
            onSecondaryAction={searchTerm ? () => setSearchTerm('') : undefined}
          />
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                  disabled={!!editingUser}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Função *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as 'admin' | 'user' }))}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                >
                  <option value="user">Usuário</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              
              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Senha *
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required={!editingUser}
                    minLength={6}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
              )}
              
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end space-y-2 space-y-reverse sm:space-y-0 sm:space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="w-full sm:w-auto px-4 py-2.5 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm sm:text-base"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {submitting ? 'Salvando...' : (editingUser ? 'Atualizar' : 'Cadastrar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, userId: null, userName: null })}
        onConfirm={handleDelete}
        title="Excluir Usuário"
        message={`Tem certeza que deseja excluir o usuário "${confirmDialog.userName}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
};