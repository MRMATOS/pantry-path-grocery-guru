
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { PantryItem } from '@/lib/supabase';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const PantryPage: React.FC = () => {
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'expiration' | 'quantity'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Load pantry items from localStorage on component mount
  useEffect(() => {
    const savedItems = localStorage.getItem('pantryItems');
    if (savedItems) {
      try {
        const parsedItems = JSON.parse(savedItems);
        setPantryItems(parsedItems);
      } catch (error) {
        console.error('Error parsing saved pantry items:', error);
      }
    }
  }, []);

  // Save pantry items to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('pantryItems', JSON.stringify(pantryItems));
  }, [pantryItems]);

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity < 0) return;
    
    setPantryItems(pantryItems.map(item => 
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    ));
  };

  const handleExpirationChange = (itemId: string, newDate: string) => {
    setPantryItems(pantryItems.map(item => 
      item.id === itemId ? { ...item, expiration_date: newDate } : item
    ));
  };

  const handleDeleteItem = (itemId: string) => {
    setPantryItems(pantryItems.filter(item => item.id !== itemId));
    toast.success("Item removed from pantry");
  };

  const toggleSort = (field: 'name' | 'expiration' | 'quantity') => {
    if (sortBy === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to ascending
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  const getSortedItems = () => {
    return [...pantryItems].sort((a, b) => {
      const multiplier = sortDirection === 'asc' ? 1 : -1;
      
      if (sortBy === 'name') {
        return multiplier * a.product_name.localeCompare(b.product_name);
      } 
      else if (sortBy === 'expiration') {
        // Handle null expiration dates (put them at the end)
        if (!a.expiration_date && !b.expiration_date) return 0;
        if (!a.expiration_date) return multiplier;
        if (!b.expiration_date) return -multiplier;
        return multiplier * (new Date(a.expiration_date).getTime() - new Date(b.expiration_date).getTime());
      }
      else if (sortBy === 'quantity') {
        return multiplier * (a.quantity - b.quantity);
      }
      
      return 0;
    });
  };

  const sortedItems = getSortedItems();

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">My Pantry</h1>
        <div className="flex space-x-2">
          <Button 
            variant={sortBy === 'name' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => toggleSort('name')}
          >
            Name {sortBy === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
          </Button>
          <Button 
            variant={sortBy === 'expiration' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => toggleSort('expiration')}
          >
            Expiration {sortBy === 'expiration' && (sortDirection === 'asc' ? '↑' : '↓')}
          </Button>
          <Button 
            variant={sortBy === 'quantity' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => toggleSort('quantity')}
          >
            Quantity {sortBy === 'quantity' && (sortDirection === 'asc' ? '↑' : '↓')}
          </Button>
        </div>
      </div>

      {pantryItems.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
          <p className="text-gray-500">
            Your pantry is empty. Add items from your shopping list.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expiration Date
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-800">
                      {item.product_name}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2 max-w-[120px]">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleQuantityChange(item.id || '', item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          -
                        </Button>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(item.id || '', parseInt(e.target.value) || 0)}
                          className="h-8 text-center"
                          min="1"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleQuantityChange(item.id || '', item.quantity + 1)}
                        >
                          +
                        </Button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="date"
                        value={item.expiration_date || ''}
                        onChange={(e) => handleExpirationChange(item.id || '', e.target.value)}
                        className="h-8"
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteItem(item.id || '')}
                        className="text-gray-500 hover:text-red-500"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default PantryPage;
