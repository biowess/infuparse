import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Activity } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';

export default function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Docs', path: '/docs' },
    { name: 'References', path: '/references' },
    { name: 'About', path: '/about' },
    { name: 'Bookmarks', path: '/bookmarks' },
    { name: 'Settings', path: '/settings' },
  ];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col selection:bg-framer-blue selection:text-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full bg-black/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => navigate("/")}
          >
            <Activity className="w-5 h-5 text-framer-blue group-hover:scale-110 transition-transform" />
            <span className="font-semibold text-[15px] tracking-tight">InfuParse</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <div className="flex items-center gap-6">
              {navLinks.map((link) => (
                <button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  className={cn(
                    "text-[15px] transition-opacity duration-200",
                    location.pathname === link.path ? "text-white opacity-100" : "text-framer-silver hover:opacity-100"
                  )}
                >
                  {link.name}
                </button>
              ))}
            </div>
            <button
              onClick={() => navigate("/")}
              className="bg-white/10 hover:bg-white/20 transition-colors text-white text-[15px] px-5 py-2 rounded-[40px]"
            >
              New Query
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-black border-b border-white/5 px-6 py-4 flex flex-col gap-4">
            {navLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => {
                  navigate(link.path);
                  setIsMobileMenuOpen(false);
                }}
                className={cn(
                  "text-[15px] py-2 text-left",
                  location.pathname === link.path ? "text-white" : "text-framer-silver"
                )}
              >
                {link.name}
              </button>
            ))}
            <button
              onClick={() => {
                navigate("/");
                setIsMobileMenuOpen(false);
              }}
              className="bg-white/10 text-white text-[15px] px-5 py-3 rounded-[40px] text-center mt-2"
            >
              New Query
            </button>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12 md:py-20">
        <Outlet />
      </main>
    </div>
  );
}
