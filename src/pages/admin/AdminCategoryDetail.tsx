import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Category, Section } from '../../types';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { SectionHeader } from '../../components/common/SectionHeader';
import { ArrowLeft, Plus, Trash2, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

interface ExtendedSection extends Section {
  question_count: number;
}

export default function AdminCategoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState<Category | null>(null);
  const [sections, setSections] = useState<ExtendedSection[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'A' | 'B'>('A');
  const [desc, setDesc] = useState('');

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<ExtendedSection | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [catData, secData] = await Promise.all([
          api.getCategoryById(id!),
          api.getSectionsByCategory(id!)
        ]);
        setCategory(catData);
        // Ensure secData has question_count (handled by api update)
        setSections(secData as ExtendedSection[]);
      } catch {
        toast.error('Category data is playing hide and seek. 🫣');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id]);

  const handleCreateSection = async () => {
    if (!title.trim()) return toast.error('A nameless category? I don\'t think so. 🤨 Title required.');
    try {
      const newSection = await api.createSection({
        category_id: id!,
        section_type: type,
        title: title.trim(),
        description: desc.trim(),
        order_index: sections.length
      });
      const newSectionExtended: ExtendedSection = { ...newSection, question_count: 0 };
      setSections([...sections, newSectionExtended]);
      setTitle(''); setDesc('');
      toast.success('New section born! 👶');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create section';
      toast.error(msg);
    }
  };

  const handleDeleteSection = async (section: ExtendedSection) => {
    setSectionToDelete(section);
    setDeleteModalOpen(true);
  };

  const confirmDeleteSection = async () => {
    if (!sectionToDelete) return;
    try {
      setIsDeleting(true);
      await api.deleteSection(sectionToDelete.id);
      setSections(sections.filter(s => s.id !== sectionToDelete.id));
      toast.success('Section sent to the void. 🕳️');
      setDeleteModalOpen(false);
      setSectionToDelete(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete section';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDeleteSection = () => {
    setDeleteModalOpen(false);
    setSectionToDelete(null);
  };

  if (loading) return <div className="p-12 text-center text-slate-600">One Momment✍️</div>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      <button onClick={() => navigate('/admin/manage')} className="flex items-center text-sm font-semibold text-sbk-slate-600 hover:text-sbk-primary transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Categories
      </button>

      <SectionHeader
        title={category?.name || 'Category'}
        subtitle={category?.description}
      />

      <div className="bg-white rounded-lg border border-sbk-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 bg-sbk-slate-50 border-b border-sbk-slate-100">
          <h2 className="text-lg font-semibold text-sbk-slate-900 mb-6">Define Assessment Section</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-sbk-slate-700 uppercase tracking-widest mb-2">Type</label>
              <select className="w-full h-10 rounded-lg border border-sbk-slate-200 bg-white px-4 text-sm font-medium focus:ring-2 focus:ring-sbk-primary outline-none transition-all" value={type} onChange={e => setType(e.target.value as 'A' | 'B')}>
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
              <div className="p-12 text-center text-sbk-slate-500">No sections defined. Create Section A and B to begin.</div>
            ) : (
              sections.map((sec) => (
                <div key={sec.id} className="p-6 border border-sbk-slate-200 rounded-lg flex justify-between items-center bg-white hover:border-sbk-slate-300 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg flex-shrink-0 ${sec.section_type === 'A' ? 'bg-sbk-primary/10 text-sbk-primary' : 'bg-sbk-teal/20 text-sbk-teal'}`}>
                      {sec.section_type}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sbk-slate-900">{sec.title}</h3>
                      <p className="text-sm text-sbk-slate-500">{sec.section_type === 'A' ? 'Auto-graded Multiple Choice' : 'Manual Review Text Responses'}</p>
                      <p className="text-xs text-sbk-slate-400 font-medium mt-1">{sec.question_count} Questions</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                    <button onClick={() => handleDeleteSection(sec)} className="p-2 text-sbk-slate-300 hover:text-sbk-red-500 transition-colors" title="Delete section">
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/admin/section/${sec.id}`)} className="gap-2">
                      Manage <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={deleteModalOpen}
        title="Delete Section"
        description={`Are you sure you want to delete "${sectionToDelete?.title}"? This will also delete all questions within this section. This action cannot be undone.`}
        variant="danger"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDeleteSection}
        onCancel={cancelDeleteSection}
        isLoading={isDeleting}
      />
    </div>
  );
}
