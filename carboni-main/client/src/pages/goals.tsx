import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Target, Plus, CheckCircle, Clock } from "lucide-react";
import Navigation from "@/components/Navigation";
import { Goal } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export default function Goals() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [newGoal, setNewGoal] = useState({
    type: "",
    targetValue: "",
    period: "",
    startDate: "",
    endDate: "",
  });

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

  const { data: goals, isLoading, error } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
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

  const createGoalMutation = useMutation({
    mutationFn: async (goalData: any) => {
      await apiRequest("POST", "/api/goals", goalData);
    },
    onSuccess: () => {
      toast({
        title: "Goal Created",
        description: "Your new goal has been set successfully!",
      });
      setIsDialogOpen(false);
      setNewGoal({
        type: "",
        targetValue: "",
        period: "",
        startDate: "",
        endDate: "",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
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
        description: "Failed to create goal. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newGoal.type || !newGoal.targetValue || !newGoal.startDate || !newGoal.endDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    createGoalMutation.mutate({
      type: newGoal.type,
      targetValue: parseFloat(newGoal.targetValue),
      period: newGoal.period || 'month',
      startDate: newGoal.startDate,
      endDate: newGoal.endDate,
    });
  };

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

  const getGoalTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      monthly_target: 'Monthly Emissions Target',
      weekly_reduction: 'Weekly Reduction Goal',
      transport_reduction: 'Transport Reduction',
      energy_reduction: 'Energy Reduction',
    };
    return labels[type] || type;
  };

  const calculateProgress = (goal: Goal) => {
    if (goal.targetValue === 0) return 0;
    return Math.min((goal.currentValue / goal.targetValue) * 100, 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isGoalActive = (goal: Goal) => {
    const now = new Date();
    const startDate = new Date(goal.startDate);
    const endDate = new Date(goal.endDate);
    return now >= startDate && now <= endDate;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Goals</h1>
            <p className="text-gray-600">Set and track your carbon reduction targets</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-500 hover:bg-emerald-600">
                <Plus className="w-4 h-4 mr-2" />
                Add Goal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Goal</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="type">Goal Type</Label>
                  <Select value={newGoal.type} onValueChange={(value) => setNewGoal(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select goal type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly_target">Monthly Emissions Target</SelectItem>
                      <SelectItem value="weekly_reduction">Weekly Reduction Goal</SelectItem>
                      <SelectItem value="transport_reduction">Transport Reduction</SelectItem>
                      <SelectItem value="energy_reduction">Energy Reduction</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="targetValue">Target Value</Label>
                  <Input
                    id="targetValue"
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="Enter target value"
                    value={newGoal.targetValue}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, targetValue: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={newGoal.startDate}
                      onChange={(e) => setNewGoal(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={newGoal.endDate}
                      onChange={(e) => setNewGoal(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-emerald-500 hover:bg-emerald-600"
                  disabled={createGoalMutation.isPending}
                >
                  {createGoalMutation.isPending ? "Creating..." : "Create Goal"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {goals && goals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map((goal) => (
              <Card key={goal.id} className="shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{getGoalTypeLabel(goal.type)}</CardTitle>
                    <div className="flex items-center space-x-2">
                      {goal.achieved ? (
                        <Badge className="bg-emerald-100 text-emerald-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Achieved
                        </Badge>
                      ) : isGoalActive(goal) ? (
                        <Badge className="bg-blue-100 text-blue-800">
                          <Clock className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Progress</span>
                        <span className="text-sm text-gray-600">
                          {goal.currentValue.toFixed(1)} / {goal.targetValue.toFixed(1)}
                        </span>
                      </div>
                      <Progress value={calculateProgress(goal)} className="h-2" />
                      <p className="text-xs text-gray-500 mt-1">
                        {calculateProgress(goal).toFixed(1)}% complete
                      </p>
                    </div>

                    <div className="text-sm text-gray-600">
                      <p><strong>Start:</strong> {formatDate(goal.startDate)}</p>
                      <p><strong>End:</strong> {formatDate(goal.endDate)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="shadow-lg">
            <CardContent className="py-16 text-center">
              <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Goals Set</h3>
              <p className="text-gray-600 mb-6">
                Set your first carbon reduction goal to start tracking your progress
              </p>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-emerald-500 hover:bg-emerald-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Goal
                  </Button>
                </DialogTrigger>
              </Dialog>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
