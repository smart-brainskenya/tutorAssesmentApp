import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Category, Section } from '../../types';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { ArrowLeft, Plus, Trash2, Edit2, ChevronRight, Hash } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminCategoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState<Category | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'A' | 'B'>('A');
  const [desc, setDesc] = useState('');

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [catData, secData] = await Promise.all([
        api.getCategoryById(id!),
        api.getSectionsByCategory(id!)
      ]);
      setCategory(catData);
      setSections(secData);
    } catch (err) {
      toast.error('Failed to load category data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSection = async () => {
    if (!title.trim()) return toast.error('Title required');
    try {
      const newSection = await api.createSection({
        category_id: id!,
        section_type: type,
        title: title.trim(),
        description: desc.trim(),
        order_index: sections.length
      });
      setSections([...sections, newSection]);
      setTitle(''); setDesc('');
      toast.success('Section created');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create section');
    }
  };

  const handleDeleteSection = async (secId: string) => {
    if (!confirm('Delete this section and all its questions?')) return;
    try {
      await api.deleteSection(secId);
      setSections(sections.filter(s => s.id !== secId));
      toast.success('Deleted');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading) return <div className="p-12 text-center animate-pulse">Loading structural data...</div>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      <button onClick={() => navigate('/admin/manage')} className="flex items-center text-sm font-bold text-slate-400 hover:text-sbk-blue transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Categories
      </button>

      <div>
        <h1 className="text-3xl font-black text-slate-900">{category?.name}</h1>
        <p className="text-slate-500">{category?.description}</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 bg-slate-50 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Define Assessment Section</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div className="md:col-span-1">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Type</label>
              <select className="w-full h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold focus:ring-2 focus:ring-sbk-blue outline-none transition-all" value={type} onChange={e => setType(e.target.value as any)}>
                <option value="A">Section A (MCQ / Auto)</option>
                <option value="B">Section B (Text / Manual)</option>
              </select>
            </div>
            <div className="md:col-span-1">
              <Input label="Section Title" placeholder="e.g. Knowledge Check" value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div className="md:col-span-1">
              <Input label="Instructions" placeholder="Optional context..." value={desc} onChange={e => setDesc(e.target.value)} />
            </div>
            <Button onClick={handleCreateSection} className="gap-2">
              <Plus className="w-4 h-4" /> Add Section
            </Button>
          </div>
        </div>

        <div className="p-8">
          <div className="space-y-4">
            {sections.length === 0 ? (
              <div className="p-12 text-center text-slate-400 italic">No sections defined. Create Section A and B to begin.</div>
            ) : (
              sections.map((sec, idx) => (
                <div key={sec.id} className="p-6 border border-slate-200 rounded-2xl flex justify-between items-center bg-white hover:border-sbk-blue transition-colors group">
                  <div className="flex items-center gap-6">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl ${sec.section_type === 'A' ? 'bg-blue-50 text-sbk-blue' : 'bg-purple-50 text-purple-600'}`}>
                      {sec.section_type}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{sec.title}</h3>
                      <p className="text-sm text-slate-500">{sec.section_type === 'A' ? 'Auto-graded Multiple Choice' : 'Manual Review Text Responses'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleDeleteSection(sec.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/admin/section/${sec.id}`)} className="gap-2">
                      Manage Questions <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
