import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, X, CheckCircle } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { api } from '../../services/api';
import { Category } from '../../types';
import toast from 'react-hot-toast';

export default function Manage() {
  const [activeTab, setActiveTab] = useState<'categories' | 'questions'>('categories');
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Category Form State
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  
  // Question Form State
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [qText, setQText] = useState('');
  const [qOptions, setQOptions] = useState({ A: '', B: '', C: '', D: '' });
  const [qCorrect, setQCorrect] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [qExplanation, setQExplanation] = useState('');

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
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      setLoading(true);
      const newCat = await api.createCategory(newCatName.trim(), newCatDesc.trim(), isPublished);
      setCategories([newCat, ...categories]);
      setNewCatName('');
      setNewCatDesc('');
      setIsPublished(false);
      toast.success('Category created successfully!');
    } catch (error) {
      toast.error('Failed to create category');
      console.error('Failed to create category:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (cat: Category) => {
    try {
      const updated = await api.updateCategory(cat.id, { published: !cat.published });
      setCategories(categories.map(c => c.id === cat.id ? updated : c));
      toast.success(`Category ${updated.published ? 'published' : 'hidden'}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleCreateQuestion = async () => {
    if (!selectedCatId) {
      toast.error('Please select a category first');
      return;
    }
    if (!qText.trim()) {
      toast.error('Question text is required');
      return;
    }
    if (!qOptions.A.trim() || !qOptions.B.trim() || !qOptions.C.trim() || !qOptions.D.trim()) {
      toast.error('All 4 options are required');
      return;
    }

    try {
      setLoading(true);
      await api.createQuestion({
        category_id: selectedCatId,
        question_text: qText.trim(),
        option_a: qOptions.A.trim(),
        option_b: qOptions.B.trim(),
        option_c: qOptions.C.trim(),
        option_d: qOptions.D.trim(),
        correct_option: qCorrect,
        explanation: qExplanation.trim(),
      } as any);
      
      toast.success('Question added to bank!');
      setQText('');
      setQOptions({ A: '', B: '', C: '', D: '' });
      setQCorrect('A');
      setQExplanation('');
    } catch (error) {
      toast.error('Failed to add question');
      console.error('Failed to create question:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900">System Management</h1>
          <p className="text-slate-500">Configure assessment categories and question banks.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('categories')}
            className={`px-6 py-2 text-sm font-bold rounded-lg transition-all ${
              activeTab === 'categories' ? 'bg-white shadow-sm text-primary-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Categories
          </button>
          <button 
            onClick={() => setActiveTab('questions')}
            className={`px-6 py-2 text-sm font-bold rounded-lg transition-all ${
              activeTab === 'questions' ? 'bg-white shadow-sm text-primary-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Questions
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {activeTab === 'categories' ? (
          <div>
            <div className="p-8 border-b border-slate-100 bg-slate-50/30">
              <h2 className="text-xl font-bold text-slate-900 mb-6">New Category</h2>
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-1">
                    <Input 
                      label="Category Name" 
                      placeholder="e.g. Mathematics" 
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Input 
                      label="Description" 
                      placeholder="What does this assessment cover?" 
                      value={newCatDesc}
                      onChange={(e) => setNewCatDesc(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4 justify-between pt-2">
                   <label className="flex items-center gap-3 text-sm font-bold text-slate-600 cursor-pointer group">
                      <div className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${isPublished ? 'bg-green-500' : 'bg-slate-300'}`}>
                        <div className={`bg-white w-4 h-4 rounded-full shadow-sm transition-transform ${isPublished ? 'translate-x-4' : ''}`}></div>
                        <input 
                          type="checkbox" 
                          className="hidden"
                          checked={isPublished} 
                          onChange={(e) => setIsPublished(e.target.checked)}
                        />
                      </div>
                      Publish immediately
                   </label>
                   <Button onClick={handleCreateCategory} disabled={loading || !newCatName} isLoading={loading}>
                    <Plus className="w-4 h-4 mr-2" /> Create Category
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-8">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Existing Categories</h3>
              {loading && categories.length === 0 ? (
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-50 rounded-2xl"></div>)}
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-3xl">
                  <p className="text-slate-400 font-medium">No categories found. Create your first one above.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categories.map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between p-6 border border-slate-100 rounded-2xl hover:border-primary-200 hover:bg-slate-50/50 transition-all">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-slate-900">{cat.name}</h3>
                          {cat.published ? (
                            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-black uppercase">Live</span>
                          ) : (
                            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-black uppercase">Draft</span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 line-clamp-1">{cat.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleTogglePublish(cat)}
                          className={`p-2 rounded-lg transition-colors ${cat.published ? 'text-amber-500 hover:bg-amber-50' : 'text-green-500 hover:bg-green-50'}`}
                          title={cat.published ? 'Unpublish' : 'Publish'}
                        >
                          {cat.published ? <X className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                        </button>
                        <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-8">Add Question to Bank</h2>
            
            <div className="space-y-8 max-w-4xl">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">Target Category</label>
                <select 
                  className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
                  value={selectedCatId || ''}
                  onChange={(e) => setSelectedCatId(e.target.value)}
                >
                  <option value="" disabled>Select the category for this question...</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {selectedCatId && (
                <div className="p-8 border-2 border-primary-50 bg-primary-50/10 rounded-3xl space-y-6 animate-in slide-in-from-top-4 duration-300">
                  <Input 
                    label="Question Text" 
                    value={qText}
                    onChange={(e) => setQText(e.target.value)}
                    placeholder="e.g. What is the correct way to handle student dissent?"
                    className="text-lg font-medium"
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {(['A', 'B', 'C', 'D'] as const).map((label) => (
                      <div key={label} className="relative group">
                        <Input 
                          label={`Option ${label}`} 
                          value={qOptions[label]}
                          onChange={(e) => setQOptions({ ...qOptions, [label]: e.target.value })}
                          className={`pr-12 transition-all ${qCorrect === label ? 'border-green-500 ring-4 ring-green-50' : 'group-hover:border-slate-300'}`}
                          placeholder={`Answer ${label}`}
                        />
                        <div className="absolute top-[38px] right-3 flex items-center gap-2">
                          <span className="text-[10px] font-black text-slate-400 uppercase opacity-0 group-hover:opacity-100 transition-opacity">Correct?</span>
                          <input 
                            type="radio" 
                            name="correctOption" 
                            checked={qCorrect === label}
                            onChange={() => setQCorrect(label)}
                            className="h-5 w-5 text-green-500 focus:ring-green-500 cursor-pointer"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider">Explanation (Shown after attempt)</label>
                    <textarea 
                      className="w-full h-24 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                      value={qExplanation}
                      onChange={(e) => setQExplanation(e.target.value)}
                      placeholder="Explain the logic behind the correct answer..."
                    />
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <Button onClick={handleCreateQuestion} disabled={loading || !qText} isLoading={loading} size="lg" className="px-10">
                      <Save className="w-4 h-4 mr-2" /> Save Question to Category
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
