import { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronRight, LayoutGrid, Globe, Lock } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { SectionHeader } from '../../components/common/SectionHeader';
import { api } from '../../services/api';
import { Category } from '../../types';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface ExtendedCategory extends Category {
  section_count: number;
  question_count: number;
}

export default function Manage() {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<ExtendedCategory[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<ExtendedCategory | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await api.getCategories();
      setCategories(data);
    } catch {
      toast.error('Categories failed to load. Maybe they\'re on strike? 🪧');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return toast.error('Every legend needs a name. 🦸 Name required.');
    try {
      setLoading(true);
      const newCat = await api.createCategory(newCatName.trim(), newCatDesc.trim(), false);
      const newCatExtended: ExtendedCategory = { ...newCat, section_count: 0, question_count: 0 };
      setCategories([newCatExtended, ...categories]);
      setNewCatName(''); setNewCatDesc('');
      toast.success('New Category hatched! 🐣 (Draft mode)');
    } catch {
      toast.error('Failed to create category');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (cat: ExtendedCategory) => {
    const nextState = !cat.is_published;
    try {
      await api.updateCategory(cat.id, { 
        is_published: nextState,
        published_at: nextState ? new Date().toISOString() : undefined
      });
      setCategories(categories.map(c => 
        c.id === cat.id ? { ...c, is_published: nextState } : c
      ));
      toast.success(nextState ? 'Category is LIVE! 🔴 Showtime!' : 'Category back in the lab. 🧪 (Draft)');
    } catch {
      toast.error('Failed to update visibility');
    }
  };

  const handleDeleteCategory = async (category: ExtendedCategory) => {
    setCategoryToDelete(category);
    setDeleteModalOpen(true);
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    try {
      setIsDeleting(true);
      await api.deleteCategory(categoryToDelete.id);
      setCategories(categories.filter(c => c.id !== categoryToDelete.id));
      toast.success('Category obliterated. 💥');
      setDeleteModalOpen(false);
      setCategoryToDelete(null);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to delete category';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDeleteCategory = () => {
    setDeleteModalOpen(false);
    setCategoryToDelete(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      <SectionHeader
        title="Assessment Categories"
        subtitle="Define top-level assessment topics"
      />

      <div className="bg-white rounded-lg border border-sbk-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 bg-sbk-slate-50 border-b border-sbk-slate-100">
          <h2 className="text-lg font-semibold text-sbk-slate-900 mb-6">Create New Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <Input label="Category Name" placeholder="e.g. Pedagogy" value={newCatName} onChange={e => setNewCatName(e.target.value)} />
            <Input label="Description" placeholder="Quick overview..." value={newCatDesc} onChange={e => setNewCatDesc(e.target.value)} />
            <Button onClick={handleCreateCategory} isLoading={loading} className="gap-2">
              <Plus className="w-4 h-4" /> Create Draft
            </Button>
          </div>
        </div>

        <div className="p-8">
          {categories.length === 0 ? (
            <div className="p-12 text-center text-sbk-slate-500">
              No categories yet. Create your first assessment category above.
            </div>
          ) : (
            <div className="space-y-4">
              {categories.map(cat => (
                <div key={cat.id} className="p-6 border border-sbk-slate-200 rounded-lg bg-white hover:border-sbk-primary hover:shadow-md transition-all duration-200 group">
                  <div className="flex items-start justify-between gap-6 mb-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="p-3 bg-sbk-primary/10 group-hover:bg-sbk-primary/20 transition-colors rounded-lg flex-shrink-0">
                        <LayoutGrid className="w-5 h-5 text-sbk-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="font-semibold text-sbk-slate-900 text-base">{cat.name}</h3>
                          {cat.is_published ? (
                            <Badge variant="live" size="sm" icon={<Globe className="w-3 h-3" />}>
                              Live
                            </Badge>
                          ) : (
                            <Badge variant="draft" size="sm" icon={<Lock className="w-3 h-3" />}>
                              Draft
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-sbk-slate-600">{cat.description}</p>
                        <div className="flex items-center gap-4 mt-3 text-xs font-medium text-sbk-slate-500">
                          <span className="flex items-center gap-1.5">
                            <span className="bg-sbk-slate-100 px-2 py-0.5 rounded text-sbk-slate-700 font-bold">{cat.section_count}</span> Sections
                          </span>
                          <span className="w-1 h-1 bg-sbk-slate-300 rounded-full" />
                          <span className="flex items-center gap-1.5">
                            <span className="bg-sbk-slate-100 px-2 py-0.5 rounded text-sbk-slate-700 font-bold">{cat.question_count}</span> Questions
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleTogglePublish(cat)}
                        className={`text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg border-2 transition-all whitespace-nowrap ${
                          cat.is_published
                            ? 'border-sbk-slate-200 text-sbk-slate-400 hover:bg-sbk-slate-50'
                            : 'border-sbk-primary/30 text-sbk-primary hover:bg-sbk-primary/5'
                        }`}
                      >
                        {cat.is_published ? 'Unpublish' : 'Publish'}
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat)}
                        className="p-2 text-sbk-slate-300 hover:text-sbk-red-500 transition-colors flex-shrink-0"
                        title="Delete category"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      <Button variant="outline" size="sm" onClick={() => navigate(`/admin/category/${cat.id}`)} className="gap-2 flex-shrink-0">
                        Manage <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={deleteModalOpen}
        title="Delete Category"
        description={`Are you sure you want to delete "${categoryToDelete?.name}"? This will also delete all sections and questions within this category. This action cannot be undone.`}
        variant="danger"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDeleteCategory}
        onCancel={cancelDeleteCategory}
        isLoading={isDeleting}
      />
    </div>
  );
}
