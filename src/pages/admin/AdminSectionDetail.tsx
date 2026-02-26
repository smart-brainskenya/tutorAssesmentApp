import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Section, Question } from '../../types';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { ArrowLeft, Plus, Trash2, Edit2, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminSectionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [section, setSection] = useState<Section | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Form State
  const [qText, setQText] = useState('');
  const [qPoints, setQPoints] = useState(10);
  
  // MCQ specific
  const [options, setOptions] = useState({ A: '', B: '', C: '', D: '' });
  const [correct, setCorrect] = useState<'A' | 'B' | 'C' | 'D'>('A');

  // SA specific (Rubric)
  const [rubric, setRubric] = useState<{ label: string; max: number }[]>([]);

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [secData, qData] = await Promise.all([
          api.getSectionById(id!),
          api.getQuestionsBySection(id!)
        ]);
        setSection(secData);
        setQuestions(qData);
      } catch {
        toast.error('Failed to load section data');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id]);

  const handleEditClick = (q: Question) => {
    setEditingQuestion(q);
    setQText(q.question_text);
    setQPoints(q.points || 10);
    if (q.question_type === 'multiple_choice') {
      setOptions({
        A: q.option_a || '',
        B: q.option_b || '',
        C: q.option_c || '',
        D: q.option_d || ''
      });
      setCorrect(q.correct_option || 'A');
    } else {
      setRubric(q.rubric_criteria || []);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingQuestion(null);
    setQText('');
    setQPoints(10);
    setOptions({ A: '', B: '', C: '', D: '' });
    setCorrect('A');
    setRubric([]);
  };

  const handleSubmitQuestion = async () => {
    if (!qText.trim()) return toast.error('Question text required');
    
    try {
      const payload: Partial<Question> = {
        section_id: id!,
        question_type: section!.section_type === 'A' ? 'multiple_choice' : 'short_answer',
        question_text: qText.trim(),
        points: qPoints,
        // MC
        option_a: section!.section_type === 'A' ? options.A : undefined,
        option_b: section!.section_type === 'A' ? options.B : undefined,
        option_c: section!.section_type === 'A' ? options.C : undefined,
        option_d: section!.section_type === 'A' ? options.D : undefined,
        correct_option: section!.section_type === 'A' ? correct : undefined,
        // SA
        rubric_criteria: section!.section_type === 'B' ? rubric : []
      };

      if (editingQuestion) {
        await api.updateQuestion(editingQuestion.id, payload);
        setQuestions(questions.map(q => q.id === editingQuestion.id ? { ...q, ...payload } as Question : q));
        toast.success('Question updated');
      } else {
        const newQ = await api.createQuestion(payload as Omit<Question, 'id' | 'created_at'>);
        setQuestions([...questions, newQ]);
        toast.success('Question added');
      }
      resetForm();
    } catch (err) {
      toast.error((err as Error).message || 'Failed to save question');
    }
  };

  const handleDeleteQuestion = (question: Question) => {
    setQuestionToDelete(question);
    setDeleteModalOpen(true);
  };

  const confirmDeleteQuestion = async () => {
    if (!questionToDelete) return;
    try {
      setIsDeleting(true);
      await api.deleteQuestion(questionToDelete.id);
      setQuestions(questions.filter(q => q.id !== questionToDelete.id));
      toast.success('Question deleted successfully');
      setDeleteModalOpen(false);
      setQuestionToDelete(null);
    } catch (err) {
      toast.error((err as Error).message || 'Failed to delete question');
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDeleteQuestion = () => {
    setDeleteModalOpen(false);
    setQuestionToDelete(null);
  };

  if (loading) return <div className="p-12 text-center animate-pulse">Loading section content...</div>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      <button onClick={() => navigate(`/admin/category/${section?.category_id}`)} className="flex items-center text-sm font-bold text-slate-400 hover:text-sbk-blue transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Category Structure
      </button>

      <div className="flex items-center gap-4">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl ${section?.section_type === 'A' ? 'bg-blue-50 text-sbk-blue' : 'bg-purple-50 text-purple-600'}`}>
          {section?.section_type}
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900">{section?.title}</h1>
          <p className="text-slate-500">Question bank for this section.</p>
        </div>
      </div>

      {/* Question Form */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 bg-slate-50 border-b border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-900">
              {editingQuestion ? 'Edit Question' : `New ${section?.section_type === 'A' ? 'Multiple Choice' : 'Text Input'} Question`}
            </h2>
            {editingQuestion && (
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 flex items-center gap-1 text-sm font-bold">
                <X className="w-4 h-4" /> Cancel Edit
              </button>
            )}
          </div>
          <div className="space-y-6">
            <Input label="Question Text" placeholder="Enter the technical question..." value={qText} onChange={e => setQText(e.target.value)} />
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
              <Input label="Point Value" type="number" value={qPoints} onChange={e => setQPoints(parseInt(e.target.value))} />
            </div>

            {section?.section_type === 'A' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(['A', 'B', 'C', 'D'] as const).map(label => (
                  <div key={label} className="relative">
                    <Input 
                      label={`Option ${label}`} 
                      value={options[label]} 
                      onChange={e => setOptions({...options, [label]: e.target.value})} 
                      className={correct === label ? 'border-green-500 ring-4 ring-green-50' : ''}
                    />
                    <input type="radio" name="mc_correct" checked={correct === label} onChange={() => setCorrect(label)} className="absolute top-10 right-3 h-5 w-5 accent-green-500" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Rubric Criteria (Manual Review Items)</label>
                  <Button variant="outline" size="sm" onClick={() => setRubric([...rubric, { label: '', max: 5 }])}>
                    <Plus className="w-3 h-3 mr-1" /> Add Criterion
                  </Button>
                </div>
                {rubric.map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-end">
                    <div className="flex-1"><Input placeholder="Criterion (e.g. Accuracy)" value={item.label} onChange={e => {
                      const r = [...rubric]; r[idx].label = e.target.value; setRubric(r);
                    }} /></div>
                    <div className="w-24"><Input type="number" label="Max Score" value={item.max} onChange={e => {
                      const r = [...rubric]; r[idx].max = parseInt(e.target.value); setRubric(r);
                    }} /></div>
                    <button onClick={() => setRubric(rubric.filter((_, i) => i !== idx))} className="mb-2 p-2 text-slate-300 hover:text-red-500"><X className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button onClick={handleSubmitQuestion} className="px-12 gap-2">
                <Plus className="w-4 h-4" /> {editingQuestion ? 'Update Question' : 'Save Question to Section'}
              </Button>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="divide-y divide-slate-100">
            {questions.length === 0 ? (
              <div className="py-12 text-center text-slate-400 italic">No questions added yet.</div>
            ) : (
              questions.map((q, idx) => (
                <div key={q.id} className="py-6 flex justify-between items-center group">
                  <div className="flex-1 mr-8">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs font-bold text-sbk-blue bg-blue-50 px-2 py-0.5 rounded">Q{idx + 1}</span>
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{q.points} Points</span>
                    </div>
                    <p className="font-bold text-slate-800 text-lg">{q.question_text}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleEditClick(q)} 
                      className="p-2 text-slate-400 hover:text-sbk-blue hover:bg-blue-50 rounded-lg transition-all"
                      title="Edit question"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDeleteQuestion(q)} className="p-2 text-slate-300 hover:text-red-500 transition-colors" title="Delete question">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={deleteModalOpen}
        title="Delete Question"
        description="Are you sure you want to delete this question? This action cannot be undone."
        variant="danger"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDeleteQuestion}
        onCancel={cancelDeleteQuestion}
        isLoading={isDeleting}
      />
    </div>
  );
}
