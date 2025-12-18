import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Users, Building2, TrendingUp, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { PullToRefresh } from './PullToRefresh';

interface DashboardProps {
  onPageChange?: (page: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onPageChange }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Função de fetch separada para poder reutilizar no refresh
  const fetchDashboardData = useCallback(async () => {
      if (!user || !isSupabaseConfigured) {
        // Fallback para dados mock se não estiver logado ou Supabase não configurado
        setStats(user?.role === 'admin' ? [
          { label: 'Diários Criados', value: '0', icon: FileText, color: 'green' },
          { label: 'Usuários Ativos', value: '0', icon: Users, color: 'blue' },
          { label: 'Clientes', value: '0', icon: Building2, color: 'purple' },
          { label: 'Este Mês', value: '0%', icon: TrendingUp, color: 'orange' },
        ] : [
          { label: 'Meus Diários', value: '0', icon: FileText, color: 'green' },
          { label: 'Esta Semana', value: '0', icon: TrendingUp, color: 'blue' },
          { label: 'Último Diário', value: 'Nunca', icon: FileText, color: 'purple' },
        ]);
        setActivities([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Buscar estatísticas
        if (user.role === 'admin') {
          // Admin: buscar todos os diários, usuários e clientes
          const [diariesRes, usersRes, clientsRes] = await Promise.all([
            supabase.from('work_diaries').select('id, created_at, client_name'),
            supabase.from('profiles').select('id, created_at'),
            supabase.from('clients').select('id')
          ]);

          if (diariesRes.error) throw diariesRes.error;
          if (usersRes.error) throw usersRes.error;
          // Clientes podem não ter tabela ainda, então não lançar erro

          const totalDiaries = diariesRes.data?.length || 0;
          const totalUsers = usersRes.data?.length || 0;
          const totalClients = clientsRes.data?.length || 0;

          // Calcular crescimento do mês
          const now = new Date();
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const diariesThisMonth = diariesRes.data?.filter(d =>
            new Date(d.created_at) >= startOfMonth
          ).length || 0;

          const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
          const diariesLastMonth = diariesRes.data?.filter(d =>
            new Date(d.created_at) >= lastMonthStart && new Date(d.created_at) <= lastMonthEnd
          ).length || 1; // Evitar divisão por zero

          const growth = Math.round(((diariesThisMonth - diariesLastMonth) / diariesLastMonth) * 100);

          setStats([
            { label: 'Diários Criados', value: totalDiaries.toString(), icon: FileText, color: 'green' },
            { label: 'Usuários Ativos', value: totalUsers.toString(), icon: Users, color: 'blue' },
            { label: 'Clientes', value: totalClients.toString(), icon: Building2, color: 'purple' },
            { label: 'Este Mês', value: `${growth >= 0 ? '+' : ''}${growth}%`, icon: TrendingUp, color: 'orange' },
          ]);
        } else {
          // Usuário comum: buscar apenas seus próprios diários
          const [diariesRes, recentDiariesRes] = await Promise.all([
            supabase.from('work_diaries').select('id, created_at, client_name').eq('user_id', user.id),
            supabase.from('work_diaries').select('id, created_at, client_name').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3)
          ]);

          if (diariesRes.error) throw diariesRes.error;

          const totalDiaries = diariesRes.data?.length || 0;
          const thisWeek = diariesRes.data?.filter(d => {
            const diaryDate = new Date(d.created_at);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return diaryDate >= weekAgo;
          }).length || 0;

          const lastDiary = recentDiariesRes.data?.[0];
          const lastDiaryDate = lastDiary ? new Date(lastDiary.created_at).toLocaleDateString('pt-BR') : 'Nunca';

          setStats([
            { label: 'Meus Diários', value: totalDiaries.toString(), icon: FileText, color: 'green' },
            { label: 'Esta Semana', value: thisWeek.toString(), icon: TrendingUp, color: 'blue' },
            { label: 'Último Diário', value: lastDiaryDate, icon: FileText, color: 'purple' },
          ]);
        }

        // Buscar atividades recentes (últimos diários criados)
        const { data: recentActivities, error: activitiesError } = await supabase
          .from('work_diaries')
          .select(`
            id,
            client_name,
            created_at,
            user_id
          `)
          .order('created_at', { ascending: false })
          .limit(10);

        if (activitiesError) throw activitiesError;

        // Buscar nomes dos usuários que criaram os diários
        const userIds = [...new Set((recentActivities || []).map(d => d.user_id))];
        const { data: userProfiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', userIds);

        if (profilesError) throw profilesError;

        const profilesMap = (userProfiles || []).reduce((acc: any, profile: any) => {
          acc[profile.id] = profile.name || 'Usuário';
          return acc;
        }, {});

        const formattedActivities = (recentActivities || []).map((diary: any) => ({
          title: 'Novo diário criado',
          description: diary.client_name,
          time: `${Math.floor((new Date().getTime() - new Date(diary.created_at).getTime()) / (1000 * 60 * 60))} horas atrás`,
          user: profilesMap[diary.user_id] || 'Usuário'
        }));

        setActivities(formattedActivities);
      } catch (err: any) {
        console.error('Erro ao buscar dados do dashboard:', err);
        setError('Não foi possível carregar os dados. Tente novamente.');
      } finally {
        setLoading(false);
      }
  }, [user]);

  // Buscar dados do dashboard na montagem
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Handler para pull-to-refresh
  const handleRefresh = async () => {
    await fetchDashboardData();
    // Pequeno delay para feedback visual
    await new Promise(resolve => setTimeout(resolve, 300));
  };

  // Função para mapear labels para páginas
  const getPageFromLabel = (label: string): string | null => {
    const labelToPageMap: Record<string, string> = {
      'Diários Criados': 'diaries',
      'Meus Diários': 'diaries',
      'Usuários Ativos': 'users',
      'Clientes': 'clients',
      'Último Diário': 'diaries',
      'Esta Semana': 'diaries',
    };
    return labelToPageMap[label] || null;
  };

  const handleCardClick = (label: string) => {
    if (!onPageChange) return;
    const page = getPageFromLabel(label);
    if (page) {
      onPageChange(page);
    }
  };

  // Fallback para dados mock se não houver dados
  const fallbackStats = user?.role === 'admin' ? [
    { label: 'Diários Criados', value: '0', icon: FileText, color: 'green' },
    { label: 'Usuários Ativos', value: '0', icon: Users, color: 'blue' },
    { label: 'Clientes', value: '0', icon: Building2, color: 'purple' },
    { label: 'Este Mês', value: '0%', icon: TrendingUp, color: 'orange' },
  ] : [
    { label: 'Meus Diários', value: '0', icon: FileText, color: 'green' },
    { label: 'Esta Semana', value: '0', icon: TrendingUp, color: 'blue' },
    { label: 'Último Diário', value: 'Nunca', icon: FileText, color: 'purple' },
  ];

  const fallbackActivities = [
    {
      title: 'Novo diário criado',
      description: 'Obra Residencial Park - São Paulo',
      time: '2 horas atrás',
      user: 'João Silva'
    },
    {
      title: 'Cliente cadastrado',
      description: 'Construtora ABC Ltda',
      time: '4 horas atrás',
      user: user?.role === 'admin' ? 'Admin Geoteste' : 'Você'
    },
    {
      title: 'Diário finalizado',
      description: 'Ensaio geotécnico - Edifício Central',
      time: '1 dia atrás',
      user: 'Maria Santos'
    },
  ];

  const dashboardContent = (
    <>
      <div className="mb-6 sm:mb-8 scroll-animate-up">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Bem-vindo, {user?.name}!
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
          {user?.role === 'admin' 
            ? 'Gerencie os diários de obra da sua empresa' 
            : 'Acompanhe seus diários de obra'}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {loading ? (
          // Loading skeleton
          Array.from({ length: user?.role === 'admin' ? 4 : 3 }).map((_, index) => (
            <div key={index} className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 dark:border-gray-800 animate-pulse">
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                </div>
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              </div>
            </div>
          ))
        ) : (
          (stats.length > 0 ? stats : fallbackStats).map((stat, index) => {
          const Icon = stat.icon;
          const colorMap = {
            green: 'bg-green-500',
            blue: 'bg-blue-500',
            purple: 'bg-purple-500',
            orange: 'bg-orange-500'
          };
          
          const isClickable = getPageFromLabel(stat.label) !== null;
          
          return (
            <div 
              key={index} 
              onClick={() => isClickable && handleCardClick(stat.label)}
              className={`mobile-card p-4 sm:p-6 hover:shadow-lg hover:border-gray-200 dark:hover:border-gray-700 hover:scale-[1.02] md:hover:-translate-y-1 transition-all duration-300 scroll-animate-up touch-feedback ${isClickable ? 'cursor-pointer active:scale-95' : 'cursor-default'}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">{stat.label}</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                </div>
                <div className={`w-10 h-10 sm:w-12 sm:h-12 ${colorMap[stat.color as keyof typeof colorMap]} rounded-lg flex items-center justify-center transition-all duration-300 hover:shadow-lg ${isClickable ? 'hover:scale-110 hover:rotate-3' : ''}`}>
                  <Icon className="text-white w-5 h-5 sm:w-6 sm:h-6" />
                </div>
              </div>
            </div>
          );
          })
        )}
      </div>

      {/* Recent Activity */}
      <div className="mobile-card scroll-animate-up">
        <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Atividade Recente</h2>
        </div>
        <div className="p-4 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Carregando atividades...</span>
            </div>
          ) : (
          <div className="space-y-3 sm:space-y-4">
              {(activities.length > 0 ? activities : fallbackActivities).map((activity, index) => (
              <div 
                key={index} 
                onClick={() => onPageChange?.('diaries')}
                className="group flex items-start space-x-2 sm:space-x-3 p-3 sm:p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 hover:shadow-sm active:scale-[0.98] transition-all duration-200 cursor-pointer touch-feedback"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0 group-hover:scale-150 group-hover:shadow-glow-soft transition-all duration-200"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-200">{activity.title}</p>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 break-words">{activity.description}</p>
                  <div className="flex items-center space-x-1 sm:space-x-2 mt-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
                    <span className="text-gray-300 dark:text-gray-600">•</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{activity.user}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop - sem pull to refresh */}
      <div className="animate-fade-in md:block hidden">
        {dashboardContent}
      </div>
      {/* Mobile com Pull to Refresh */}
      <div className="md:hidden block h-full">
        <PullToRefresh onRefresh={handleRefresh}>
          {dashboardContent}
        </PullToRefresh>
      </div>
    </>
  );
};