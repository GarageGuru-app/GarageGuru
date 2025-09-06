import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Package,
  Scan,
  AlertTriangle,
  Edit,
  Trash2,
  IndianRupee
} from 'lucide-react';
import { User, db, DatabaseManager, SparePart } from '../lib/database';
import MobileHeader from '../components/MobileHeader';
import MobileNavigation from '../components/MobileNavigation';
import LoadingSpinner from '../components/LoadingSpinner';

interface SparePartsPageProps {
  user: User;
}

const SparePartsPage: React.FC<SparePartsPageProps> = ({ user }) => {
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [filteredParts, setFilteredParts] = useState<SparePart[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    part_number: '',
    price: '',
    quantity: '',
    low_stock_threshold: '',
    cost_price: '',
    barcode: ''
  });

  useEffect(() => {
    loadSpareParts();
  }, [user.garage_id]);

  useEffect(() => {
    filterParts();
  }, [spareParts, searchTerm, stockFilter]);

  const loadSpareParts = async () => {
    try {
      setIsLoading(true);
      const partsData = await db.spare_parts
        .where('garage_id')
        .equals(user.garage_id)
        .reverse()
        .toArray();
      
      setSpareParts(partsData);
    } catch (error) {
      console.error('Error loading spare parts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterParts = () => {
    let filtered = spareParts;

    // Filter by stock status
    if (stockFilter === 'low_stock') {
      filtered = filtered.filter(part => part.quantity <= part.low_stock_threshold);
    } else if (stockFilter === 'out_of_stock') {
      filtered = filtered.filter(part => part.quantity === 0);
    } else if (stockFilter === 'in_stock') {
      filtered = filtered.filter(part => part.quantity > part.low_stock_threshold);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(part => 
        part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.part_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.barcode?.includes(searchTerm)
      );
    }

    setFilteredParts(filtered);
  };

  const handleAddPart = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.price || !formData.quantity) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      // Check for duplicate part number if provided
      if (formData.part_number) {
        const existingPart = await db.spare_parts
          .where('garage_id')
          .equals(user.garage_id)
          .and(part => part.part_number === formData.part_number)
          .first();

        if (existingPart) {
          alert('A part with this part number already exists!');
          return;
        }
      }

      const newPart: SparePart = {
        id: crypto.randomUUID(),
        garage_id: user.garage_id,
        name: formData.name,
        part_number: formData.part_number || undefined,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
        low_stock_threshold: parseInt(formData.low_stock_threshold) || 5,
        cost_price: formData.cost_price ? parseFloat(formData.cost_price) : undefined,
        barcode: formData.barcode || undefined,
        created_at: new Date(),
        sync_status: 'pending'
      };

      await db.spare_parts.add(newPart);
      
      // Add to sync log
      await DatabaseManager.addSyncLog('spare_parts', newPart.id, 'insert', newPart);

      // Reset form and reload
      setFormData({
        name: '',
        part_number: '',
        price: '',
        quantity: '',
        low_stock_threshold: '',
        cost_price: '',
        barcode: ''
      });
      setShowAddForm(false);
      loadSpareParts();

      alert('Spare part added successfully!');
    } catch (error) {
      console.error('Error adding spare part:', error);
      alert('Failed to add spare part');
    }
  };

  const handleDeletePart = async (partId: string) => {
    if (!confirm('Are you sure you want to delete this spare part?')) {
      return;
    }

    try {
      await db.spare_parts.delete(partId);
      await DatabaseManager.addSyncLog('spare_parts', partId, 'delete', { id: partId });
      loadSpareParts();
      alert('Spare part deleted successfully!');
    } catch (error) {
      console.error('Error deleting spare part:', error);
      alert('Failed to delete spare part');
    }
  };

  const startBarcodeScan = async () => {
    try {
      setShowScanner(true);
      // In a real implementation, this would open camera scanner
      // For demo, we'll simulate a scan
      setTimeout(() => {
        const sampleBarcode = '1234567890123';
        setFormData({...formData, barcode: sampleBarcode});
        setShowScanner(false);
        alert('Barcode scanned: ' + sampleBarcode);
      }, 2000);
    } catch (error) {
      console.error('Barcode scan error:', error);
      setShowScanner(false);
      alert('Camera access failed. Please enter barcode manually.');
    }
  };

  const getStockStatus = (part: SparePart) => {
    if (part.quantity === 0) return { text: 'Out of Stock', color: 'text-red-600 bg-red-100' };
    if (part.quantity <= part.low_stock_threshold) return { text: 'Low Stock', color: 'text-orange-600 bg-orange-100' };
    return { text: 'In Stock', color: 'text-green-600 bg-green-100' };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MobileHeader title="Spare Parts" showBack />
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <MobileHeader 
        title="Spare Parts"
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
            placeholder="Search by name, part number, or barcode"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mobile-input pl-10 pr-12"
          />
          <button
            onClick={startBarcodeScan}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-600"
          >
            <Scan className="w-5 h-5" />
          </button>
        </div>

        {/* Stock Filter */}
        <div className="flex space-x-2 mb-6 overflow-x-auto">
          {[
            { key: 'all', label: 'All', count: spareParts.length },
            { key: 'in_stock', label: 'In Stock', count: spareParts.filter(p => p.quantity > p.low_stock_threshold).length },
            { key: 'low_stock', label: 'Low Stock', count: spareParts.filter(p => p.quantity <= p.low_stock_threshold && p.quantity > 0).length },
            { key: 'out_of_stock', label: 'Out of Stock', count: spareParts.filter(p => p.quantity === 0).length }
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => setStockFilter(filter.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                stockFilter === filter.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              {filter.label} ({filter.count})
            </button>
          ))}
        </div>

        {/* Barcode Scanner Modal */}
        {showScanner && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 m-4 text-center">
              <div className="w-32 h-32 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <Scan className="w-12 h-12 text-gray-400 animate-pulse" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Scanning Barcode...</h3>
              <p className="text-gray-600 mb-4">Point camera at barcode</p>
              <button
                onClick={() => setShowScanner(false)}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Add Part Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 w-full max-w-md my-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Spare Part</h3>
              
              <form onSubmit={handleAddPart} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Part Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="mobile-input"
                    placeholder="Enter part name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Part Number
                  </label>
                  <input
                    type="text"
                    value={formData.part_number}
                    onChange={(e) => setFormData({...formData, part_number: e.target.value})}
                    className="mobile-input"
                    placeholder="Enter part number"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Selling Price (₹) *
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      className="mobile-input"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cost Price (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.cost_price}
                      onChange={(e) => setFormData({...formData, cost_price: e.target.value})}
                      className="mobile-input"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                      className="mobile-input"
                      placeholder="0"
                      min="0"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Low Stock Alert
                    </label>
                    <input
                      type="number"
                      value={formData.low_stock_threshold}
                      onChange={(e) => setFormData({...formData, low_stock_threshold: e.target.value})}
                      className="mobile-input"
                      placeholder="5"
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Barcode
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.barcode}
                      onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                      className="mobile-input pr-12"
                      placeholder="Scan or enter barcode"
                    />
                    <button
                      type="button"
                      onClick={startBarcodeScan}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    >
                      <Scan className="w-5 h-5" />
                    </button>
                  </div>
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
                    Add Part
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Parts List */}
        {filteredParts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || stockFilter !== 'all' ? 'No parts found' : 'No spare parts yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || stockFilter !== 'all' 
                ? 'Try adjusting your search or filter'
                : 'Add your first spare part to get started'
              }
            </p>
            {!searchTerm && stockFilter === 'all' && (
              <button
                onClick={() => setShowAddForm(true)}
                className="mobile-button max-w-xs mx-auto"
              >
                Add First Part
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredParts.map((part) => {
              const stockStatus = getStockStatus(part);
              const profit = part.cost_price ? part.price - part.cost_price : 0;
              const profitMargin = part.cost_price ? ((profit / part.price) * 100) : 0;

              return (
                <div key={part.id} className="mobile-card">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {part.name}
                        </h3>
                        {part.sync_status === 'pending' && (
                          <div className="w-2 h-2 bg-orange-400 rounded-full" title="Pending sync" />
                        )}
                      </div>
                      {part.part_number && (
                        <p className="text-sm text-gray-600 mb-2">
                          Part #: {part.part_number}
                        </p>
                      )}
                    </div>
                    
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                      {stockStatus.text}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-500">Quantity</p>
                      <p className="text-lg font-bold text-gray-900">{part.quantity}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Price</p>
                      <p className="text-lg font-bold text-green-600">₹{part.price}</p>
                    </div>
                  </div>

                  {part.cost_price && (
                    <div className="p-3 bg-gray-50 rounded-lg mb-3">
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <p className="text-gray-500">Cost</p>
                          <p className="font-medium">₹{part.cost_price}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Profit</p>
                          <p className="font-medium text-green-600">₹{profit.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Margin</p>
                          <p className="font-medium text-blue-600">{profitMargin.toFixed(1)}%</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {part.quantity <= part.low_stock_threshold && (
                    <div className="flex items-center space-x-2 p-2 bg-orange-50 rounded-lg mb-3">
                      <AlertTriangle className="w-4 h-4 text-orange-600" />
                      <span className="text-sm text-orange-800">
                        Low stock alert (threshold: {part.low_stock_threshold})
                      </span>
                    </div>
                  )}

                  {part.barcode && (
                    <p className="text-xs text-gray-500 mb-3">
                      Barcode: {part.barcode}
                    </p>
                  )}

                  <div className="flex justify-end space-x-2">
                    <button 
                      className="p-2 text-gray-400 hover:text-blue-600"
                      onClick={() => {
                        alert('Edit part feature coming soon!');
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      className="p-2 text-gray-400 hover:text-red-600"
                      onClick={() => handleDeletePart(part.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <MobileNavigation userRole={user.role} />
    </div>
  );
};

export default SparePartsPage;