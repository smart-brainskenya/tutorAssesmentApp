import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, CheckCircle, Search, AlertCircle } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { api } from '../../services/api';
import { Category, Question } from '../../types';
import toast from 'react-hot-toast';

export default function Manage() {
  const [activeTab, setActiveTab] = useState<'categories' | 'questions'>('categories');
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Category Form State
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  
  // Question Management State
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [categoryQuestions, setCategoryQuestions] = useState<Question[]>([]);
  const [editingQuestion, setEditQuestion] = useState<Question | null>(null);
  
  // Form State (New or Edit)
  const [qType, setQType] = useState<'multiple_choice' | 'short_answer'>('multiple_choice');
  const [qText, setQText] = useState('');
  const [qOptions, setQOptions] = useState({ A: '', B: '', C: '', D: '' });
  const [qCorrect, setQCorrect] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [qExplanation, setQExplanation] = useState('');
  const [qMinWords, setQMinWords] = useState(0);
  const [qMaxScore, setQMaxScore] = useState(10);
  const [qKeywords, setQKeywords] = useState<{ keyword: string; weight: number }[]>([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCatId && activeTab === 'questions') {
      fetchQuestions(selectedCatId);
    }
  }, [selectedCatId, activeTab]);

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

  const fetchQuestions = async (catId: string) => {
    try {
      setLoading(true);
      const data = await api.getQuestionsByCategory(catId);
      setCategoryQuestions(data);
    } catch (error) {
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return toast.error('Name required');
    try {
      setLoading(true);
      const newCat = await api.createCategory(newCatName.trim(), newCatDesc.trim(), isPublished);
      setCategories([newCat, ...categories]);
      setNewCatName(''); setNewCatDesc('');
      toast.success('Category created');
    } catch (error) {
      toast.error('Failed to create category');
    } finally {
      setLoading(false);
    }
  };

  const resetQuestionForm = () => {
    setEditQuestion(null);
    setQText('');
    setQType('multiple_choice');
    setQOptions({ A: '', B: '', C: '', D: '' });
    setQCorrect('A');
    setQExplanation('');
    setQMinWords(0);
    setQMaxScore(10);
  };

  const handleEditClick = (q: Question) => {
    setEditQuestion(q);
    setQText(q.question_text);
    setQType(q.question_type);
    setQOptions({ 
      A: q.option_a || '', 
      B: q.option_b || '', 
      C: q.option_c || '', 
      D: q.option_d || '' 
    });
    setQCorrect(q.correct_option || 'A');
    setQExplanation(q.explanation || '');
    setQMinWords(q.min_word_count || 0);
    setQMaxScore(q.max_score || 10);
    setQKeywords(q.expected_keywords || []);
    
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmitQuestion = async () => {
    if (!selectedCatId) return toast.error('Select a category');
    if (!qText.trim()) return toast.error('Text required');

    if (qType === 'short_answer') {
      if (qKeywords.length === 0) return toast.error('At least 1 keyword required');
      const totalWeight = qKeywords.reduce((sum, k) => sum + k.weight, 0);
      if (totalWeight !== qMaxScore) {
        return toast.error(`Keyword weights (${totalWeight}) must equal Max Score (${qMaxScore})`);
      }
    }

    const payload = {
      category_id: selectedCatId,
      question_type: qType,
      question_text: qText.trim(),
      option_a: qType === 'multiple_choice' ? qOptions.A : null,
      option_b: qType === 'multiple_choice' ? qOptions.B : null,
      option_c: qType === 'multiple_choice' ? qOptions.C : null,
      option_d: qType === 'multiple_choice' ? qOptions.D : null,
      correct_option: qType === 'multiple_choice' ? qCorrect : null,
      min_word_count: qType === 'short_answer' ? qMinWords : 0,
      max_score: qType === 'short_answer' ? qMaxScore : 10,
      expected_keywords: qType === 'short_answer' ? qKeywords : [],
      explanation: qExplanation.trim(),
    };

    try {
      setLoading(true);
      if (editingQuestion) {
        await api.updateQuestion(editingQuestion.id, payload as any);
        toast.success('Question updated');
      } else {
        await api.createQuestion(payload as any);
        toast.success('Question created');
      }
      resetQuestionForm();
      fetchQuestions(selectedCatId);
    } catch (error: any) {
      toast.error(error.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (!confirm('Permanently delete this question?')) return;
    try {
      await api.deleteQuestion(qId);
      setCategoryQuestions(categoryQuestions.filter(q => q.id !== qId));
      toast.success('Deleted');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Content Management</h1>
          <p className="text-sm text-slate-500">Organize categories and technical question banks.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner">
          <button 
            onClick={() => setActiveTab('categories')}
            className={`px-6 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'categories' ? 'bg-white shadow text-sbk-blue' : 'text-slate-500'}`}
          >
            Categories
          </button>
          <button 
            onClick={() => { setActiveTab('questions'); resetQuestionForm(); }}
            className={`px-6 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'questions' ? 'bg-white shadow text-sbk-blue' : 'text-slate-500'}`}
          >
            Question Bank
          </button>
        </div>
      </div>

      {activeTab === 'categories' ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-8 bg-slate-50 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-900 mb-6">New Assessment Category</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              <Input label="Name" placeholder="e.g. Robotics" value={newCatName} onChange={e => setNewCatName(e.target.value)} />
              <Input label="Description" placeholder="Quick overview..." value={newCatDesc} onChange={e => setNewCatDesc(e.target.value)} />
              <Button onClick={handleCreateCategory} isLoading={loading}>Create Category</Button>
            </div>
          </div>
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map(cat => (
              <div key={cat.id} className="p-6 border border-slate-100 rounded-2xl flex justify-between items-center bg-white">
                <div>
                  <h3 className="font-bold text-slate-900">{cat.name}</h3>
                  <p className="text-sm text-slate-500">{cat.description}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => { setSelectedCatId(cat.id); setActiveTab('questions'); }}>Manage Questions</Button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Question Editor Form */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold text-slate-900">
                {editingQuestion ? 'Edit Question' : 'Create New Question'}
              </h2>
              {editingQuestion && (
                <button onClick={resetQuestionForm} className="text-slate-400 hover:text-slate-600 flex items-center gap-1 text-sm font-bold">
                  <X className="w-4 h-4" /> Cancel Edit
                </button>
              )}
            </div>

            <div className="space-y-6 max-w-4xl">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Category</label>
                <select 
                  className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold focus:ring-2 focus:ring-sbk-blue outline-none transition-all"
                  value={selectedCatId || ''}
                  onChange={e => setSelectedCatId(e.target.value)}
                >
                  <option value="" disabled>Select category...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="p-8 border border-slate-100 bg-slate-50 rounded-3xl space-y-6">
                <div className="flex gap-2 p-1 bg-slate-100 w-fit rounded-lg">
                  {(['multiple_choice', 'short_answer'] as const).map(type => (
                    <button 
                      key={type}
                      onClick={() => setQType(type)}
                      className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${qType === type ? 'bg-white shadow text-sbk-blue' : 'text-slate-500'}`}
                    >
                      {type.replace('_', ' ').toUpperCase()}
                    </button>
                  ))}
                </div>

                <Input label="Question Text" value={qText} onChange={e => setQText(e.target.value)} placeholder="Type the question here..." className="text-lg" />

                {qType === 'multiple_choice' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {(['A', 'B', 'C', 'D'] as const).map(label => (
                      <div key={label} className="relative group">
                        <Input 
                          label={`Option ${label}`} 
                          value={qOptions[label]} 
                          onChange={e => setQOptions({...qOptions, [label]: e.target.value})} 
                          className={qCorrect === label ? 'border-green-500 ring-4 ring-green-50' : ''}
                        />
                        <input 
                          type="radio" 
                          name="correct" 
                          checked={qCorrect === label} 
                          onChange={() => setQCorrect(label)}
                          className="absolute top-[38px] right-3 h-5 w-5 accent-green-500 cursor-pointer"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input label="Min Word Count" type="number" value={qMinWords} onChange={e => setQMinWords(parseInt(e.target.value))} />
                        <Input label="Max Score" type="number" value={qMaxScore} onChange={e => setQMaxScore(parseInt(e.target.value))} />
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Expected Keywords (Rubric)</label>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7 text-[10px]"
                            onClick={() => setQKeywords([...qKeywords, { keyword: '', weight: 0 }])}
                          >
                            <Plus className="w-3 h-3 mr-1" /> Add Keyword
                          </Button>
                        </div>
                        
                        <div className="space-y-3">
                          {qKeywords.length === 0 ? (
                            <p className="text-xs text-slate-400 italic py-2">No keywords added yet.</p>
                          ) : (
                            qKeywords.map((k, index) => (
                              <div key={index} className="flex gap-3 items-end group animate-in slide-in-from-left-2 duration-200">
                                <div className="flex-1">
                                  <Input 
                                    placeholder="Keyword or phrase..."
                                    value={k.keyword}
                                    onChange={(e) => {
                                      const updated = [...qKeywords];
                                      updated[index].keyword = e.target.value;
                                      setQKeywords(updated);
                                    }}
                                  />
                                </div>
                                <div className="w-24">
                                  <Input 
                                    type="number"
                                    placeholder="Weight"
                                    value={k.weight}
                                    onChange={(e) => {
                                      const updated = [...qKeywords];
                                      updated[index].weight = parseInt(e.target.value) || 0;
                                      setQKeywords(updated);
                                    }}
                                  />
                                </div>
                                <button 
                                  onClick={() => setQKeywords(qKeywords.filter((_, i) => i !== index))}
                                  className="p-2 text-slate-300 hover:text-red-500 transition-colors mb-1"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                        <div className="flex justify-end pr-10">
                           <p className={`text-[10px] font-black uppercase ${qKeywords.reduce((s, k) => s + k.weight, 0) === qMaxScore ? 'text-green-500' : 'text-amber-500'}`}>
                             Current Total Weight: {qKeywords.reduce((s, k) => s + k.weight, 0)} / {qMaxScore}
                           </p>
                        </div>
                      </div>
                    </div>
                )}

                <Input label="Explanation" value={qExplanation} onChange={e => setQExplanation(e.target.value)} placeholder="Why is this the answer?" />
                
                <div className="flex justify-end pt-4">
                  <Button onClick={handleSubmitQuestion} isLoading={loading} className="px-12">
                    <Save className="w-4 h-4 mr-2" /> {editingQuestion ? 'Update Question' : 'Save Question'}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Questions List for Selected Category */}
          {selectedCatId && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900">
                  Questions in {categories.find(c => c.id === selectedCatId)?.name}
                </h3>
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  {categoryQuestions.length} Questions Found
                </span>
              </div>
              <div className="divide-y divide-slate-100">
                {categoryQuestions.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 italic">No questions in this category yet.</div>
                ) : (
                  categoryQuestions.map(q => (
                    <div key={q.id} className="p-6 flex justify-between items-center hover:bg-slate-50/50 transition-colors">
                      <div className="flex-1 mr-8">
                        <div className="flex items-center gap-3 mb-1">
                          <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${q.question_type === 'multiple_choice' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                            {q.question_type.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">
                            {new Date(q.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-slate-800 line-clamp-2">{q.question_text}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleEditClick(q)} className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all" title="Edit">
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleDeleteQuestion(q.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
