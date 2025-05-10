
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
  currentStore: string;
}

const ProductInput: React.FC<ProductInputProps> = ({ 
  onProductsAdded,
  disabled,
  currentStore
}) => {
  const [productInput, setProductInput] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const validateAndAddProducts = async () => {
    if (!productInput.trim()) {
      toast.error("Por favor, digite um nome de produto");
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
        toast.error("Por favor, digite nomes de produtos válidos");
        return;
      }

      const results: { valid: any[], invalid: string[] } = {
        valid: [],
        invalid: []
      };

      // Validate each product against Supabase
      for (const name of productNames) {
        const normalizedName = normalizeText(name);
        
        console.log(`Validating product: "${normalizedName}" in store: ${currentStore}`);
        
        const { data, error } = await supabase
          .from('produto')
          .select('*')
          .eq('loja', currentStore)
          .ilike('produto', `%${normalizedName}%`)
          .limit(1);

        if (error) {
          console.error("Supabase error:", error);
          toast.error("Erro ao validar produtos");
          continue;
        }

        if (data && data.length > 0) {
          console.log(`Found match:`, data[0]);
          results.valid.push(data[0]);
        } else {
          console.log(`No match found for "${name}" in store: ${currentStore}`);
          results.invalid.push(name);
        }
      }

      // Show results to the user
      if (results.valid.length > 0) {
        onProductsAdded(results.valid);
        setProductInput('');
        toast.success(`Adicionado(s) ${results.valid.length} produto(s)`);
      }

      if (results.invalid.length > 0) {
        toast.error(`${results.invalid.length} produto(s) não encontrado(s): ${results.invalid.join(', ')}`);
      }

    } catch (error) {
      console.error("Error validating products:", error);
      toast.error("Erro ao validar produtos");
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="flex space-x-2 mb-6">
      <Input
        placeholder="Adicionar produtos (ex: arroz, leite, pão)"
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
        Adicionar
      </Button>
    </div>
  );
};

export default ProductInput;
