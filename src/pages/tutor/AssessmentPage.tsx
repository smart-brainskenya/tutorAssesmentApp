import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { Button } from '../../components/common/Button';
import { AlertCircle, ChevronRight, ChevronLeft, Trophy } from 'lucide-react';
import { api } from '../../services/api';
import { Question } from '../../types';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';

export default function AssessmentPage() {
  const { id } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, 'A' | 'B' | 'C' | 'D'>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [percentage, setPercentage] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) fetchQuestions(id);
  }, [id]);

  const fetchQuestions = async (categoryId: string) => {
    try {
      const data = await api.getQuestionsByCategory(categoryId);
      if (data.length === 0) {
        setError('No questions found for this category.');
      }
      setQuestions(data);
    } catch (err: any) {
      setError('Failed to load assessment. ' + err.message);
      toast.error('Network error. Could not fetch questions.');
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (option: 'A' | 'B' | 'C' | 'D') => {
    if (submitting || submitted) return;
    setAnswers({ ...answers, [currentIndex]: option });
  };

  const getRanking = (pct: number) => {
    if (pct >= 90) return { title: 'SBK Elite', color: 'text-purple-600', bg: 'bg-purple-100' };
    if (pct >= 75) return { title: 'Code Captain', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (pct >= 60) return { title: 'Smart Operator', color: 'text-green-600', bg: 'bg-green-100' };
    if (pct >= 40) return { title: 'Rising Brain', color: 'text-amber-600', bg: 'bg-amber-100' };
    return { title: 'Needs Debugging', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const handleSubmit = async () => {
    if (!profile || !id || submitting) return;

    setSubmitting(true);
    const toastId = toast.loading('Calculating and saving results...');

    try {
      let correctCount = 0;
      const detailAnswers: any[] = [];

      questions.forEach((q, index) => {
        const selected = answers[index];
        const isCorrect = selected === q.correct_option;
        if (isCorrect) correctCount++;
        
        detailAnswers.push({
          question_id: q.id,
          selected_option: selected,
          is_correct: isCorrect
        });
      });

      const finalPercentage = (correctCount / questions.length) * 100;
      
      await api.submitAttempt({
        user_id: profile.id,
        category_id: id,
        score: correctCount,
        percentage: finalPercentage,
      }, detailAnswers);

      setScore(correctCount);
      setPercentage(finalPercentage);
      setSubmitted(true);
      toast.success('Assessment saved!', { id: toastId });

      if (finalPercentage >= 90) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#0ea5e9', '#6366f1', '#a855f7']
        });
      }
    } catch (err: any) {
      console.error('Failed to save attempt:', err);
      toast.error(err.message || 'Failed to save results. Please try again.', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col justify-center items-center min-h-[50vh] gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      <p className="text-slate-500 font-medium">Preparing questions...</p>
    </div>
  );

  if (error) return (
    <div className="text-center py-12 bg-white rounded-3xl border border-slate-200">
      <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
      <h3 className="text-xl font-bold text-slate-900">{error}</h3>
      <p className="text-slate-500 mt-2 mb-6">Please choose another category or try again later.</p>
      <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
    </div>
  );

  if (submitted) {
    const ranking = getRanking(percentage);
    return (
      <div className="max-w-2xl mx-auto text-center py-12 animate-in fade-in zoom-in duration-500">
        <div className={`inline-flex items-center justify-center p-6 rounded-full mb-8 ${ranking.bg}`}>
          <Trophy className={`w-16 h-16 ${ranking.color}`} />
        </div>
        
        <h1 className="text-4xl font-black text-slate-900 mb-2">Assessment Finished!</h1>
        <p className="text-slate-500 text-lg mb-8">Great effort! Here is your performance summary.</p>
        
        <div className="bg-white p-10 rounded-3xl border-2 border-slate-100 shadow-xl mb-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-slate-100">
             <div 
               className={`h-full transition-all duration-1000 ease-out ${percentage >= 60 ? 'bg-green-500' : 'bg-amber-500'}`}
               style={{ width: `${percentage}%` }}
             ></div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="text-left border-r border-slate-100 pr-8">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Your Score</p>
              <p className="text-5xl font-black text-slate-900">{score}<span className="text-2xl text-slate-300">/{questions.length}</span></p>
              <p className="text-2xl font-bold text-primary-600 mt-1">{Math.round(percentage)}%</p>
            </div>
            <div className="text-left pl-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">System Ranking</p>
              <p className={`text-3xl font-black ${ranking.color}`}>{ranking.title}</p>
              <p className="text-sm text-slate-500 mt-2">Internal Benchmark: 75%</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" onClick={() => navigate('/dashboard')} variant="outline">Back to Dashboard</Button>
          <Button size="lg" onClick={() => window.location.reload()}>Retake Assessment</Button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const options = [
    { label: 'A', text: currentQuestion.option_a },
    { label: 'B', text: currentQuestion.option_b },
    { label: 'C', text: currentQuestion.option_c },
    { label: 'D', text: currentQuestion.option_d },
  ];

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Live Assessment</h1>
          <p className="text-slate-500">Question {currentIndex + 1} of {questions.length}</p>
        </div>
        <div className="text-right">
          <div className="text-xs font-bold text-slate-400 uppercase mb-1">Progress</div>
          <div className="w-32 bg-slate-200 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-primary-600 h-full transition-all duration-500"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="bg-white p-10 rounded-3xl border-2 border-slate-100 shadow-sm mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-8 leading-tight">
          {currentQuestion.question_text}
        </h2>

        <div className="space-y-4">
          {options.map((option) => (
            <div 
              key={option.label}
              onClick={() => handleOptionSelect(option.label as any)}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4 ${
                answers[currentIndex] === option.label 
                  ? 'border-primary-500 bg-primary-50 ring-4 ring-primary-50' 
                  : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
              } ${submitting ? 'pointer-events-none opacity-80' : ''}`}
            >
              <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center font-black text-sm transition-colors ${
                answers[currentIndex] === option.label ? 'bg-primary-600 border-primary-600 text-white' : 'bg-white border-slate-200 text-slate-400'
              }`}>
                {option.label}
              </div>
              <span className={`text-lg font-semibold ${answers[currentIndex] === option.label ? 'text-primary-900' : 'text-slate-700'}`}>
                {option.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center px-2">
        <Button 
          variant="ghost" 
          disabled={currentIndex === 0 || submitting}
          onClick={() => setCurrentIndex(currentIndex - 1)}
          className="text-slate-500"
        >
          <ChevronLeft className="w-4 h-4 mr-2" /> Previous
        </Button>

        {currentIndex === questions.length - 1 ? (
          <Button 
            size="lg"
            variant="primary" 
            onClick={handleSubmit}
            disabled={answers[currentIndex] === undefined || submitting}
            isLoading={submitting}
            className="px-8 shadow-lg shadow-primary-200"
          >
            Submit Assessment
          </Button>
        ) : (
          <Button 
            size="lg"
            variant="primary" 
            onClick={() => setCurrentIndex(currentIndex + 1)}
            disabled={answers[currentIndex] === undefined || submitting}
            className="px-8 shadow-lg shadow-primary-200"
          >
            Next Question <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
