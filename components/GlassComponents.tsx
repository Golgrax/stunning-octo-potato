import React from 'react';
import { Loader2, X } from 'lucide-react';

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
    ? "bg-white/80 backdrop-blur-md border-neutral-200/60" 
    : "bg-white border-neutral-200/80";

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
      <div className="relative w-full max-w-2xl bg-white border border-neutral-200/80 shadow-[0_20px_70px_rgb(0,0,0,0.08)] rounded-2xl p-8 animate-in fade-in zoom-in-95 duration-300">
         <div className="flex justify-between items-center mb-8 border-b border-neutral-100 pb-5">
            {title && <h3 className="text-2xl font-light tracking-tight text-neutral-900">{title}</h3>}
            <button onClick={onClose} className="p-2 hover:bg-neutral-50 rounded-lg transition-all duration-200">
              <X className="w-5 h-5 text-neutral-400 hover:text-neutral-700" />
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
    primary: "bg-neutral-900 text-white hover:bg-neutral-800 shadow-[0_2px_8px_rgba(0,0,0,0.12)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.16)] active:scale-[0.98]",
    secondary: "bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 hover:text-neutral-900 shadow-[0_1px_3px_rgba(0,0,0,0.06)]",
    ghost: "bg-transparent text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80",
    danger: "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 hover:border-red-300",
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
    className={`w-full bg-white border border-neutral-200 rounded-lg px-4 py-3 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200/50 transition-all duration-200 ${props.className}`}
  />
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
    <div className="relative">
      <select 
        {...props}
        className={`w-full appearance-none bg-white border border-neutral-200 rounded-lg px-4 py-3 text-neutral-900 focus:outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200/50 transition-all duration-200 ${props.className}`}
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
    pending_payment: "text-neutral-600 bg-neutral-100 border-neutral-200",
    in_prep: "text-neutral-700 bg-neutral-200 border-neutral-300",
    ready: "text-neutral-800 bg-neutral-300 border-neutral-400",
    completed: "text-neutral-500 bg-neutral-50 border-neutral-200",
    
    // User Status
    active: "text-neutral-700 bg-neutral-100 border-neutral-200",
    suspended: "text-neutral-400 bg-neutral-50 border-neutral-200",
    registered: "text-neutral-800 bg-neutral-200 border-neutral-300",
    guest: "text-neutral-500 bg-neutral-50 border-neutral-200",
    admin: "text-neutral-900 bg-neutral-300 border-neutral-400"
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
    <div className="w-full overflow-x-auto rounded-xl border border-neutral-200/80 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      <table className="w-full text-left text-sm text-neutral-600">
        <thead className="text-xs uppercase bg-neutral-50 text-neutral-500 font-medium tracking-wider">
          <tr>
            {headers.map((header, i) => (
              <th key={i} className="px-6 py-4 border-b border-neutral-200/80">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {children}
        </tbody>
      </table>
    </div>
  );
};