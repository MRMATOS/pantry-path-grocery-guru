
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';

type Product = {
  id?: string;
  produto: string;
  corredor: number;
  loja: string;
};

const Admin: React.FC = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [newProduct, setNewProduct] = useState<Product>({
    produto: '',
    corredor: 1,
    loja: 'Dal Pozzo Vila Bela'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [filterAisle, setFilterAisle] = useState<string>('');
  const [filterProduct, setFilterProduct] = useState<string>('');
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  useEffect(() => {
    if (authenticated) {
      loadProducts();
    }
  }, [authenticated]);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('produto')
        .select('*')
        .order('corredor', { ascending: true });

      if (error) {
        console.error('Error loading products:', error);
        toast.error('Erro ao carregar produtos');
        return;
      }

      setProducts(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao carregar produtos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    if (password === '442288') {
      setAuthenticated(true);
      toast.success('Login realizado com sucesso!');
    } else {
      toast.error('Senha incorreta');
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.produto || !newProduct.corredor) {
      toast.error('Preencha todos os campos');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('produto')
        .insert([newProduct]);

      if (error) {
        console.error('Error adding product:', error);
        toast.error('Erro ao adicionar produto');
        return;
      }

      toast.success('Produto adicionado com sucesso!');
      setNewProduct({
        produto: '',
        corredor: 1,
        loja: 'Dal Pozzo Vila Bela'
      });
      loadProducts();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao adicionar produto');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDeleteProduct = (product: Product) => {
    setProductToDelete(product);
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('produto')
        .delete()
        .match({ produto: productToDelete.produto, corredor: productToDelete.corredor, loja: productToDelete.loja });

      if (error) {
        console.error('Error deleting product:', error);
        toast.error('Erro ao excluir produto');
        return;
      }

      toast.success('Produto excluído com sucesso!');
      loadProducts();
      setIsDeleteConfirmOpen(false);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao excluir produto');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterByAisle = () => {
    if (!filterAisle) {
      loadProducts();
      return;
    }

    setIsLoading(true);
    try {
      const aisle = parseInt(filterAisle);
      if (isNaN(aisle)) {
        toast.error('Corredor inválido');
        return;
      }

      const filtered = products.filter(p => p.corredor === aisle);
      setProducts(filtered);
    } catch (error) {
      console.error('Error filtering:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterByProduct = () => {
    if (!filterProduct) {
      loadProducts();
      return;
    }

    setIsLoading(true);
    try {
      const filtered = products.filter(p => 
        p.produto.toLowerCase().includes(filterProduct.toLowerCase())
      );
      setProducts(filtered);
    } catch (error) {
      console.error('Error filtering:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!authenticated) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Área de Administração</h2>
          <div className="mb-4">
            <Input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>
          <Button onClick={handleLogin} className="w-full">
            Entrar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Administração de Produtos</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Adicionar Novo Produto</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Produto</label>
            <Input
              placeholder="Nome do produto"
              value={newProduct.produto}
              onChange={(e) => setNewProduct({...newProduct, produto: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Corredor</label>
            <Input
              type="number"
              placeholder="Número do corredor"
              value={newProduct.corredor}
              onChange={(e) => setNewProduct({...newProduct, corredor: parseInt(e.target.value) || 0})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Loja</label>
            <Select 
              value={newProduct.loja} 
              onValueChange={(value) => setNewProduct({...newProduct, loja: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a loja" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Dal Pozzo Vila Bela">Dal Pozzo Vila Bela</SelectItem>
                <SelectItem value="Dal Pozzo Cidade dos Lagos">Dal Pozzo Cidade dos Lagos</SelectItem>
                <SelectItem value="Dal Pozzo Home Center">Dal Pozzo Home Center</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-4">
          <Button onClick={handleAddProduct} disabled={isLoading}>
            {isLoading ? 'Adicionando...' : 'Adicionar Produto'}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Filtrar Produtos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por Corredor</label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Corredor"
                value={filterAisle}
                onChange={(e) => setFilterAisle(e.target.value)}
              />
              <Button onClick={handleFilterByAisle}>Filtrar</Button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por Produto</label>
            <div className="flex gap-2">
              <Input
                placeholder="Nome do produto"
                value={filterProduct}
                onChange={(e) => setFilterProduct(e.target.value)}
              />
              <Button onClick={handleFilterByProduct}>Filtrar</Button>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <Button variant="outline" onClick={loadProducts}>
            Limpar Filtros
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Corredor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loja
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.length > 0 ? (
                products.map((product, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.produto}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.corredor}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.loja}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => confirmDeleteProduct(product)}
                      >
                        Excluir
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                    {isLoading ? 'Carregando...' : 'Nenhum produto encontrado'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
          </DialogHeader>
          <p>
            Tem certeza que deseja excluir o produto "{productToDelete?.produto}"?
          </p>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDeleteProduct}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
