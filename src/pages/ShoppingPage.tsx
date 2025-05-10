
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
  }, []);

  // Save products to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('shoppingList', JSON.stringify(products));
  }, [products]);

  const handleTextExtracted = async (extractedProducts: string[]) => {
    if (extractedProducts.length === 0) return;

    try {
      const validProducts: any[] = [];
      
      // Validate each potential product against Supabase
      for (const productName of extractedProducts) {
        const normalizedName = normalizeText(productName);
        
        const { data, error } = await supabase
          .from('produto')
          .select('*')
          .ilike('produto', `%${normalizedName}%`)
          .limit(1);

        if (error) {
          console.error("Supabase error:", error);
          continue;
        }

        if (data && data.length > 0) {
          validProducts.push(data[0]);
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
        toast.success(`Added ${validProducts.length} products from receipt`);
      } else {
        toast.error("No valid products found in the receipt");
      }
    } catch (error) {
      console.error("Error validating products:", error);
      toast.error("Error validating products from receipt");
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
    toast.success("Shopping list cleared");
  };

  const handleSaveToPantry = async () => {
    if (products.length === 0) {
      toast.error("Your shopping list is empty");
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
      toast.success("Items saved to pantry");
      
      // Navigate to pantry page
      navigate('/pantry');
    } catch (error) {
      console.error("Error saving to pantry:", error);
      toast.error("Error saving to pantry");
    }
  };

  return (
    <Layout>
      <h1 className="text-xl font-semibold mb-6">Shopping List</h1>
      
      <CameraUpload 
        onTextExtracted={handleTextExtracted} 
        isProcessing={isProcessingImage}
        setIsProcessing={setIsProcessingImage}
      />
      
      <ProductInput 
        onProductsAdded={handleProductsAdded} 
        disabled={isProcessingImage} 
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
