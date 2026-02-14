import { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronRight, LayoutGrid } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { api } from '../../services/api';
import { Category } from '../../types';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function Manage() {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await api.getCategories();
      setCategories(data);
    } catch (error) {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return toast.error('Name required');
    try {
      setLoading(true);
      const newCat = await api.createCategory(newCatName.trim(), newCatDesc.trim(), true);
      setCategories([newCat, ...categories]);
      setNewCatName(''); setNewCatDesc('');
      toast.success('Category created');
    } catch (error) {
      toast.error('Failed to create category');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete this category and all its sections?')) return;
    try {
      await api.deleteCategory(id);
      setCategories(categories.filter(c => c.id !== id));
      toast.success('Deleted');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Assessment Categories</h1>
          <p className="text-sm text-slate-500">Define top-level assessment topics.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 bg-slate-50 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Create New Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <Input label="Category Name" placeholder="e.g. Pedagogy" value={newCatName} onChange={e => setNewCatName(e.target.value)} />
            <Input label="Description" placeholder="Quick overview..." value={newCatDesc} onChange={e => setNewCatDesc(e.target.value)} />
            <Button onClick={handleCreateCategory} isLoading={loading} className="gap-2">
              <Plus className="w-4 h-4" /> Create Category
            </Button>
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {categories.map(cat => (
              <div key={cat.id} className="p-6 border border-slate-200 rounded-2xl flex justify-between items-center bg-white hover:border-sbk-blue transition-colors group">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-blue-50 transition-colors">
                      <LayoutGrid className="w-4 h-4 text-slate-400 group-hover:text-sbk-blue" />
                    </div>
                    <h3 className="font-bold text-slate-900">{cat.name}</h3>
                  </div>
                  <p className="text-sm text-slate-500 ml-11">{cat.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleDeleteCategory(cat.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <Button variant="outline" size="sm" onClick={() => navigate(`/admin/category/${cat.id}`)} className="gap-2">
                    Manage Sections <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
