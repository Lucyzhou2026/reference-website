import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { BookOpen, Settings, Plus } from 'lucide-react';
import { Button } from './ui/Button';

export const Layout = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <div className="min-h-screen bg-background text-text">
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center space-x-2 transition-opacity hover:opacity-80">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold tracking-tight text-gray-900">Literature Manager</span>
          </Link>

          <div className="flex items-center space-x-4">
            {isHomePage && (
              <Link to="/edit/new">
                <Button size="sm" className="hidden sm:flex">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Literature
                </Button>
                <Button size="icon" className="sm:hidden rounded-full">
                  <Plus className="h-4 w-4" />
                </Button>
              </Link>
            )}
            <Link to="/settings">
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
};
