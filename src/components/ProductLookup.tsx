
import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';
import { normalizeText } from '@/lib/ocr';
import { toast } from 'sonner';

type Product = {
  produto: string;
  corredor: number;
  loja: string;
};

type CorridorProducts = {
  corredor: number;
  produtos: string[];
};

const ProductLookup: React.FC = () => {
  const [store, setStore] = useState<string>('Dal Pozzo Vila Bela');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [corridorProducts, setCorridorProducts] = useState<CorridorProducts[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);

  // Load initial data on component mount
  useEffect(() => {
    if (isInitialLoad) {
      loadAllProducts();
    }
  }, [isInitialLoad, store]);

  const loadAllProducts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('produto')
        .select('produto, corredor')
        .eq('loja', store)
        .order('corredor', { ascending: true });

      if (error) {
        console.error('Error loading products:', error);
        toast.error('Erro ao carregar produtos');
        return;
      }

      if (data) {
        // Group products by corridor
        const groupedByAisle = groupProductsByAisle(data as Product[]);
        setCorridorProducts(groupedByAisle);
        setIsInitialLoad(false);
      }
    } catch (error) {
      console.error('Error in loadAllProducts:', error);
      toast.error('Erro ao carregar produtos');
    } finally {
      setIsLoading(false);
    }
  };

  const searchProducts = async () => {
    if (!searchQuery.trim()) {
      loadAllProducts();
      return;
    }

    setIsLoading(true);
    try {
      const normalizedQuery = normalizeText(searchQuery);
      const { data, error } = await supabase
        .from('produto')
        .select('produto, corredor')
        .eq('loja', store)
        .ilike('produto', `%${normalizedQuery}%`)
        .order('corredor', { ascending: true });

      if (error) {
        console.error('Error searching products:', error);
        toast.error('Erro ao pesquisar produtos');
        return;
      }

      if (data && data.length > 0) {
        // Group products by corridor
        const groupedByAisle = groupProductsByAisle(data as Product[]);
        setCorridorProducts(groupedByAisle);
      } else {
        setCorridorProducts([]);
        toast.error('Nenhum produto encontrado');
      }
    } catch (error) {
      console.error('Error in searchProducts:', error);
      toast.error('Erro ao pesquisar produtos');
    } finally {
      setIsLoading(false);
    }
  };

  const groupProductsByAisle = (products: Product[]): CorridorProducts[] => {
    // Group products by corridor
    const corridorMap: Record<number, string[]> = {};
    
    products.forEach(product => {
      if (!corridorMap[product.corredor]) {
        corridorMap[product.corredor] = [];
      }
      corridorMap[product.corredor].push(product.produto);
    });
    
    // Convert map to array of CorridorProducts
    return Object.keys(corridorMap).map(corridor => ({
      corredor: parseInt(corridor),
      produtos: corridorMap[parseInt(corridor)]
    })).sort((a, b) => a.corredor - b.corredor);
  };

  const handleStoreChange = (value: string) => {
    setStore(value);
    setIsInitialLoad(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchProducts();
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Consulta de produtos</h1>
      
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
        <div className="w-full md:w-64">
          <Select value={store} onValueChange={handleStoreChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione a loja" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Dal Pozzo Vila Bela">Dal Pozzo Vila Bela</SelectItem>
              <SelectItem value="Dal Pozzo Cidade dos Lagos">Dal Pozzo Cidade dos Lagos</SelectItem>
              <SelectItem value="Dal Pozzo Home Center">Dal Pozzo Home Center</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-1 gap-2">
          <div className="flex-1">
            <Input
              placeholder="Palavra chave"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full"
            />
          </div>
          <Button onClick={searchProducts} className="bg-emerald-500 hover:bg-emerald-600" disabled={isLoading}>
            <Search className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-10">
          <p>Carregando...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Corredor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produtos
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {corridorProducts.length > 0 ? (
                  corridorProducts.map((item) => (
                    <tr key={item.corredor}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.corredor}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {item.produtos.join(', ')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="px-6 py-4 text-center text-sm text-gray-500">
                      Nenhum produto encontrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductLookup;
