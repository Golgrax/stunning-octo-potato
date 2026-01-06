import React, { useState, useEffect } from 'react';
import { Loader2, X, Sun, Moon, Type, ZoomIn, ZoomOut, Eye, Accessibility } from 'lucide-react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverEffect?: boolean;
  variant?: 'glass' | 'solid';
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = "",
  onClick,
  hoverEffect = true,
  variant = 'glass'
}) => {
  const baseStyle = variant === 'glass' 
    ? "bg-white/80 backdrop-blur-md border-neutral-200/60 dark:bg-neutral-900/80 dark:border-neutral-800" 
    : "bg-white border-neutral-200/80 dark:bg-neutral-900 dark:border-neutral-800";

  return (
    <div 
      onClick={onClick}
      className={`
        relative overflow-hidden
        border 
        rounded-xl
        transition-all duration-500 ease-out
        ${baseStyle}
        ${hoverEffect && onClick ? 'cursor-pointer hover:border-neutral-400/40 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-0.5 group' : 'shadow-[0_2px_8px_rgb(0,0,0,0.04)]'}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export const GlassModal: React.FC<{ isOpen: boolean; onClose: () => void; children: React.ReactNode; title?: string }> = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-neutral-950/30 backdrop-blur-md transition-opacity" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-[0_20px_70px_rgb(0,0,0,0.08)] rounded-2xl p-8 animate-in fade-in zoom-in-95 duration-300">
         <div className="flex justify-between items-center mb-8 border-b border-neutral-100 dark:border-neutral-800 pb-5">
            {title && <h3 className="text-2xl font-light tracking-tight text-neutral-900 dark:text-neutral-100">{title}</h3>}
            <button onClick={onClose} className="p-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg transition-all duration-200">
              <X className="w-5 h-5 text-neutral-400 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-300" />
            </button>
         </div>
         {children}
      </div>
    </div>
  );
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  isLoading,
  className = "",
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed tracking-wide";
  
  const variants = {
    primary: "bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 shadow-[0_2px_8px_rgba(0,0,0,0.12)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.16)] active:scale-[0.98]",
    secondary: "bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 hover:text-neutral-900 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 shadow-[0_1px_3px_rgba(0,0,0,0.06)]",
    ghost: "bg-transparent text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80 dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-neutral-800",
    danger: "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 hover:border-red-300 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/50",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`} 
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input 
    {...props}
    className={`w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-4 py-3 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200/50 transition-all duration-200 ${props.className}`}
  />
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
    <div className="relative">
      <select 
        {...props}
        className={`w-full appearance-none bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-4 py-3 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200/50 transition-all duration-200 ${props.className}`}
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
);

export const Badge: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, string> = {
    // Orders - Monochromatic with subtle differentiation
    pending_payment: "text-neutral-600 bg-neutral-100 border-neutral-200 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-400",
    in_prep: "text-neutral-700 bg-neutral-200 border-neutral-300 dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-300",
    ready: "text-neutral-800 bg-neutral-300 border-neutral-400 dark:bg-neutral-600 dark:border-neutral-500 dark:text-neutral-200",
    completed: "text-neutral-500 bg-neutral-50 border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800 dark:text-neutral-500",
    
    // User Status
    active: "text-neutral-700 bg-neutral-100 border-neutral-200 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300",
    suspended: "text-neutral-400 bg-neutral-50 border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800 dark:text-neutral-500",
    registered: "text-neutral-800 bg-neutral-200 border-neutral-300 dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-200",
    guest: "text-neutral-500 bg-neutral-50 border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800 dark:text-neutral-500",
    admin: "text-neutral-900 bg-neutral-300 border-neutral-400 dark:bg-neutral-600 dark:border-neutral-500 dark:text-neutral-100"
  };

  const labels: Record<string, string> = {
    pending_payment: "Pending",
    in_prep: "Preparing",
    ready: "Ready",
    completed: "Complete",
    active: "Active",
    suspended: "Suspended",
    registered: "Member",
    guest: "Guest"
  };

  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-medium border whitespace-nowrap tracking-wider uppercase ${styles[status] || styles.completed}`}>
      {labels[status] || status.replace('_', ' ')}
    </span>
  );
};

// Data-Dense Table for Admin
export const Table: React.FC<{ headers: string[], children: React.ReactNode }> = ({ headers, children }) => {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      <table className="w-full text-left text-sm text-neutral-600 dark:text-neutral-400">
        <thead className="text-xs uppercase bg-neutral-50 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 font-medium tracking-wider">
          <tr>
            {headers.map((header, i) => (
              <th key={i} className="px-6 py-4 border-b border-neutral-200/80 dark:border-neutral-800">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {children}
        </tbody>
      </table>
    </div>
  );
};

// Accessibility Menu
export const AccessibilityMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return localStorage.getItem('lumina_theme') as 'light' | 'dark' || 'light';
  });
  const [easyRead, setEasyRead] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('lumina_theme', theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    if (easyRead) {
      root.classList.add('easy-read');
    } else {
      root.classList.remove('easy-read');
    }
  }, [easyRead]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.fontSize = `${zoomLevel}%`;
  }, [zoomLevel]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-3 bg-white dark:bg-neutral-800 rounded-full shadow-lg border border-neutral-200 dark:border-neutral-700 hover:scale-105 transition-transform"
        aria-label="Accessibility Menu"
      >
        <Accessibility className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
      </button>

      {isOpen && (
        <div className="absolute bottom-16 right-0 w-64 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl p-4 animate-in slide-in-from-bottom-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-neutral-900 dark:text-neutral-100">Accessibility</h3>
            <button onClick={() => setIsOpen(false)} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Theme Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                {theme === 'light' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                Theme
              </span>
              <button 
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="px-3 py-1.5 text-xs font-medium bg-neutral-100 dark:bg-neutral-800 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors dark:text-neutral-200"
              >
                {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
              </button>
            </div>

            {/* Easy Read Font */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                <Type className="w-4 h-4" />
                Easy Read
              </span>
              <button 
                onClick={() => setEasyRead(!easyRead)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${easyRead ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900' : 'bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-200'}`}
              >
                {easyRead ? 'On' : 'Off'}
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Zoom
              </span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setZoomLevel(Math.max(80, zoomLevel - 10))}
                  className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg dark:text-neutral-200"
                  aria-label="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono w-8 text-center dark:text-neutral-300">{zoomLevel}%</span>
                <button 
                  onClick={() => setZoomLevel(Math.min(150, zoomLevel + 10))}
                  className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg dark:text-neutral-200"
                  aria-label="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};