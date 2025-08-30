import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Leaf, Bell } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function Navigation() {
  const { user, isAuthenticated } = useAuth();
  const [location] = useLocation();

  if (!isAuthenticated) return null;

  const isActive = (path: string) => location === path;

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">EcoTrack</h1>
            </div>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            <Link href="/" className={`pb-2 px-1 text-sm font-medium transition-colors ${
              isActive('/') 
                ? 'text-emerald-500 border-b-2 border-emerald-500' 
                : 'text-gray-500 hover:text-gray-700'
            }`}>
              Dashboard
            </Link>
            <Link href="/activity-log" className={`pb-2 px-1 text-sm font-medium transition-colors ${
              isActive('/activity-log') 
                ? 'text-emerald-500 border-b-2 border-emerald-500' 
                : 'text-gray-500 hover:text-gray-700'
            }`}>
              Activity Log
            </Link>
            <Link href="/leaderboard" className={`pb-2 px-1 text-sm font-medium transition-colors ${
              isActive('/leaderboard') 
                ? 'text-emerald-500 border-b-2 border-emerald-500' 
                : 'text-gray-500 hover:text-gray-700'
            }`}>
              Leaderboard
            </Link>
            <Link href="/goals" className={`pb-2 px-1 text-sm font-medium transition-colors ${
              isActive('/goals') 
                ? 'text-emerald-500 border-b-2 border-emerald-500' 
                : 'text-gray-500 hover:text-gray-700'
            }`}>
              Goals
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5 text-gray-400" />
              <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-orange-400"></span>
            </Button>
            
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.profileImageUrl || undefined} alt="Profile" />
                <AvatarFallback>
                  {user?.firstName?.[0] || user?.email?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-gray-700">
                {user?.firstName || user?.email || 'User'}
              </span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => window.location.href = '/api/logout'}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
