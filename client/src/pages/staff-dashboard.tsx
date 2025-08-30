import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Settings, 
  Moon, 
  Sun, 
  ClipboardList, 
  Users, 
  Clock,
  Plus,
  Car,
  Wrench,
  CheckCircle
} from "lucide-react";

export default function StaffDashboard() {
  const { user, garage } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [, navigate] = useLocation();

  const { data: pendingJobs } = useQuery({
    queryKey: ["/api/garages", garage?.id, "job-cards"],
    queryFn: async () => {
      if (!garage?.id) return [];
      const response = await apiRequest("GET", `/api/garages/${garage.id}/job-cards?status=pending`);
      return response.json();
    },
    enabled: !!garage?.id,
  });

  const { data: myCompletedJobs } = useQuery({
    queryKey: ["/api/garages", garage?.id, "job-cards", "completed"],
    queryFn: async () => {
      if (!garage?.id) return [];
      const response = await apiRequest("GET", `/api/garages/${garage.id}/job-cards?status=completed&limit=10`);
      return response.json();
    },
    enabled: !!garage?.id,
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="gradient-header text-primary-foreground">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center overflow-hidden">
              {garage?.logo ? (
                <img 
                  src={garage.logo} 
                  alt={`${garage.name} logo`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Wrench className="text-primary w-6 h-6" />
              )}
            </div>
            <div>
              <h1 className="text-lg font-semibold" data-testid="title-staff-dashboard">
                Staff Dashboard
              </h1>
              <p className="text-sm text-blue-100">
                Welcome, {user?.name}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-primary-foreground hover:bg-white/10"
              data-testid="button-theme-toggle"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <Card data-testid="card-pending-jobs">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Pending Jobs</p>
                  <p className="text-2xl font-bold">{pendingJobs?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-completed-jobs">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Completed Today</p>
                  <p className="text-2xl font-bold">{myCompletedJobs?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-garage-info">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Working at</p>
                  <p className="text-lg font-bold">{garage?.name || "Garage"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <Button
                onClick={() => navigate("/job-card")}
                className="h-20 flex flex-col items-center justify-center space-y-2"
                data-testid="button-new-job"
              >
                <Plus className="w-6 h-6" />
                <span>New Job Card</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => navigate("/pending-services")}
                className="h-20 flex flex-col items-center justify-center space-y-2"
                data-testid="button-pending-jobs"
              >
                <Clock className="w-6 h-6" />
                <span>Pending Jobs</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => navigate("/customers")}
                className="h-20 flex flex-col items-center justify-center space-y-2"
                data-testid="button-customers"
              >
                <Users className="w-6 h-6" />
                <span>Customers</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Current Work */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5" />
              Current Work Queue
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingJobs && pendingJobs.length > 0 ? (
              <div className="space-y-3">
                {pendingJobs.slice(0, 5).map((job: any) => (
                  <div 
                    key={job.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80"
                    onClick={() => navigate(`/invoice/${job.id}`)}
                    data-testid={`job-card-${job.id}`}
                  >
                    <div>
                      <p className="font-medium">{job.customerName}</p>
                      <p className="text-sm text-muted-foreground">{job.bikeNumber}</p>
                      <p className="text-sm text-muted-foreground">{job.complaint}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₹{job.totalAmount}</p>
                      <p className="text-sm text-orange-600 font-medium">{job.status}</p>
                    </div>
                  </div>
                ))}
                
                <Button
                  variant="outline"
                  onClick={() => navigate("/pending-services")}
                  className="w-full mt-4"
                  data-testid="button-view-all-jobs"
                >
                  View All Pending Jobs
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Car className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No pending job cards</p>
                <p className="text-sm">All caught up! Great work.</p>
                <Button
                  onClick={() => navigate("/job-card")}
                  className="mt-4"
                  data-testid="button-create-job"
                >
                  Create New Job Card
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Completed Work */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Recently Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            {myCompletedJobs && myCompletedJobs.length > 0 ? (
              <div className="space-y-3">
                {myCompletedJobs.slice(0, 3).map((job: any) => (
                  <div 
                    key={job.id}
                    className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg"
                    data-testid={`completed-job-${job.id}`}
                  >
                    <div>
                      <p className="font-medium">{job.customerName}</p>
                      <p className="text-sm text-muted-foreground">{job.bikeNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-600">₹{job.totalAmount}</p>
                      <p className="text-sm text-green-600 font-medium">Completed</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/completed-service-details/${job.id}`)}
                        className="mt-1 text-xs"
                        data-testid={`button-view-details-${job.id}`}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <p className="text-sm">No completed jobs yet today</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}