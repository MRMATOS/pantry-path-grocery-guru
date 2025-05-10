
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { normalizeText } from '@/lib/ocr';
import { supabase } from '@/integrations/supabase/client';

interface ProductInputProps {
  onProductsAdded: (products: any[]) => void;
  disabled: boolean;
}

const ProductInput: React.FC<ProductInputProps> = ({ 
  onProductsAdded,
  disabled
}) => {
  const [productInput, setProductInput] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [store, setStore] = useState('Dal Pozzo Vila Bela');

  const validateAndAddProducts = async () => {
    if (!productInput.trim()) {
      toast.error("Please enter a product name");
      return;
    }

    setIsValidating(true);

    try {
      // Split by commas to handle multiple products
      const productNames = productInput
        .split(',')
        .map(name => name.trim())
        .filter(name => name.length > 0);

      if (productNames.length === 0) {
        toast.error("Please enter valid product names");
        return;
      }

      const results: { valid: any[], invalid: string[] } = {
        valid: [],
        invalid: []
      };

      // Validate each product against Supabase
      for (const name of productNames) {
        const normalizedName = normalizeText(name);
        
        const { data, error } = await supabase
          .from('produto')
          .select('*')
          .eq('loja', store)
          .ilike('produto', `%${normalizedName}%`)
          .limit(1);

        if (error) {
          console.error("Supabase error:", error);
          toast.error("Error validating products");
          continue;
        }

        if (data && data.length > 0) {
          results.valid.push(data[0]);
        } else {
          results.invalid.push(name);
        }
      }

      // Show results to the user
      if (results.valid.length > 0) {
        onProductsAdded(results.valid);
        setProductInput('');
        toast.success(`Added ${results.valid.length} product(s)`);
      }

      if (results.invalid.length > 0) {
        toast.error(`${results.invalid.length} product(s) not found: ${results.invalid.join(', ')}`);
      }

    } catch (error) {
      console.error("Error validating products:", error);
      toast.error("Error validating products");
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="flex space-x-2 mb-6">
      <Input
        placeholder="Add products (e.g., arroz, leite, pão)"
        value={productInput}
        onChange={(e) => setProductInput(e.target.value)}
        disabled={disabled || isValidating}
        className="flex-grow"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            validateAndAddProducts();
          }
        }}
      />
      <Button 
        onClick={validateAndAddProducts} 
        disabled={disabled || isValidating || !productInput.trim()}
      >
        <Plus className="h-4 w-4 mr-1" />
        Add
      </Button>
    </div>
  );
};

export default ProductInput;
