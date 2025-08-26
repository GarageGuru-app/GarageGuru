import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Search, Bike, Phone, Calendar, Eye, Edit, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";


export default function PendingServices() {
  const [, navigate] = useLocation();
  const { garage } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const { data: pendingJobs = [], isLoading } = useQuery({
    queryKey: ["/api/garages", garage?.id, "job-cards", "pending"],
    queryFn: async () => {
      if (!garage?.id) return [];
      const response = await apiRequest("GET", `/api/garages/${garage.id}/job-cards?status=pending`);
      return response.json();
    },
    enabled: !!garage?.id,
  });

  const filteredJobs = pendingJobs.filter((job: any) =>
    job.customer_name?.toLowerCase?.()?.includes(searchTerm.toLowerCase()) ||
    job.bike_number?.toLowerCase?.()?.includes(searchTerm.toLowerCase()) ||
    job.phone?.includes(searchTerm)
  );

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      })}`;
    }
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="screen-header">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-lg font-semibold">Pending Services</h2>
          </div>
        </div>
        <div className="screen-content flex items-center justify-center">
          <div className="flex flex-col items-center space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="text-muted-foreground">Loading pending services...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="screen-header">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-lg font-semibold">Pending Services</h2>
        </div>
        <div className="bg-white/20 px-3 py-1 rounded-full">
          <span className="text-sm font-medium">{filteredJobs.length} Jobs</span>
        </div>
      </div>

      <div className="screen-content">
        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative search-bar-container">
            <Search className="search-icon w-4 h-4" />
            <Input
              type="text"
              placeholder="Search by customer name or bike number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {/* Job Cards List */}
        {filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-muted-foreground">
                {searchTerm ? "No jobs found matching your search" : "No pending services"}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredJobs.map((job: any) => (
              <Card key={job.id} className="border-l-4 border-l-warning">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{job.customer_name}</h3>
                    <Badge variant="secondary" className="warning-bg warning-text">
                      Pending
                    </Badge>
                  </div>

                  <div className="space-y-1 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center space-x-2">
                      <Bike className="w-4 h-4" />
                      <span>{job.bike_number}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4" />
                      <span>{job.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(job.created_at)}</span>
                    </div>
                  </div>

                  <div className="text-sm text-foreground mb-3">
                    {job.complaint && job.complaint.includes('☐') || job.complaint.includes('☑') ? (
                      // Render checklist items
                      <div className="space-y-1">
                        {job.complaint.split('\n').filter(line => line.trim()).map((line, index) => {
                          const isCheckbox = line.includes('☐') || line.includes('☑');
                          if (isCheckbox) {
                            const isChecked = line.includes('☑');
                            const text = line.replace(/[☐☑]\s*/, '').trim();
                            return (
                              <div key={index} className="flex items-center space-x-2 text-xs">
                                <span className={isChecked ? 'text-green-600' : 'text-orange-500'}>
                                  {isChecked ? '☑' : '☐'}
                                </span>
                                <span className={isChecked ? 'line-through text-muted-foreground' : ''}>
                                  {text}
                                </span>
                              </div>
                            );
                          }
                          return (
                            <div key={index} className="text-xs text-muted-foreground">
                              {line}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      // Regular text
                      <p className="line-clamp-2">{job.complaint}</p>
                    )}
                  </div>

                  {job.spareParts && job.spareParts.length > 0 && (
                    <div className="text-xs text-muted-foreground mb-3">
                      Parts: {job.spareParts.map((part: any) => part.name).join(", ")}
                    </div>
                  )}

                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedJob(job);
                        setIsDetailsOpen(true);
                      }}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View Details
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/edit-job-card/${job.id}`)}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    {(() => {
                      const hasChecklist = job.complaint && (job.complaint.includes('☐') || job.complaint.includes('☑'));
                      const hasIncompleteItems = hasChecklist && job.complaint.includes('☐');
                      
                      return (
                        <Button
                          size="sm"
                          onClick={() => {
                            if (hasIncompleteItems) {
                              toast({
                                title: "Incomplete Tasks",
                                description: "Please complete all checklist items before generating invoice",
                                variant: "destructive",
                              });
                            } else {
                              navigate(`/invoice/${job.id}`);
                            }
                          }}
                          disabled={hasIncompleteItems}
                          className={hasIncompleteItems ? "opacity-50 cursor-not-allowed" : ""}
                        >
                          {hasIncompleteItems ? (
                            <>
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Tasks Pending
                            </>
                          ) : (
                            "Generate Invoice"
                          )}
                        </Button>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Job Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-md mx-auto" aria-describedby="job-details-description">
          <DialogHeader>
            <DialogTitle>Job Card Details</DialogTitle>
          </DialogHeader>
          <div id="job-details-description" className="sr-only">
            Detailed information about the selected job card including customer details, complaint, and spare parts used.
          </div>
          
          {selectedJob && (
            <div className="space-y-4">
              {/* Customer Info */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Customer Information</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span>{selectedJob.customer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone:</span>
                    <span>{selectedJob.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bike Number:</span>
                    <span>{selectedJob.bike_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span>{formatDate(selectedJob.created_at)}</span>
                  </div>
                </div>
              </div>

              {/* Complaint */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Complaint</h4>
                <p className="text-sm bg-muted/30 p-3 rounded">{selectedJob.complaint}</p>
              </div>

              {/* Spare Parts */}
              {selectedJob.spareParts && selectedJob.spareParts.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Spare Parts Used</h4>
                  <div className="space-y-2">
                    {selectedJob.spareParts.map((part: any, index: number) => (
                      <div key={index} className="flex justify-between text-sm bg-muted/30 p-2 rounded">
                        <span>
                          {part.partNumber ? `PN: ${part.partNumber} — ${part.name}` : part.name} x{part.quantity}
                        </span>
                        <span>₹{(part.price * part.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Totals */}
              <div className="space-y-2 border-t pt-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Service Charge:</span>
                  <span>₹{selectedJob.service_charge || 0}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Total Amount:</span>
                  <span>₹{selectedJob.total_amount || 0}</span>
                </div>
              </div>

              {/* Action Button */}
              <Button 
                className="w-full" 
                onClick={() => {
                  setIsDetailsOpen(false);
                  navigate(`/invoice/${selectedJob.id}`);
                }}
              >
                Generate Invoice
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
