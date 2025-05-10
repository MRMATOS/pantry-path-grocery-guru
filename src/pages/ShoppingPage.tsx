
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import CameraUpload from '@/components/CameraUpload';
import ProductInput from '@/components/ProductInput';
import ShoppingList from '@/components/ShoppingList';
import { supabase } from '@/integrations/supabase/client';
import { normalizeText } from '@/lib/ocr';
import { optimizeShoppingRoute } from '@/lib/shoppingRoute';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

const ShoppingPage: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [currentStore, setCurrentStore] = useState('Dal Pozzo Vila Bela');
  const navigate = useNavigate();

  // Load products from localStorage on component mount
  useEffect(() => {
    const savedProducts = localStorage.getItem('shoppingList');
    if (savedProducts) {
      try {
        const parsedProducts = JSON.parse(savedProducts);
        setProducts(optimizeShoppingRoute(parsedProducts));
      } catch (error) {
        console.error('Error parsing saved shopping list:', error);
      }
    }
    
    // Load store preference
    const savedStore = localStorage.getItem('preferredStore');
    if (savedStore) {
      setCurrentStore(savedStore);
    }
  }, []);

  // Save products to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('shoppingList', JSON.stringify(products));
  }, [products]);
  
  // Save store preference to localStorage
  useEffect(() => {
    localStorage.setItem('preferredStore', currentStore);
  }, [currentStore]);

  const handleTextExtracted = async (extractedProducts: string[]) => {
    if (extractedProducts.length === 0) return;

    try {
      const validProducts: any[] = [];
      
      // Validate each potential product against Supabase
      for (const productName of extractedProducts) {
        const normalizedName = normalizeText(productName);
        
        console.log(`Checking product against Supabase: "${normalizedName}" in store: ${currentStore}`);
        
        const { data, error } = await supabase
          .from('produto')
          .select('*')
          .eq('loja', currentStore)
          .ilike('produto', `%${normalizedName}%`)
          .limit(1);

        if (error) {
          console.error("Supabase error:", error);
          continue;
        }

        if (data && data.length > 0) {
          console.log(`Found product match:`, data[0]);
          validProducts.push(data[0]);
        } else {
          console.log(`No match found for "${productName}" in store: ${currentStore}`);
        }
      }

      if (validProducts.length > 0) {
        // Add new products to the list, avoiding duplicates
        const updatedProducts = [...products];
        
        validProducts.forEach(product => {
          const isDuplicate = products.some(
            p => p.produto.toLowerCase() === product.produto.toLowerCase()
          );
          
          if (!isDuplicate) {
            updatedProducts.push(product);
          }
        });
        
        setProducts(optimizeShoppingRoute(updatedProducts));
        toast.success(`Adicionados ${validProducts.length} produtos do cupom`);
      } else {
        toast.error("Nenhum produto válido encontrado no cupom");
      }
    } catch (error) {
      console.error("Error validating products:", error);
      toast.error("Erro ao validar produtos do cupom");
    }
  };

  const handleProductsAdded = (newProducts: any[]) => {
    // Add new products, avoiding duplicates
    const updatedProducts = [...products];
    
    newProducts.forEach(product => {
      const isDuplicate = products.some(
        p => p.produto.toLowerCase() === product.produto.toLowerCase()
      );
      
      if (!isDuplicate) {
        updatedProducts.push(product);
      }
    });
    
    setProducts(optimizeShoppingRoute(updatedProducts));
  };

  const handleRemoveProduct = (productToRemove: any) => {
    setProducts(products.filter(p => 
      p.id !== productToRemove.id || 
      p.produto !== productToRemove.produto
    ));
  };

  const handleClearList = () => {
    setProducts([]);
    toast.success("Lista de compras apagada");
  };

  const handleSaveToPantry = async () => {
    if (products.length === 0) {
      toast.error("Sua lista de compras está vazia");
      return;
    }
    
    try {
      // Create pantry items from the shopping list
      const pantryItems = products.map(product => ({
        id: uuidv4(),
        product_name: product.produto,
        quantity: 1,
        expiration_date: null
      }));
      
      // Save to localStorage for now (in a real app, would use a database)
      const existingPantry = localStorage.getItem('pantryItems');
      let allPantryItems: any[] = [];
      
      if (existingPantry) {
        allPantryItems = JSON.parse(existingPantry);
      }
      
      // Add new items, combining quantities for duplicates
      pantryItems.forEach(newItem => {
        const existingItemIndex = allPantryItems.findIndex(
          item => item.product_name.toLowerCase() === newItem.product_name.toLowerCase()
        );
        
        if (existingItemIndex >= 0) {
          // Item exists, update quantity
          allPantryItems[existingItemIndex].quantity += newItem.quantity;
        } else {
          // New item
          allPantryItems.push(newItem);
        }
      });
      
      localStorage.setItem('pantryItems', JSON.stringify(allPantryItems));
      toast.success("Itens salvos na dispensa");
      
      // Navigate to pantry page
      navigate('/pantry');
    } catch (error) {
      console.error("Error saving to pantry:", error);
      toast.error("Erro ao salvar na dispensa");
    }
  };
  
  const handleStoreChange = (store: string) => {
    setCurrentStore(store);
    // Clear products when changing store
    setProducts([]);
  };

  return (
    <Layout>
      <h1 className="text-xl font-semibold mb-6">Lista de Compras</h1>
      
      <div className="mb-4">
        <label htmlFor="store-select" className="block text-sm font-medium text-gray-700 mb-1">
          Loja
        </label>
        <select
          id="store-select"
          value={currentStore}
          onChange={(e) => handleStoreChange(e.target.value)}
          className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="Dal Pozzo Vila Bela">Dal Pozzo Vila Bela</option>
          <option value="Dal Pozzo Cidade dos Lagos">Dal Pozzo Cidade dos Lagos</option>
          <option value="Dal Pozzo Home Center">Dal Pozzo Home Center</option>
        </select>
      </div>
      
      <CameraUpload 
        onTextExtracted={handleTextExtracted} 
        isProcessing={isProcessingImage}
        setIsProcessing={setIsProcessingImage}
      />
      
      <ProductInput 
        onProductsAdded={handleProductsAdded} 
        disabled={isProcessingImage}
        currentStore={currentStore}
      />
      
      <ShoppingList 
        products={products} 
        onRemoveProduct={handleRemoveProduct}
        onClearList={handleClearList}
        onSaveToPantry={handleSaveToPantry}
      />
    </Layout>
  );
};

export default ShoppingPage;
