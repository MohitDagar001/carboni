import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function ActivityForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    transportType: "",
    transportDistance: "",
    electricityUsage: "",
    naturalGasUsage: "",
    beefServings: "",
    chickenServings: "",
    vegetableServings: "",
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        transportType: data.transportType || null,
        transportDistance: data.transportDistance ? parseFloat(data.transportDistance) : null,
        electricityUsage: data.electricityUsage ? parseFloat(data.electricityUsage) : null,
        naturalGasUsage: data.naturalGasUsage ? parseFloat(data.naturalGasUsage) : null,
        beefServings: data.beefServings ? parseInt(data.beefServings) : 0,
        chickenServings: data.chickenServings ? parseInt(data.chickenServings) : 0,
        vegetableServings: data.vegetableServings ? parseInt(data.vegetableServings) : 0,
      };

      await apiRequest("POST", "/api/activities", payload);
    },
    onSuccess: () => {
      toast({
        title: "Activity Logged",
        description: "Your activity has been recorded and emissions calculated.",
      });
      
      // Reset form
      setFormData({
        transportType: "",
        transportDistance: "",
        electricityUsage: "",
        naturalGasUsage: "",
        beefServings: "",
        chickenServings: "",
        vegetableServings: "",
      });

      // Invalidate and refetch dashboard data
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      toast({
        title: "Error",
        description: "Failed to log activity. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Card className="shadow-lg">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Log Today's Activity</h3>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Transport Section */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Transportation</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="transportType" className="text-sm font-medium text-gray-700 mb-2">
                  Vehicle Type
                </Label>
                <Select value={formData.transportType} onValueChange={(value) => handleInputChange('transportType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="car_gasoline">Car (Gasoline)</SelectItem>
                    <SelectItem value="car_electric">Car (Electric)</SelectItem>
                    <SelectItem value="bus">Bus</SelectItem>
                    <SelectItem value="train">Train</SelectItem>
                    <SelectItem value="bike">Bike</SelectItem>
                    <SelectItem value="walking">Walking</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="transportDistance" className="text-sm font-medium text-gray-700 mb-2">
                  Distance (miles)
                </Label>
                <Input
                  id="transportDistance"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="Enter miles traveled"
                  value={formData.transportDistance}
                  onChange={(e) => handleInputChange('transportDistance', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Energy Section */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Energy Usage</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="electricityUsage" className="text-sm font-medium text-gray-700 mb-2">
                  Electricity (kWh)
                </Label>
                <Input
                  id="electricityUsage"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="Daily consumption"
                  value={formData.electricityUsage}
                  onChange={(e) => handleInputChange('electricityUsage', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="naturalGasUsage" className="text-sm font-medium text-gray-700 mb-2">
                  Natural Gas (therms)
                </Label>
                <Input
                  id="naturalGasUsage"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="Daily usage"
                  value={formData.naturalGasUsage}
                  onChange={(e) => handleInputChange('naturalGasUsage', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Food Section */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Food Consumption</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="beefServings" className="text-sm font-medium text-gray-700">
                  Beef (servings)
                </Label>
                <Input
                  id="beefServings"
                  type="number"
                  min="0"
                  max="10"
                  className="w-20"
                  value={formData.beefServings}
                  onChange={(e) => handleInputChange('beefServings', e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="chickenServings" className="text-sm font-medium text-gray-700">
                  Chicken (servings)
                </Label>
                <Input
                  id="chickenServings"
                  type="number"
                  min="0"
                  max="10"
                  className="w-20"
                  value={formData.chickenServings}
                  onChange={(e) => handleInputChange('chickenServings', e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="vegetableServings" className="text-sm font-medium text-gray-700">
                  Vegetables (servings)
                </Label>
                <Input
                  id="vegetableServings"
                  type="number"
                  min="0"
                  max="10"
                  className="w-20"
                  value={formData.vegetableServings}
                  onChange={(e) => handleInputChange('vegetableServings', e.target.value)}
                />
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-emerald-500 hover:bg-emerald-600"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Calculating..." : "Log Activity & Calculate Impact"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
