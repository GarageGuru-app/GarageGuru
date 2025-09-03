import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowLeft, Search, Bike, Phone, Calendar, Eye, Edit, AlertCircle, CheckCircle, Share, Save, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";


export default function PendingServices() {
  const [, navigate] = useLocation();
  const { garage } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [checklistJob, setChecklistJob] = useState<any>(null);
  const [checklistItems, setChecklistItems] = useState<string>("");
  const [jobToDelete, setJobToDelete] = useState<any>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const { data: pendingJobs = [], isLoading } = useQuery({
    queryKey: ["/api/garages", garage?.id, "job-cards", "pending"],
    queryFn: async () => {
      if (!garage?.id) return [];
      const response = await apiRequest("GET", `/api/garages/${garage.id}/job-cards?status=pending`);
      return response.json();
    },
    enabled: !!garage?.id,
  });

  // Fetch all invoices to check for duplicates
  const { data: existingInvoices } = useQuery({
    queryKey: ["/api/garages", garage?.id, "invoices"],
    queryFn: async () => {
      if (!garage?.id) return [];
      const response = await apiRequest("GET", `/api/garages/${garage.id}/invoices`);
      return response.json();
    },
    enabled: !!garage?.id,
  });

  // Helper function to check if invoice exists for job
  const hasExistingInvoice = (jobId: string) => {
    return existingInvoices?.some((invoice: any) => 
      invoice.job_card_id === jobId || invoice.jobCardId === jobId
    );
  };

  const filteredJobs = pendingJobs.filter((job: any) =>
    job.customer_name?.toLowerCase?.()?.includes(searchTerm.toLowerCase()) ||
    job.bike_number?.toLowerCase?.()?.includes(searchTerm.toLowerCase()) ||
    job.phone?.includes(searchTerm)
  );

  // Update job card mutation
  const updateJobCardMutation = useMutation({
    mutationFn: async ({ jobId, complaint }: { jobId: string; complaint: string }) => {
      if (!garage?.id) throw new Error("No garage selected");
      const response = await apiRequest("PUT", `/api/garages/${garage.id}/job-cards/${jobId}`, {
        complaint
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/garages", garage?.id, "job-cards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/garages", garage?.id, "job-cards", "pending"] });
      toast({
        title: "Success",
        description: "Service tasks updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update tasks",
        variant: "destructive",
      });
    },
  });

  const deleteJobCardMutation = useMutation({
    mutationFn: async (jobId: string) => {
      if (!garage?.id) throw new Error("No garage selected");
      
      const response = await apiRequest("DELETE", `/api/garages/${garage.id}/job-cards/${jobId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Job card deleted successfully. Spare parts have been returned to inventory.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/garages", garage?.id, "job-cards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/garages", garage?.id, "job-cards", "pending"] });
      setIsDeleteConfirmOpen(false);
      setJobToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to delete job card",
        variant: "destructive",
      });
    },
  });

  const toggleChecklistItem = (lineIndex: number) => {
    const lines = checklistItems.split('\n');
    if (lines[lineIndex]) {
      if (lines[lineIndex].includes('☐')) {
        lines[lineIndex] = lines[lineIndex].replace('☐', '☑');
      } else if (lines[lineIndex].includes('☑')) {
        lines[lineIndex] = lines[lineIndex].replace('☑', '☐');
      }
      setChecklistItems(lines.join('\n'));
    }
  };

  const handleSaveChecklist = () => {
    if (checklistJob) {
      updateJobCardMutation.mutate({
        jobId: checklistJob.id,
        complaint: checklistItems
      });
    }
  };

  const isChecklistComplete = () => {
    return checklistItems && !checklistItems.includes('☐');
  };

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
                        {job.complaint.split('\n').filter((line: string) => line.trim()).map((line: string, index: number) => {
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

                  <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end sm:space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedJob(job);
                        setIsDetailsOpen(true);
                      }}
                      className="text-xs px-2 py-1"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigate(`/edit-job-card/${job.id}`);
                      }}
                      className="text-xs px-2 py-1"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setJobToDelete(job);
                        setIsDeleteConfirmOpen(true);
                      }}
                      className="text-xs px-2 py-1 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setChecklistJob(job);
                        setChecklistItems(job.complaint || "");
                        setIsChecklistOpen(true);
                      }}
                      className="text-xs px-2 py-1"
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Complete
                    </Button>
                    {(() => {
                      const hasChecklist = job.complaint && (job.complaint.includes('☐') || job.complaint.includes('☑'));
                      const hasIncompleteItems = hasChecklist && job.complaint.includes('☐');
                      const invoiceExists = hasExistingInvoice(job.id);
                      
                      return (
                        <Button
                          size="sm"
                          onClick={() => {
                            if (invoiceExists) {
                              toast({
                                title: "Invoice Already Exists",
                                description: "This service already has an invoice. Cannot create duplicates.",
                                variant: "destructive",
                              });
                            } else if (hasIncompleteItems) {
                              toast({
                                title: "Incomplete Tasks",
                                description: "Please complete all checklist items before generating invoice",
                                variant: "destructive",
                              });
                            } else {
                              navigate(`/invoice/${job.id}`);
                            }
                          }}
                          disabled={hasIncompleteItems || invoiceExists}
                          className={`text-xs px-2 py-1 ${(hasIncompleteItems || invoiceExists) ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          {invoiceExists ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Invoice Created
                            </>
                          ) : hasIncompleteItems ? (
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
                onClick={() => {
                  const invoiceExists = hasExistingInvoice(selectedJob.id);
                  const hasChecklist = selectedJob.complaint && (selectedJob.complaint.includes('☐') || selectedJob.complaint.includes('☑'));
                  const hasIncompleteItems = hasChecklist && selectedJob.complaint.includes('☐');
                  
                  if (invoiceExists) {
                    toast({
                      title: "Invoice Already Exists",
                      description: "This service already has an invoice. Cannot create duplicates.",
                      variant: "destructive",
                    });
                  } else if (hasIncompleteItems) {
                    toast({
                      title: "Incomplete Tasks",
                      description: "Please complete all checklist items before generating invoice",
                      variant: "destructive",
                    });
                  } else {
                    setIsDetailsOpen(false);
                    navigate(`/invoice/${selectedJob.id}`);
                  }
                }}
                disabled={hasExistingInvoice(selectedJob?.id) || (selectedJob?.complaint && selectedJob.complaint.includes('☐'))}
                className={(hasExistingInvoice(selectedJob?.id) || (selectedJob?.complaint && selectedJob.complaint.includes('☐'))) ? "opacity-50 cursor-not-allowed w-full" : "w-full"}
              >
                {hasExistingInvoice(selectedJob?.id) ? "Invoice Already Created" : 
                 (selectedJob?.complaint && selectedJob.complaint.includes('☐')) ? "Tasks Pending" : 
                 "Generate Invoice"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Checklist Completion Modal */}
      {isChecklistOpen && (
        <Dialog open={isChecklistOpen} onOpenChange={setIsChecklistOpen}>
          <DialogContent className="max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle>Complete Service Tasks</DialogTitle>
            </DialogHeader>
          
          {checklistJob && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <strong>{checklistJob.customer_name}</strong> - {checklistJob.bike_number}
              </div>
              
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {checklistItems.split('\n').filter((line: string) => line.trim()).map((line: string, index: number) => {
                  const isCheckbox = line.includes('☐') || line.includes('☑');
                  if (!isCheckbox) return null;
                  
                  const isCompleted = line.includes('☑');
                  const text = line.replace(/[☐☑]\s*/, '').trim();
                  
                  return (
                    <div 
                      key={index} 
                      className="flex items-center space-x-3 p-2 rounded border cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleChecklistItem(index)}
                    >
                      <div className={`text-lg ${isCompleted ? 'text-green-600' : 'text-orange-500'}`}>
                        {isCompleted ? '☑' : '☐'}
                      </div>
                      <div className={`flex-1 text-sm ${isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {text}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  onClick={handleSaveChecklist}
                  disabled={updateJobCardMutation.isPending}
                  variant="outline"
                  className="flex-1"
                >
                  {updateJobCardMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Progress
                    </>
                  )}
                </Button>
                
                {isChecklistComplete() && (
                  <Button 
                    onClick={() => {
                      const invoiceExists = hasExistingInvoice(checklistJob.id);
                      if (invoiceExists) {
                        toast({
                          title: "Invoice Already Exists",
                          description: "This service already has an invoice. Cannot create duplicates.",
                          variant: "destructive",
                        });
                      } else {
                        handleSaveChecklist();
                        setTimeout(() => {
                          setIsChecklistOpen(false);
                          navigate(`/invoice/${checklistJob.id}`);
                        }, 500);
                      }
                    }}
                    disabled={updateJobCardMutation.isPending || hasExistingInvoice(checklistJob?.id)}
                    className="flex-1"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {hasExistingInvoice(checklistJob?.id) ? "Invoice Already Created" : "Generate Invoice"}
                  </Button>
                )}
              </div>
              
              {!isChecklistComplete() && (
                <div className="text-center text-sm text-muted-foreground bg-orange-50 dark:bg-orange-900/20 p-2 rounded">
                  Complete all tasks to generate invoice
                </div>
              )}
            </div>
          )}
        </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Job Card</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this job card for {jobToDelete?.customer_name}? 
              This action cannot be undone. All spare parts used in this job will be returned to inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (jobToDelete) {
                  deleteJobCardMutation.mutate(jobToDelete.id);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteJobCardMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
