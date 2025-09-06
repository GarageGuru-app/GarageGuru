import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Wrench, 
  Clock, 
  CheckCircle,
  FileText,
  IndianRupee,
  Package
} from 'lucide-react';
import { User, db, DatabaseManager, JobCard, Customer } from '../lib/database';
import MobileHeader from '../components/MobileHeader';
import MobileNavigation from '../components/MobileNavigation';
import LoadingSpinner from '../components/LoadingSpinner';

interface JobCardsPageProps {
  user: User;
}

interface JobCardWithCustomer extends JobCard {
  customer?: Customer;
}

const JobCardsPage: React.FC<JobCardsPageProps> = ({ user }) => {
  const [jobCards, setJobCards] = useState<JobCardWithCustomer[]>([]);
  const [filteredJobCards, setFilteredJobCards] = useState<JobCardWithCustomer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [formData, setFormData] = useState({
    customer_id: '',
    complaint: '',
    service_charges: ''
  });

  useEffect(() => {
    loadData();
  }, [user.garage_id]);

  useEffect(() => {
    filterJobCards();
  }, [jobCards, searchTerm, statusFilter]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load customers
      const customerData = await db.customers
        .where('garage_id')
        .equals(user.garage_id)
        .toArray();
      setCustomers(customerData);

      // Load job cards
      const jobCardData = await db.job_cards
        .where('garage_id')
        .equals(user.garage_id)
        .reverse()
        .toArray();

      // Add customer data to job cards
      const jobCardsWithCustomers = await Promise.all(
        jobCardData.map(async (job) => {
          const customer = await db.customers.get(job.customer_id);
          return { ...job, customer };
        })
      );

      setJobCards(jobCardsWithCustomers);
    } catch (error) {
      console.error('Error loading job cards:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterJobCards = () => {
    let filtered = jobCards;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(job => job.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(job => 
        job.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.complaint.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.customer?.bike_number.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredJobCards(filtered);
  };

  const handleAddJobCard = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customer_id || !formData.complaint.trim() || !formData.service_charges) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const newJobCard: JobCard = {
        id: crypto.randomUUID(),
        garage_id: user.garage_id,
        customer_id: formData.customer_id,
        complaint: formData.complaint,
        service_charges: parseFloat(formData.service_charges),
        status: 'pending',
        spare_parts_used: [],
        created_at: new Date(),
        sync_status: 'pending'
      };

      await db.job_cards.add(newJobCard);
      
      // Add to sync log
      await DatabaseManager.addSyncLog('job_cards', newJobCard.id, 'insert', newJobCard);

      // Reset form and reload
      setFormData({ customer_id: '', complaint: '', service_charges: '' });
      setShowAddForm(false);
      loadData();

      alert('Job card created successfully!');
    } catch (error) {
      console.error('Error adding job card:', error);
      alert('Failed to create job card');
    }
  };

  const updateJobStatus = async (jobId: string, newStatus: JobCard['status']) => {
    try {
      await db.job_cards.update(jobId, { 
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date() : undefined,
        sync_status: 'pending'
      });
      
      await DatabaseManager.addSyncLog('job_cards', jobId, 'update', { status: newStatus });
      loadData();
      alert('Job status updated!');
    } catch (error) {
      console.error('Error updating job status:', error);
      alert('Failed to update job status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-orange-600 bg-orange-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'invoiced': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'in_progress': return <Wrench className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'invoiced': return <FileText className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MobileHeader title="Job Cards" showBack />
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <MobileHeader 
        title="Job Cards"
        showBack
        rightAction={{
          icon: <Plus className="w-5 h-5" />,
          onClick: () => setShowAddForm(true)
        }}
      />

      <div className="mobile-container pt-6 pb-8">
        
        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by customer name or complaint"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mobile-input pl-10"
          />
        </div>

        {/* Status Filter */}
        <div className="flex space-x-2 mb-6 overflow-x-auto">
          {[
            { key: 'all', label: 'All', count: jobCards.length },
            { key: 'pending', label: 'Pending', count: jobCards.filter(j => j.status === 'pending').length },
            { key: 'in_progress', label: 'In Progress', count: jobCards.filter(j => j.status === 'in_progress').length },
            { key: 'completed', label: 'Completed', count: jobCards.filter(j => j.status === 'completed').length }
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => setStatusFilter(filter.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                statusFilter === filter.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              {filter.label} ({filter.count})
            </button>
          ))}
        </div>

        {/* Add Job Card Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Job Card</h3>
              
              <form onSubmit={handleAddJobCard} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Customer *
                  </label>
                  <select
                    value={formData.customer_id}
                    onChange={(e) => setFormData({...formData, customer_id: e.target.value})}
                    className="mobile-input"
                    required
                  >
                    <option value="">Choose a customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} - {customer.bike_number}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Complaint/Issue *
                  </label>
                  <textarea
                    value={formData.complaint}
                    onChange={(e) => setFormData({...formData, complaint: e.target.value})}
                    className="mobile-input resize-none"
                    rows={3}
                    placeholder="Describe the problem or service needed"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Charges (₹) *
                  </label>
                  <input
                    type="number"
                    value={formData.service_charges}
                    onChange={(e) => setFormData({...formData, service_charges: e.target.value})}
                    className="mobile-input"
                    placeholder="Enter service charges"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 mobile-button"
                  >
                    Create Job Card
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Job Cards List */}
        {filteredJobCards.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || statusFilter !== 'all' ? 'No job cards found' : 'No job cards yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter'
                : 'Create your first job card to track work'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <button
                onClick={() => setShowAddForm(true)}
                className="mobile-button max-w-xs mx-auto"
              >
                Create First Job Card
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJobCards.map((job) => (
              <div key={job.id} className="mobile-card">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {job.customer?.name || 'Unknown Customer'}
                      </h3>
                      {job.sync_status === 'pending' && (
                        <div className="w-2 h-2 bg-orange-400 rounded-full" title="Pending sync" />
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      Vehicle: {job.customer?.bike_number}
                    </p>
                  </div>
                  
                  <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(job.status)}`}>
                    {getStatusIcon(job.status)}
                    <span>{job.status.replace('_', ' ')}</span>
                  </span>
                </div>

                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700 mb-1">Complaint:</p>
                  <p className="text-sm text-gray-600">{job.complaint}</p>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-1 text-green-600">
                    <IndianRupee className="w-4 h-4" />
                    <span className="font-semibold">₹{job.service_charges}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    Created: {new Date(job.created_at).toLocaleDateString()}
                  </span>
                </div>

                {job.spare_parts_used.length > 0 && (
                  <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Package className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Parts Used:</span>
                    </div>
                    {job.spare_parts_used.map((part, index) => (
                      <div key={index} className="flex justify-between text-sm text-gray-600">
                        <span>{part.name} x{part.quantity}</span>
                        <span>₹{part.price * part.quantity}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Status Update Buttons */}
                {job.status !== 'invoiced' && (
                  <div className="flex space-x-2 mt-3 pt-3 border-t border-gray-100">
                    {job.status === 'pending' && (
                      <button
                        onClick={() => updateJobStatus(job.id, 'in_progress')}
                        className="flex-1 bg-blue-100 text-blue-700 py-2 rounded-lg text-sm font-medium"
                      >
                        Start Work
                      </button>
                    )}
                    {job.status === 'in_progress' && (
                      <button
                        onClick={() => updateJobStatus(job.id, 'completed')}
                        className="flex-1 bg-green-100 text-green-700 py-2 rounded-lg text-sm font-medium"
                      >
                        Mark Complete
                      </button>
                    )}
                    {job.status === 'completed' && (
                      <button
                        onClick={() => {
                          // Navigate to invoice creation - to be implemented
                          alert('Invoice creation coming soon!');
                        }}
                        className="flex-1 bg-purple-100 text-purple-700 py-2 rounded-lg text-sm font-medium"
                      >
                        Create Invoice
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <MobileNavigation userRole={user.role} />
    </div>
  );
};

export default JobCardsPage;