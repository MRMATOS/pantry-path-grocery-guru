
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ShoppingCart, Archive, Home } from 'lucide-react';

type NavItemProps = {
  to: string;
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
};

const NavItem: React.FC<NavItemProps> = ({ to, label, icon, isActive }) => {
  return (
    <Link 
      to={to}
      className={cn(
        "flex flex-col items-center justify-center py-2 px-4 text-sm transition-colors",
        isActive 
          ? "text-app-green font-medium" 
          : "text-gray-600 hover:text-app-green"
      )}
    >
      {icon}
      <span className="mt-1">{label}</span>
    </Link>
  );
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b py-4">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold text-app-green">Shopping Assistant</h1>
        </div>
      </header>
      
      <main className="flex-grow container mx-auto px-4 py-6">
        {children}
      </main>
      
      <nav className="bg-white border-t fixed bottom-0 left-0 right-0">
        <div className="flex justify-around items-center">
          <NavItem 
            to="/" 
            label="Shopping" 
            icon={<ShoppingCart className="h-5 w-5" />} 
            isActive={location.pathname === '/'} 
          />
          <NavItem 
            to="/pantry" 
            label="Pantry" 
            icon={<Archive className="h-5 w-5" />} 
            isActive={location.pathname === '/pantry'} 
          />
        </div>
      </nav>
      
      {/* Add padding at the bottom to prevent content from being hidden behind the nav */}
      <div className="h-16"></div>
    </div>
  );
};

export default Layout;
