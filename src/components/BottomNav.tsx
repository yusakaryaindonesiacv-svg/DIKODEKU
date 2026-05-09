import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, LayoutDashboard, ShoppingBag, User } from 'lucide-react';

const BottomNav = () => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[60] bg-background/80 backdrop-blur-xl border-t border-border/40 pb-safe">
      <div className="flex items-center justify-around h-16 relative">
        <NavLink 
          to="/" 
          className={({ isActive }) => 
            `flex flex-col items-center justify-center gap-1 transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`
          }
        >
          <Home className="h-5 w-5" />
          <span className="text-[10px] font-medium font-tech uppercase tracking-tighter">Home</span>
        </NavLink>

        <NavLink 
          to="/explore" 
          className={({ isActive }) => 
            `flex flex-col items-center justify-center gap-1 transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`
          }
        >
          <Search className="h-5 w-5" />
          <span className="text-[10px] font-medium font-tech uppercase tracking-tighter">Explore</span>
        </NavLink>

        {/* Central Larger Button */}
        <div className="relative -top-3 flex items-center justify-center">
          <NavLink 
            to="/explore"
            className={({ isActive }) => 
              `h-14 w-14 rounded-full flex items-center justify-center shadow-lg shadow-primary/20 transition-all active:scale-90 ${isActive ? "bg-primary text-primary-foreground" : "bg-card border border-border text-primary"}`
            }
          >
            <LayoutDashboard className="h-6 w-6" />
          </NavLink>
        </div>

        <NavLink 
          to="/dashboard" 
          className={({ isActive }) => 
            `flex flex-col items-center justify-center gap-1 transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`
          }
        >
          <ShoppingBag className="h-5 w-5" />
          <span className="text-[10px] font-medium font-tech uppercase tracking-tighter">Orders</span>
        </NavLink>

        <NavLink 
          to="/dashboard" 
          className={({ isActive }) => 
            `flex flex-col items-center justify-center gap-1 transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`
          }
        >
          <User className="h-5 w-5" />
          <span className="text-[10px] font-medium font-tech uppercase tracking-tighter">Profile</span>
        </NavLink>
      </div>
    </div>
  );
};

export default BottomNav;
