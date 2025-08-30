import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity } from "@shared/schema";
import { Car, Zap, UtensilsCrossed, Calendar } from "lucide-react";
import Navigation from "@/components/Navigation";

export default function ActivityLog() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

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

  const { data: activities, isLoading, error } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTransportIcon = (type: string | null) => {
    if (!type) return <Car className="w-4 h-4" />;
    switch (type) {
      case 'car_gasoline':
      case 'car_electric':
        return <Car className="w-4 h-4" />;
      default:
        return <Car className="w-4 h-4" />;
    }
  };

  const getTransportLabel = (type: string | null) => {
    if (!type) return 'No Transport';
    const labels: Record<string, string> = {
      car_gasoline: 'Car (Gasoline)',
      car_electric: 'Car (Electric)',
      bus: 'Bus',
      train: 'Train',
      bike: 'Bike',
      walking: 'Walking'
    };
    return labels[type] || type;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Activity Log</h1>
          <p className="text-gray-600">Review your carbon footprint activities and emissions</p>
        </div>

        {activities && activities.length > 0 ? (
          <div className="space-y-6">
            {activities.map((activity) => (
              <Card key={activity.id} className="shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <Calendar className="w-5 h-5 text-emerald-500" />
                      <span>{formatDate(activity.date)}</span>
                    </CardTitle>
                    <Badge variant="outline" className="text-lg font-semibold">
                      {activity.totalEmissions.toFixed(2)} kg CO2e
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Transport */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          {getTransportIcon(activity.transportType)}
                        </div>
                        <h3 className="font-semibold text-gray-900">Transport</h3>
                      </div>
                      {activity.transportType && activity.transportDistance ? (
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">{getTransportLabel(activity.transportType)}</span>
                          </p>
                          <p className="text-sm text-gray-600">
                            Distance: {activity.transportDistance} miles
                          </p>
                          <p className="text-sm font-medium text-blue-600">
                            {activity.transportEmissions?.toFixed(2) || 0} kg CO2e
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No transport logged</p>
                      )}
                    </div>

                    {/* Energy */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                          <Zap className="w-4 h-4 text-yellow-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900">Energy</h3>
                      </div>
                      {activity.electricityUsage || activity.naturalGasUsage ? (
                        <div className="space-y-1">
                          {activity.electricityUsage && (
                            <p className="text-sm text-gray-600">
                              Electricity: {activity.electricityUsage} kWh
                            </p>
                          )}
                          {activity.naturalGasUsage && (
                            <p className="text-sm text-gray-600">
                              Natural Gas: {activity.naturalGasUsage} therms
                            </p>
                          )}
                          <p className="text-sm font-medium text-yellow-600">
                            {activity.energyEmissions?.toFixed(2) || 0} kg CO2e
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No energy usage logged</p>
                      )}
                    </div>

                    {/* Food */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <UtensilsCrossed className="w-4 h-4 text-green-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900">Food</h3>
                      </div>
                      {(activity.beefServings || activity.chickenServings || activity.vegetableServings) ? (
                        <div className="space-y-1">
                          {activity.beefServings > 0 && (
                            <p className="text-sm text-gray-600">
                              Beef: {activity.beefServings} servings
                            </p>
                          )}
                          {activity.chickenServings > 0 && (
                            <p className="text-sm text-gray-600">
                              Chicken: {activity.chickenServings} servings
                            </p>
                          )}
                          {activity.vegetableServings > 0 && (
                            <p className="text-sm text-gray-600">
                              Vegetables: {activity.vegetableServings} servings
                            </p>
                          )}
                          <p className="text-sm font-medium text-green-600">
                            {activity.foodEmissions?.toFixed(2) || 0} kg CO2e
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No food logged</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="shadow-lg">
            <CardContent className="py-16 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Activities Yet</h3>
              <p className="text-gray-600 mb-6">
                Start logging your daily activities to track your carbon footprint
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
