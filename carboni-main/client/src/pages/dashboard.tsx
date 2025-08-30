import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Car, Zap, UtensilsCrossed, TrendingDown, TrendingUp, Award, Target } from "lucide-react";
import EmissionsChart from "@/components/EmissionsChart";
import ActivityForm from "@/components/ActivityForm";

export default function Dashboard() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  // Redirect to login if not authenticated
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

  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ["/api/dashboard"],
    enabled: isAuthenticated,
  });

  // Handle unauthorized errors
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const {
    totalEmissionsThisMonth = 0,
    reductionPercentage = 0,
    rank = 0,
    emissionsByCategory = { transport: 0, energy: 0, food: 0 },
    goals = [],
    achievements = [],
    personalizedTips = [],
    chartData = { labels: [], transport: [], energy: [], food: [] }
  } = dashboardData || {};

  // Calculate today's emissions
  const todayTransport = chartData.transport?.slice(-1)[0] || 0;
  const todayEnergy = chartData.energy?.slice(-1)[0] || 0;
  const todayFood = chartData.food?.slice(-1)[0] || 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl p-8 mb-8 text-white">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
            <div className="mb-6 lg:mb-0">
              <h2 className="text-3xl font-bold mb-2">Your Carbon Footprint</h2>
              <p className="text-emerald-100 text-lg">Track, reduce, and offset your environmental impact</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full lg:w-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <div className="text-2xl font-bold">{(totalEmissionsThisMonth / 1000).toFixed(1)}</div>
                <div className="text-sm text-emerald-100">Tons CO2e/month</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <div className={`text-2xl font-bold ${reductionPercentage >= 0 ? 'text-emerald-200' : 'text-red-200'}`}>
                  {reductionPercentage > 0 ? '-' : ''}{Math.abs(reductionPercentage)}%
                </div>
                <div className="text-sm text-emerald-100">vs last month</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <div className="text-2xl font-bold">#{rank}</div>
                <div className="text-sm text-emerald-100">Global ranking</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Emissions Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Transport Card */}
              <Card className="shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Car className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Transport</h3>
                        <p className="text-sm text-gray-500">Daily average</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-gray-900">{todayTransport.toFixed(1)} kg</div>
                    <div className="text-sm text-gray-500">CO2e today</div>
                    <Badge variant="secondary" className="text-xs bg-emerald-50 text-emerald-600 hover:bg-emerald-50">
                      Weekly total: {emissionsByCategory.transport.toFixed(1)} kg
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Energy Card */}
              <Card className="shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <Zap className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Energy</h3>
                        <p className="text-sm text-gray-500">Home usage</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-gray-900">{todayEnergy.toFixed(1)} kg</div>
                    <div className="text-sm text-gray-500">CO2e today</div>
                    <Badge variant="secondary" className="text-xs bg-emerald-50 text-emerald-600 hover:bg-emerald-50">
                      Weekly total: {emissionsByCategory.energy.toFixed(1)} kg
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Food Card */}
              <Card className="shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <UtensilsCrossed className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Food</h3>
                        <p className="text-sm text-gray-500">Diet impact</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-gray-900">{todayFood.toFixed(1)} kg</div>
                    <div className="text-sm text-gray-500">CO2e today</div>
                    <Badge variant="secondary" className="text-xs bg-emerald-50 text-emerald-600 hover:bg-emerald-50">
                      Weekly total: {emissionsByCategory.food.toFixed(1)} kg
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Emissions Chart */}
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Emissions Trend</h3>
                  <div className="flex space-x-2">
                    <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white">
                      Daily
                    </Button>
                  </div>
                </div>
                <EmissionsChart data={chartData} />
              </CardContent>
            </Card>

            {/* Activity Form */}
            <ActivityForm />
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Personalized Tips */}
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Eco Tips for You</h3>
                <div className="space-y-4">
                  {personalizedTips.length > 0 ? (
                    personalizedTips.map((tip, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-emerald-50 rounded-lg">
                        <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{tip.title}</p>
                          <p className="text-xs text-gray-500 mt-1">{tip.description}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No tips available yet. Start logging activities to get personalized recommendations!</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Goals & Achievements */}
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Goals</h3>
                <div className="space-y-4">
                  {goals.length > 0 ? (
                    goals.slice(0, 2).map((goal) => (
                      <div key={goal.id}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">{goal.type.replace('_', ' ')}</span>
                          <span className="text-sm text-emerald-600 font-medium">{goal.targetValue}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-2 rounded-full" 
                            style={{ width: `${Math.min((goal.currentValue / goal.targetValue) * 100, 100)}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {goal.currentValue}/{goal.targetValue} - {goal.achieved ? 'Achieved!' : 'In progress'}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No goals set yet. Set some goals to track your progress!</p>
                  )}
                </div>

                {achievements.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-3">Recent Achievements</h4>
                    <div className="space-y-2">
                      {achievements.slice(0, 3).map((achievement) => (
                        <div key={achievement.id} className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                            <Award className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-sm text-gray-700">{achievement.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
