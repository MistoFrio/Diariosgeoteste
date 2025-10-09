import React, { useEffect, useState } from 'react';
import { LogOut, FileText, Users, Building2, Home, Sun, Moon, User, Menu, X, ChevronLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentPage, onPageChange }) => {
  const { user, logout } = useAuth();
  const [isDark, setIsDark] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldUseDark = storedTheme ? storedTheme === 'dark' : prefersDark;
    setIsDark(shouldUseDark);
    document.documentElement.classList.toggle('dark', shouldUseDark);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  const baseMenuItems = [
    { key: 'dashboard', label: 'Dashboard', icon: Home },
    { key: 'diaries', label: 'Diários Geoteste', icon: FileText },
    { key: 'new-diary', label: 'Novo Diário', icon: FileText },
    { key: 'profile', label: 'Meu Perfil', icon: User },
  ];

  const adminMenuItems = [
    ...baseMenuItems,
    { key: 'clients', label: 'Clientes', icon: Building2 },
    { key: 'users', label: 'Usuários', icon: Users },
  ];

  const menuItems = user?.role === 'admin' ? adminMenuItems : baseMenuItems;

  const handleMenuClick = (page: string) => {
    onPageChange(page);
    setIsMobileMenuOpen(false);
  };

  const canGoBack = currentPage !== 'dashboard';

  const handleBack = () => {
    if (currentPage === 'new-diary') {
      onPageChange('diaries');
    } else {
      onPageChange('dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden shadow-sm">
              <img src="/logogeoteste.png" alt="Geoteste" className="w-full h-full object-contain p-1" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white">Menu</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user?.name}</p>
            </div>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.key;
            return (
              <button
                key={item.key}
                onClick={() => handleMenuClick(item.key)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 font-medium'
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={logout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/60 backdrop-blur supports-[backdrop-filter]:backdrop-blur-md border-b border-gray-200/70 dark:border-gray-800">
        <div className="px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Botão de Voltar Mobile */}
            {canGoBack && (
              <button
                onClick={handleBack}
                className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Voltar"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            
            {/* Botão de Menu Hambúrguer Mobile */}
            {!canGoBack && (
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg overflow-hidden shadow-sm bg-transparent dark:bg-transparent">
              <img src="/logogeoteste.png" alt="Geoteste" className="w-full h-full object-contain p-1" />
            </div>
            <div className="leading-tight">
              <h1 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 dark:text-white">Geoteste</h1>
              <p className="text-[10px] sm:text-[11px] md:text-xs text-gray-500 dark:text-gray-400">Diários de Obra</p>
            </div>
          </div>

          {/* Mobile actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">

            <button
              onClick={toggleTheme}
              className="p-1.5 sm:p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:scale-105 transition-all duration-200"
              aria-label="Alternar tema"
              title={isDark ? 'Tema escuro' : 'Tema claro'}
            >
              {isDark ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>

            {/* Logout - Mobile */}
            <button
              onClick={logout}
              className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200 md:hidden"
              title="Sair"
              aria-label="Sair"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <div className="hidden sm:flex items-center space-x-2 md:space-x-3">
              <div className="text-right leading-tight">
                <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{user?.name}</p>
              </div>
              <button
                onClick={logout}
                className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
                title="Sair"
                aria-label="Sair"
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="hidden md:block w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 min-h-[calc(100vh-56px)] sticky top-14">
          <div className="p-4">
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.key;
                return (
                  <li key={item.key}>
                    <button
                      onClick={() => onPageChange(item.key)}
                      aria-current={isActive ? 'page' : undefined}
                      className={`group w-full flex items-center px-3 py-2 rounded-lg text-left transition-all duration-200 border ${
                        isActive
                          ? 'bg-brand-50 dark:bg-brand-600/10 text-brand-700 dark:text-brand-300 border-brand-200 dark:border-brand-700 shadow-sm'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:shadow-sm hover:scale-[1.02] border-transparent'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-brand-600 dark:text-brand-400' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200'}`} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-3 sm:p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};