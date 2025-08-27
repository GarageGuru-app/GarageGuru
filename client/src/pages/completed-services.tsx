import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, Calendar, User, FileText, Eye, Filter } from "lucide-react";
import { format } from "date-fns";

export default function CompletedServices() {
  const [, navigate] = useLocation();
  const { garage } = useAuth();
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [bikeNumberFilter, setBikeNumberFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const { data: completedJobCards, isLoading } = useQuery({
    queryKey: ["/api/garages", garage?.id, "job-cards", "completed"],
    queryFn: async () => {
      if (!garage?.id) return [];
      const response = await apiRequest("GET", `/api/garages/${garage.id}/job-cards`);
      const jobCards = await response.json();
      return jobCards.filter((job: any) => job.status === "completed");
    },
    enabled: !!garage?.id,
  });

  // Filter completed job cards based on search criteria
  const filteredJobCards = completedJobCards?.filter((jobCard: any) => {
    const matchesSearch = searchQuery === "" || 
      jobCard.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      jobCard.complaint?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesBikeNumber = bikeNumberFilter === "" || 
      jobCard.bike_number?.toLowerCase().includes(bikeNumberFilter.toLowerCase());
    
    const jobDate = new Date(jobCard.completed_at || jobCard.created_at);
    const matchesStartDate = startDate === "" || jobDate >= new Date(startDate);
    const matchesEndDate = endDate === "" || jobDate <= new Date(endDate + "T23:59:59");
    
    return matchesSearch && matchesBikeNumber && matchesStartDate && matchesEndDate;
  }) || [];

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy, hh:mm a");
    } catch {
      return "Invalid Date";
    }
  };

  const calculateTotal = (jobCard: any) => {
    const partsTotal = Array.isArray(jobCard.spare_parts) 
      ? jobCard.spare_parts.reduce((sum: number, part: any) => sum + (part.price * part.quantity), 0)
      : 0;
    const serviceCharge = Number(jobCard.service_charge) || 0;
    return partsTotal + serviceCharge;
  };

  const resetFilters = () => {
    setSearchQuery("");
    setBikeNumberFilter("");
    setStartDate("");
    setEndDate("");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="screen-header">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/admin-dashboard")}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-lg font-semibold">Completed Services</h2>
          </div>
        </div>
        <div className="screen-content flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading completed services...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="screen-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/admin-dashboard")}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="text-lg font-semibold">Completed Services</h2>
              <p className="text-sm text-white/80">{filteredJobCards.length} completed jobs</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className="text-white hover:bg-white/10"
          >
            <Filter className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="screen-content space-y-4">
        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4 space-y-4">
            {/* Main Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by customer name or complaint..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="space-y-3 pt-3 border-t border-border">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Bike Number</label>
                    <Input
                      placeholder="Search by bike number..."
                      value={bikeNumberFilter}
                      onChange={(e) => setBikeNumberFilter(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">From Date</label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">To Date</label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={resetFilters}>
                    Clear Filters
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Completed Job Cards */}
        {filteredJobCards.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Completed Services Found</h3>
              <p className="text-muted-foreground">
                {completedJobCards?.length === 0 
                  ? "No services have been completed yet."
                  : "Try adjusting your search filters."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredJobCards.map((jobCard: any) => (
              <Card key={jobCard.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold">{jobCard.customer_name}</h3>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Completed
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <User className="w-4 h-4" />
                          <span>Bike: {jobCard.bike_number}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>Completed: {formatDate(jobCard.completed_at || jobCard.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-primary">
                        ₹{calculateTotal(jobCard).toFixed(2)}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/completed-service-details/${jobCard.id}`)}
                        className="mt-2"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium">Complaint:</span>
                      <p className="text-sm text-muted-foreground">{jobCard.complaint}</p>
                    </div>

                    {jobCard.work_summary && (
                      <div>
                        <span className="text-sm font-medium">Work Summary:</span>
                        <p className="text-sm text-muted-foreground">{jobCard.work_summary}</p>
                      </div>
                    )}

                    {Array.isArray(jobCard.spare_parts) && jobCard.spare_parts.length > 0 && (
                      <div>
                        <span className="text-sm font-medium">Parts Used:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {jobCard.spare_parts.slice(0, 3).map((part: any, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {part.name} ({part.quantity})
                            </Badge>
                          ))}
                          {jobCard.spare_parts.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{jobCard.spare_parts.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}