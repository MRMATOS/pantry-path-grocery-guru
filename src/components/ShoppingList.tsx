
import React from 'react';
import { Button } from '@/components/ui/button';
import { Product } from '@/lib/supabase';
import { Trash2, Archive } from 'lucide-react';
import { toast } from 'sonner';

interface ShoppingListProps {
  products: Product[];
  onRemoveProduct: (product: Product) => void;
  onClearList: () => void;
  onSaveToPantry: () => void;
}

const ShoppingList: React.FC<ShoppingListProps> = ({ 
  products, 
  onRemoveProduct,
  onClearList,
  onSaveToPantry
}) => {
  if (products.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
        <p className="text-gray-500">
          Sua lista de compras está vazia. Adicione produtos usando o campo acima ou escaneie um cupom fiscal.
        </p>
      </div>
    );
  }

  // Group products by aisle for better organization
  const productsByAisle = products.reduce((acc, product) => {
    const aisle = product.corredor;
    if (!acc[aisle]) {
      acc[aisle] = [];
    }
    acc[aisle].push(product);
    return acc;
  }, {} as Record<number, Product[]>);

  // Get unique aisles and sort them
  const aisles = Object.keys(productsByAisle).map(Number).sort((a, b) => a - b);

  return (
    <div className="mb-6">
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="font-semibold text-gray-700">Lista de Compras</h2>
          <p className="text-sm text-gray-500">
            Organizada por rota de compras ({products.length} itens)
          </p>
        </div>

        <ul className="divide-y">
          {aisles.map((aisle) => (
            <li key={aisle} className="p-4">
              <div className="flex items-center mb-2">
                <div className="bg-app-blue-light text-white text-xs font-bold px-2 py-1 rounded">
                  Corredor {aisle}
                </div>
              </div>
              
              <ul className="space-y-2">
                {productsByAisle[aisle].map((product) => (
                  <li key={`${product.produto}-${product.id}`} className="flex items-center justify-between">
                    <span className="text-gray-800">{product.produto}</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => onRemoveProduct(product)}
                      className="text-gray-500 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>

        <div className="p-4 border-t bg-gray-50 flex justify-between">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onClearList}
            className="text-gray-600"
          >
            <Trash2 size={16} className="mr-1" />
            Limpar Lista
          </Button>
          
          <Button 
            onClick={onSaveToPantry}
            className="bg-app-green hover:bg-app-green-dark text-white"
            size="sm"
          >
            <Archive size={16} className="mr-1" />
            Salvar na Dispensa
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ShoppingList;
