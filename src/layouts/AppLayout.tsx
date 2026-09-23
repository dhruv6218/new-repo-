'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, FileText, Bot, Settings, LogOut,
  Bell, Menu, X, ChevronDown, CreditCard, Sparkles, Zap, Activity,
  Megaphone
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useToast } from '../contexts/ToastContext';

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  backPath?: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, title, subtitle, actions, backPath }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { activeWorkspace, isWorkspaceInitializing } = useWorkspace();
  const { addToast } = useToast();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [globalAnnouncement, setGlobalAnnouncement] = useState('');

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setGlobalAnnouncement('');
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const handleUpgradeClick = () => {
    addToast("Redirecting to upgrade options...", "success");
    router.push('/pricing');
  };

  const navSections = [
    {
      label: 'Recovery',
      items: [
        { name: 'Dashboard', path: '/app', icon: LayoutDashboard, desc: 'Overview & metrics' },
        { name: 'Invoices', path: '/app/invoices', icon: FileText, desc: 'Action center' },
        { name: 'Tone Studio', path: '/app/tone', icon: Bot, desc: 'AI voice cloning', pro: false },
        { name: 'Gateways', path: '/app/gateways', icon: CreditCard, desc: 'Payment connections' },
        { name: 'Analytics', path: '/app/analytics', icon: Activity, desc: 'Recovery reports' },
      ],
    },
    {
      label: 'Account',
      items: [
        { name: 'Settings', path: '/app/settings', icon: Settings, desc: 'Account & billing' },
      ],
    },
  ];

  const fullName = (typeof user?.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : '') || user?.email?.split('@')[0] || 'User';
  const initials = fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
  const wsName = activeWorkspace?.name || 'Workspace';
  const wsInitials = wsName.substring(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans selection:bg-brand-blue selection:text-white overflow-hidden" suppressHydrationWarning>
      
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 md:hidden animate-[fadeIn_0.2s_ease-out]"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Dark Sidebar */}
      <aside className={`w-64 bg-sidebar-dark border-r border-slate-800 fixed h-full flex flex-col z-50 transform transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 shrink-0">
          <Link href="/app" className="flex items-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-astrix-teal rounded-md">
            <img 
              src="https://images.dualite.app/102e86e1-720e-45cc-9e4e-55e865135e96/asset-b9a7a63e-c65a-4fa8-9433-c13564a7364e.webp" 
              alt="Astrix Logo" 
              className="h-8 w-auto object-contain opacity-90"
            />
            <span className="font-heading text-lg font-black tracking-tighter text-white">ASTRIX AI</span>
          </Link>
          <button aria-label="Close navigation menu" className="md:hidden text-slate-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-astrix-teal rounded-lg" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Workspace / Plan Info */}
        <div className="p-4 shrink-0 border-b border-slate-800/50">
          <div className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-sidebar-hover/30 border border-slate-700/30 cursor-default">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-md bg-astrix-teal/20 border border-astrix-teal/30 flex items-center justify-center text-astrix-teal font-bold text-xs shadow-sm shrink-0">
                {isWorkspaceInitializing ? '...' : wsInitials}
              </div>
              <div className="flex flex-col items-start overflow-hidden">
                <span className="text-sm font-bold text-white leading-tight truncate w-full text-left">
                  {isWorkspaceInitializing ? 'Loading...' : wsName}
                </span>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Solo Plan</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-3 hide-scrollbar">
          {navSections.map((section) => (
            <div key={section.label}>
              <div className="text-[9px] font-mono text-slate-600 uppercase tracking-widest font-bold px-3 mb-1 mt-2">{section.label}</div>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = pathname === item.path || (item.path !== '/app' && pathname?.startsWith(item.path));
                  return (
                    <Link
                      key={item.name}
                      href={item.path}
                                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-astrix-teal group ${
                        isActive 
                          ? 'bg-astrix-teal text-white shadow-md' 
                          : 'text-slate-400 hover:bg-sidebar-hover hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                        <div>
                          <div className="font-bold leading-tight text-[13px]">{item.name}</div>
                          <div className={`text-[10px] leading-tight ${isActive ? 'text-teal-100' : 'text-slate-500'}`}>{item.desc}</div>
                        </div>
                      </div>
                      {item.pro && (
                        <span className="bg-gradient-to-r from-astrix-teal to-blue-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shadow-sm">PRO</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Upgrade Banner */}
        <div className="px-4 py-3 shrink-0">
          <button aria-label="Open navigation menu"
            onClick={handleUpgradeClick}
            className="w-full bg-gradient-to-r from-brand-blue/20 to-astrix-teal/20 border border-brand-blue/30 text-white rounded-xl px-3 py-3 text-left hover:from-brand-blue/30 hover:to-astrix-teal/30 transition-all group"
          >
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-brand-yellow" />
              <span className="text-xs font-black text-white uppercase tracking-widest">Upgrade to Solo</span>
            </div>
            <p className="text-[11px] text-slate-400 group-hover:text-slate-300">Unlimited recoveries from $29/mo</p>
          </button>
        </div>

        {/* User Profile / Sign Out */}
        <div className="p-4 border-t border-slate-800 shrink-0">
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-sidebar-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-astrix-teal group"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-astrix-teal/20 border border-astrix-teal/30 flex items-center justify-center text-astrix-teal font-bold text-xs shrink-0">
                {initials}
              </div>
              <div className="flex flex-col items-start overflow-hidden">
                <span className="text-sm font-bold text-white leading-tight truncate w-full text-left">{fullName}</span>
                <span className="text-xs text-slate-400 truncate w-full text-left">{user?.email}</span>
              </div>
            </div>
            <LogOut className="w-4 h-4 text-slate-500 group-hover:text-red-400 transition-colors shrink-0 ml-2" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen w-full md:ml-64 transition-all duration-300">
        
        {/* Banners */}

        {globalAnnouncement && (
          <div className="bg-brand-blue text-white px-4 py-2.5 flex items-center justify-between z-40 relative shadow-sm">
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 shrink-0" />
              <span className="text-sm font-medium">{globalAnnouncement}</span>
            </div>
            <button 
              onClick={() => {
                setGlobalAnnouncement('');
                // If we want it strictly dismissible per user, we could clear it here.
                // But for the sake of demo, just hiding it in local state.
              }}
              className="text-blue-200 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Top Header */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-30 flex items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-3">
            <button 
              className="md:hidden p-2 -ml-2 text-gray-600 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-astrix-teal rounded-lg"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            {backPath && (
              <Link aria-label="Go back" href={backPath} className="p-2 -ml-2 text-gray-400 hover:text-gray-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-astrix-teal rounded-lg">
                <ChevronDown className="w-5 h-5 rotate-90" />
              </Link>
            )}
            <div className="hidden sm:block">
              <h1 className="font-heading text-xl font-bold text-gray-900 truncate">{title}</h1>
              {subtitle && <p className="text-xs text-gray-500 font-medium truncate">{subtitle}</p>}
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <Link href="/pricing" className="hidden lg:flex items-center gap-1.5 bg-brand-yellow/10 text-yellow-700 border border-brand-yellow/20 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-brand-yellow/20 transition-colors">
              <Zap className="w-3.5 h-3.5" /> Upgrade Plan
            </Link>
            {actions && <div className="hidden sm:block">{actions}</div>}
            <div className="h-6 w-[1px] bg-gray-200 mx-1 hidden sm:block"></div>
            <button aria-label="Notifications" className="text-gray-400 hover:text-gray-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-astrix-teal rounded-full p-1.5 relative">
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Mobile title area */}
        <div className="sm:hidden px-4 pt-4 pb-2 bg-white border-b border-gray-100">
          <h1 className="font-heading text-lg font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-xs text-gray-500 font-medium mt-0.5">{subtitle}</p>}
          {actions && <div className="mt-3">{actions}</div>}
        </div>

        <div className="flex-1 p-4 md:p-8 overflow-x-hidden">
          <div className="max-w-[1200px] mx-auto animate-[fadeIn_0.4s_ease-out]">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
