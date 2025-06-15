
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getStockItems, saveStockItem, updateStockItem, deleteStockItem, formatCurrency, StockItem } from "@/utils/supabaseDataManager";
import { Package, Plus, Search, Edit, Trash2 } from "lucide-react";

const StockManagement = () => {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [formData, setFormData] = useState({ name: "", price: "" });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchStockItems();
  }, []);

  const fetchStockItems = async () => {
    try {
      const items = await getStockItems();
      setStockItems(items);
    } catch (error) {
      console.error('Error fetching stock items:', error);
      toast({
        title: "Error",
        description: "Failed to load stock items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = stockItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid price",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingItem) {
        const updatedItem = await updateStockItem(editingItem.id, { 
          name: formData.name, 
          price 
        });
        if (updatedItem) {
          setStockItems(prev => prev.map(item =>
            item.id === editingItem.id ? updatedItem : item
          ));
          toast({
            title: "Success",
            description: "Stock item updated successfully",
          });
        }
        setEditingItem(null);
      } else {
        const newItem = await saveStockItem({
          name: formData.name,
          price,
        });
        if (newItem) {
          setStockItems(prev => [newItem, ...prev]);
          toast({
            title: "Success",
            description: "Stock item added successfully",
          });
        }
        setIsAddDialogOpen(false);
      }
      setFormData({ name: "", price: "" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save stock item",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (item: StockItem) => {
    setEditingItem(item);
    setFormData({ name: item.name, price: item.price.toString() });
  };

  const handleDelete = async (id: string) => {
    try {
      const success = await deleteStockItem(id);
      if (success) {
        setStockItems(prev => prev.filter(item => item.id !== id));
        toast({
          title: "Success",
          description: "Stock item deleted successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete stock item",
        variant: "destructive",
      });
    }
  };

  const handleDialogClose = () => {
    setIsAddDialogOpen(false);
    setEditingItem(null);
    setFormData({ name: "", price: "" });
  };

  if (loading) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="flex items-center justify-between border-b bg-white px-6 py-4">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="lg:hidden" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Stock Management</h1>
              <p className="text-sm text-gray-500">Loading stock items...</p>
            </div>
          </div>
          <Package className="h-8 w-8 text-gray-400" />
        </div>
        <div className="p-6">
          <div className="text-center">
            <p className="text-gray-500">Loading data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="flex items-center justify-between border-b bg-white px-6 py-4">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="lg:hidden" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Stock Management</h1>
            <p className="text-sm text-gray-500">Add, edit, and manage your stock items</p>
          </div>
        </div>
        <Package className="h-8 w-8 text-gray-400" />
      </div>

      <div className="p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search stock items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Dialog open={isAddDialogOpen || !!editingItem} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsAddDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Stock Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? "Edit Stock Item" : "Add New Stock Item"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Item Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter item name"
                  />
                </div>
                <div>
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="Enter price"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingItem ? "Update Item" : "Add Item"}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleDialogClose}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {filteredItems.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => (
              <Card key={item.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(item.price)}
                      </p>
                      <p className="text-sm text-gray-500">
                        Added {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm ? "No items found" : "No stock items yet"}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm 
                  ? "Try adjusting your search terms" 
                  : "Add your first stock item to get started"}
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsAddDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Stock Item
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default StockManagement;
