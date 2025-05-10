
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ShoppingCart, Archive, Home, Menu } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

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
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  
  const handleAdminAccess = () => {
    if (adminPassword === '442288') {
      navigate('/admin');
      setIsMenuOpen(false);
    } else {
      toast.error('Senha incorreta');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Link to="/">
            <h1 className="text-2xl font-bold text-app-green">Shopping Assistant</h1>
          </Link>
          <div className="flex items-center space-x-4">
            <Link 
              to="/shopping"
              className="bg-emerald-500 hover:bg-emerald-600 text-white py-2 px-4 rounded-md flex items-center"
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              <span className="hidden md:inline">Lista de compras</span>
            </Link>
            
            <Dialog open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <h2 className="text-xl font-bold mb-4">Menu</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Administração</h3>
                    <div className="flex flex-col space-y-2">
                      <Input 
                        type="password" 
                        placeholder="Senha" 
                        value={adminPassword} 
                        onChange={(e) => setAdminPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAdminAccess()}
                      />
                      <Button onClick={handleAdminAccess}>
                        Acessar
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>
      
      <main className="flex-grow container mx-auto px-4 py-6">
        {children}
      </main>
      
      <nav className="bg-white border-t fixed bottom-0 left-0 right-0">
        <div className="flex justify-around items-center">
          <NavItem 
            to="/" 
            label="Home" 
            icon={<Home className="h-5 w-5" />} 
            isActive={location.pathname === '/'} 
          />
          <NavItem 
            to="/shopping" 
            label="Shopping" 
            icon={<ShoppingCart className="h-5 w-5" />} 
            isActive={location.pathname === '/shopping'} 
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
