import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Medal, Award } from "lucide-react";
import Navigation from "@/components/Navigation";

interface LeaderboardEntry {
  user: {
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
  };
  totalEmissions: number;
  rank: number;
}

export default function Leaderboard() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: leaderboard, isLoading, error } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard"],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (error && isUnauthorizedError(error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [error, toast]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return (
          <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-gray-600">{rank}</span>
          </div>
        );
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-yellow-100 text-yellow-800";
      case 2:
        return "bg-gray-100 text-gray-800";
      case 3:
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-gray-50 text-gray-600";
    }
  };

  const getUserDisplayName = (entry: LeaderboardEntry) => {
    if (entry.user.firstName) {
      return `${entry.user.firstName} ${entry.user.lastName || ''}`.trim();
    }
    return entry.user.email || 'Unknown User';
  };

  const isCurrentUser = (entry: LeaderboardEntry) => {
    return entry.user.id === user?.id;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Leaderboard</h1>
          <p className="text-gray-600">See how you compare with other eco-conscious users this month</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="w-6 h-6 text-emerald-500" />
              <span>Monthly Carbon Footprint Rankings</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leaderboard && leaderboard.length > 0 ? (
              <div className="space-y-4">
                {leaderboard.map((entry, index) => (
                  <div
                    key={entry.user.id}
                    className={`flex items-center space-x-4 p-4 rounded-lg transition-colors ${
                      isCurrentUser(entry) 
                        ? 'bg-emerald-50 border-2 border-emerald-200' 
                        : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    {/* Rank */}
                    <div className="flex-shrink-0">
                      {getRankIcon(entry.rank)}
                    </div>

                    {/* Avatar */}
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={entry.user.profileImageUrl || undefined} alt="Profile" />
                      <AvatarFallback>
                        {entry.user.firstName?.[0] || entry.user.email?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {getUserDisplayName(entry)}
                        {isCurrentUser(entry) && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            You
                          </Badge>
                        )}
                      </p>
                      <p className="text-sm text-gray-500">
                        {entry.totalEmissions.toFixed(2)} kg CO2e this month
                      </p>
                    </div>

                    {/* Rank Badge */}
                    <div className="flex-shrink-0">
                      <Badge className={getRankBadgeColor(entry.rank)}>
                        #{entry.rank}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Rankings Yet</h3>
                <p className="text-gray-600">
                  Start logging your activities to appear on the leaderboard!
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Information Card */}
        <Card className="mt-8 shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">How Rankings Work</h3>
              <p className="text-sm text-gray-600 mb-4">
                Rankings are based on your total carbon emissions for the current month. 
                Lower emissions mean better rankings - aim for the top by reducing your carbon footprint!
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-emerald-50 rounded-lg">
                  <Trophy className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-emerald-700">Eco Champion</p>
                  <p className="text-xs text-emerald-600">Lowest emissions</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Medal className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-blue-700">Green Guardian</p>
                  <p className="text-xs text-blue-600">Second lowest</p>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg">
                  <Award className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-amber-700">Earth Protector</p>
                  <p className="text-xs text-amber-600">Third lowest</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
