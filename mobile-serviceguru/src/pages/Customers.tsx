import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Phone, 
  Calendar,
  IndianRupee,
  FileText,
  Edit,
  Trash2
} from 'lucide-react';
import { User, db, DatabaseManager, Customer } from '../lib/database';
import MobileHeader from '../components/MobileHeader';
import MobileNavigation from '../components/MobileNavigation';
import LoadingSpinner from '../components/LoadingSpinner';

interface CustomersPageProps {
  user: User;
}

const CustomersPage: React.FC<CustomersPageProps> = ({ user }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    bike_number: '',
    notes: ''
  });

  useEffect(() => {
    loadCustomers();
  }, [user.garage_id]);

  useEffect(() => {
    // Filter customers based on search term
    const filtered = customers.filter(customer => 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm) ||
      customer.bike_number.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCustomers(filtered);
  }, [customers, searchTerm]);

  const loadCustomers = async () => {
    try {
      setIsLoading(true);
      const customerData = await db.customers
        .where('garage_id')
        .equals(user.garage_id)
        .reverse()
        .toArray();
      
      setCustomers(customerData);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.phone.trim() || !formData.bike_number.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      // Check for duplicate bike number
      const existingCustomer = await db.customers
        .where('garage_id')
        .equals(user.garage_id)
        .and(customer => customer.bike_number.toLowerCase() === formData.bike_number.toLowerCase())
        .first();

      if (existingCustomer) {
        alert('A customer with this bike number already exists!');
        return;
      }

      const newCustomer: Customer = {
        id: crypto.randomUUID(),
        garage_id: user.garage_id,
        name: formData.name,
        phone: formData.phone,
        bike_number: formData.bike_number.toUpperCase(),
        notes: formData.notes || undefined,
        total_jobs: 0,
        total_spent: 0,
        created_at: new Date(),
        sync_status: 'pending'
      };

      await db.customers.add(newCustomer);
      
      // Add to sync log
      await DatabaseManager.addSyncLog('customers', newCustomer.id, 'insert', newCustomer);

      // Reset form and reload
      setFormData({ name: '', phone: '', bike_number: '', notes: '' });
      setShowAddForm(false);
      loadCustomers();

      alert('Customer added successfully!');
    } catch (error) {
      console.error('Error adding customer:', error);
      alert('Failed to add customer');
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (!confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      return;
    }

    try {
      await db.customers.delete(customerId);
      await DatabaseManager.addSyncLog('customers', customerId, 'delete', { id: customerId });
      loadCustomers();
      alert('Customer deleted successfully!');
    } catch (error) {
      console.error('Error deleting customer:', error);
      alert('Failed to delete customer');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MobileHeader title="Customers" showBack />
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <MobileHeader 
        title="Customers"
        showBack
        rightAction={{
          icon: <Plus className="w-5 h-5" />,
          onClick: () => setShowAddForm(true)
        }}
      />

      <div className="mobile-container pt-6 pb-8">
        
        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name, phone, or bike number"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mobile-input pl-10"
          />
        </div>

        {/* Add Customer Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Customer</h3>
              
              <form onSubmit={handleAddCustomer} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="mobile-input"
                    placeholder="Enter customer name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="mobile-input"
                    placeholder="Enter phone number"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bike Number *
                  </label>
                  <input
                    type="text"
                    value={formData.bike_number}
                    onChange={(e) => setFormData({...formData, bike_number: e.target.value.toUpperCase()})}
                    className="mobile-input"
                    placeholder="Enter bike number"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="mobile-input resize-none"
                    rows={3}
                    placeholder="Any additional notes"
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
                    Add Customer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Customers List */}
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No customers found' : 'No customers yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm ? 'Try adjusting your search term' : 'Add your first customer to get started'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="mobile-button max-w-xs mx-auto"
              >
                Add First Customer
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCustomers.map((customer) => (
              <div key={customer.id} className="mobile-card">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {customer.name}
                      </h3>
                      {customer.sync_status === 'pending' && (
                        <div className="w-2 h-2 bg-orange-400 rounded-full" title="Pending sync" />
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{customer.phone}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <FileText className="w-4 h-4" />
                        <span>{customer.bike_number}</span>
                      </div>
                      
                      {customer.last_visit && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>Last visit: {new Date(customer.last_visit).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="flex items-center space-x-1 text-gray-600">
                          <FileText className="w-4 h-4" />
                          <span>{customer.total_jobs} jobs</span>
                        </span>
                        <span className="flex items-center space-x-1 text-green-600">
                          <IndianRupee className="w-4 h-4" />
                          <span>₹{customer.total_spent}</span>
                        </span>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button 
                          className="p-2 text-gray-400 hover:text-blue-600"
                          onClick={() => {
                            // Edit customer functionality - to be implemented
                            alert('Edit customer feature coming soon!');
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          className="p-2 text-gray-400 hover:text-red-600"
                          onClick={() => handleDeleteCustomer(customer.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <MobileNavigation userRole={user.role} />
    </div>
  );
};

export default CustomersPage;