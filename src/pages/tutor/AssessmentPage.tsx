import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { Button } from '../../components/common/Button';
import { Alert } from '../../components/common/Alert';
import { ChevronRight, ChevronLeft, Trophy } from 'lucide-react';
import { api } from '../../services/api';
import { Question, Section } from '../../types';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';

export default function AssessmentPage() {
  const { id } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  const [sections, setSections] = useState<Section[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mcAnswers, setMcAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) fetchAssessmentData(id);
  }, [id]);

  const fetchAssessmentData = async (categoryId: string) => {
    try {
      setLoading(true);
      // 1. Fetch Sections
      const fetchedSections = await api.getSectionsByCategory(categoryId);
      if (fetchedSections.length === 0) {
        setError('No sections found for this assessment.');
        return;
      }
      setSections(fetchedSections);

      // 2. Fetch Questions for each section and flatten them
      const allQuestions: Question[] = [];
      for (const section of fetchedSections) {
        const sectionQuestions = await api.getQuestionsBySection(section.id);
        allQuestions.push(...sectionQuestions);
      }

      if (allQuestions.length === 0) {
        setError('No questions found for this assessment.');
        return;
      }
      setQuestions(allQuestions);
    } catch (err: any) {
      setError('Failed to load assessment. ' + err.message);
      toast.error('Network error. Could not fetch assessment data.');
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = questions[currentIndex];
  const currentSection = sections.find(s => s.id === currentQuestion?.section_id);

  const handleOptionSelect = (option: 'A' | 'B' | 'C' | 'D') => {
    if (submitting || submitted || !currentQuestion) return;
    setMcAnswers({ ...mcAnswers, [currentQuestion.id]: option });
  };

  const handleTextChange = (text: string) => {
    if (submitting || submitted || !currentQuestion) return;
    setTextAnswers({ ...textAnswers, [currentQuestion.id]: text });
  };

  const handleSubmit = async () => {
    if (!profile || !id || submitting) return;

    setSubmitting(true);
    const toastId = toast.loading('Submitting your assessment...');

    try {
      // 1. Logic for Section A (Auto-grading MCQ)
      const mcQuestions = questions.filter(q => q.question_type === 'multiple_choice');
      let sectionARawScore = 0;
      let sectionAMaxScore = 0;
      const snapshot: Record<string, string> = {};

      mcQuestions.forEach(q => {
        const selected = mcAnswers[q.id];
        const points = q.points || 10;
        sectionAMaxScore += points;
        snapshot[q.id] = selected || '';
        if (selected === q.correct_option) {
          sectionARawScore += points;
        }
      });

      // 2. Logic for Section B (Manual Review Submissions)
      const saQuestions = questions.filter(q => q.question_type === 'short_answer');
      const sectionBSubs = saQuestions.map(q => ({
        questionId: q.id,
        answerText: textAnswers[q.id] || ''
      }));

      // 3. Submit via API
      await api.submitHybridAssessment({
        categoryId: id,
        sectionA: {
          rawScore: sectionARawScore,
          maxScore: sectionAMaxScore,
          snapshot
        },
        sectionB: sectionBSubs
      });

      setScore(sectionARawScore);
      setSubmitted(true);
      toast.success('Assessment submitted for review!', { id: toastId });

      if ((sectionARawScore / sectionAMaxScore) >= 0.9) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#0ea5e9', '#6366f1', '#a855f7']
        });
      }
    } catch (err: any) {
      console.error('Failed to submit attempt:', err);
      toast.error(err.message || 'Failed to submit. Please try again.', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col justify-center items-center min-h-[50vh] gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sbk-primary"></div>
      <p className="text-slate-600 font-medium">Preparing questions...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full">
        <Alert
          variant="error"
          title="Assessment Unavailable"
          message={error}
        />
        <div className="mt-6 flex justify-center">
          <Button onClick={() => navigate('/dashboard', { state: { initialView: 'tests' } })}>
            Back to Available Tests
          </Button>
        </div>
      </div>
    </div>
  );

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50/50 flex items-center justify-center px-6 py-12">
        <div className="max-w-2xl w-full animate-in fade-in zoom-in duration-500">
          <div className="flex justify-center mb-10">
            <div className="inline-flex items-center justify-center p-8 rounded-2xl bg-amber-100">
              <Trophy className="w-20 h-20 text-amber-600" />
            </div>
          </div>
          
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-3">Assessment Submitted!</h1>
            <p className="text-lg text-slate-600">Your performance is being recorded.</p>
          </div>
          
          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden mb-10">
            <div className="p-10 md:p-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="flex flex-col justify-center">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Section A Score</p>
                  <p className="text-5xl md:text-6xl font-bold text-slate-900 mb-2">{score}</p>
                  <p className="text-xl font-bold text-sbk-blue">
                    Knowledge Check Complete
                  </p>
                </div>

                <div className="flex flex-col justify-center p-6 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Status</p>
                  <p className="text-2xl font-bold text-sbk-orange mb-2">Awaiting Review</p>
                  <p className="text-sm text-slate-600">
                    Your Section B responses are pending manual review by an SBK Admin.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/dashboard')} 
              variant="outline"
              className="px-8"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }


  const isMc = currentQuestion?.question_type === 'multiple_choice';
  const options = isMc && currentQuestion ? [
    { label: 'A', text: currentQuestion.option_a },
    { label: 'B', text: currentQuestion.option_b },
    { label: 'C', text: currentQuestion.option_c },
    { label: 'D', text: currentQuestion.option_d },
  ] : [];

  const isAnswered = currentQuestion 
    ? (currentQuestion.question_type === 'multiple_choice' 
        ? mcAnswers[currentQuestion.id] !== undefined 
        : (textAnswers[currentQuestion.id]?.trim().length || 0) > 0)
    : false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50/50">
      {/* Top Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-slate-100 z-50">
        <div 
          className="h-full bg-gradient-to-r from-sbk-blue to-sbk-teal transition-all duration-500"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        ></div>
      </div>

      <div className="max-w-3xl mx-auto py-12 px-6">
        {/* Header - Minimal and Focused */}
        <div className="mb-10 text-center">
          {currentSection && (
             <div className="mb-2">
                <span className="text-sm font-black text-sbk-primary uppercase tracking-[0.2em] bg-sbk-primary/10 px-4 py-1 rounded-full">
                  {currentSection.title}
                </span>
             </div>
          )}
          <div className="inline-flex items-center justify-center px-4 py-1.5 bg-slate-100 rounded-full mb-4">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Question {currentIndex + 1} of {questions.length}</span>
          </div>
          <div className="w-48 h-1 bg-slate-100 rounded-full overflow-hidden mx-auto">
            <div
              className="h-full bg-gradient-to-r from-sbk-primary to-sbk-depth transition-all duration-500"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Question Container */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 md:p-10 mb-10 focus-visible:ring-2 focus-visible:ring-primary-500">
          {/* Question Type Badge */}
          <div className="mb-8">
            <span className="inline-block text-xs font-bold text-slate-600 uppercase tracking-widest bg-slate-100 px-3 py-1.5 rounded-lg">
              {currentQuestion.question_type === 'multiple_choice' ? 'Multiple Choice' : 'Short Answer'}
            </span>
          </div>

          {/* Question Text */}
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-10 leading-relaxed">
            {currentQuestion.question_text}
          </h2>

          {/* Answer Section */}
          {currentQuestion.question_type === 'multiple_choice' ? (
            // Multiple Choice Options
            <div className="space-y-4">
              {options.map((option) => (
                <button
                  key={option.label}
                  onClick={() => handleOptionSelect(option.label as any)}
                  disabled={submitting || submitted}
                  className={`w-full p-6 rounded-xl border-2 transition-all duration-200 text-left flex items-start gap-4 group ${
                    mcAnswers[currentQuestion.id] === option.label
                      ? 'border-sbk-primary bg-sbk-primary/10 shadow-md'
                      : 'border-slate-200 hover:border-sbk-primary/30 hover:bg-slate-50 hover:shadow-sm'
                  } ${(submitting || submitted) ? 'cursor-not-allowed opacity-75' : 'cursor-pointer active:scale-[0.99]'}`}
                >
                  {/* Option Letter Button */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-lg border-2 flex items-center justify-center font-bold text-sm transition-all duration-200 ${
                    mcAnswers[currentQuestion.id] === option.label
                      ? 'bg-sbk-primary border-sbk-primary text-white'
                      : 'bg-white border-slate-300 text-slate-600 group-hover:border-sbk-primary/40'
                  }`}>
                    {option.label}
                  </div>
                  {/* Option Text */}
                  <span className={`flex-1 text-lg font-semibold pt-0.5 ${
                    mcAnswers[currentQuestion.id] === option.label
                      ? 'text-slate-900'
                      : 'text-slate-700'
                  }`}>
                    {option.text}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            // Short Answer Input
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Your Answer
                </label>
                <textarea
                    className="w-full h-48 p-5 rounded-xl border-2 border-slate-200 focus:border-sbk-primary focus:ring-4 focus:ring-sbk-primary/10 focus:outline-none transition-all duration-200 resize-none text-lg leading-relaxed text-slate-700 placeholder-slate-400 font-medium"
                  placeholder="Type your detailed response here. Be thorough and clear in your answer..."
                  value={textAnswers[currentQuestion.id] || ''}
                  onChange={(e) => handleTextChange(e.target.value)}
                  disabled={submitting || submitted}
                />
              </div>
              
              {/* Word Count and Requirements */}
              <div className="flex justify-between items-center bg-slate-50 rounded-lg p-4 border border-slate-100">
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <span className="text-slate-600 font-medium">Minimum Words: </span>
                    <span className="font-bold text-slate-900">{currentQuestion.min_word_count || 0}</span>
                  </div>
                  <div className="hidden md:block h-4 border-l border-slate-200"></div>
                  <div className="md:block">
                    <span className="text-slate-600 font-medium">Your Words: </span>
                    <span className={`font-bold ${(textAnswers[currentQuestion.id]?.trim().split(/\s+/).filter(w => w).length || 0) >= (currentQuestion.min_word_count || 0) ? 'text-green-600' : 'text-amber-600'}`}>
                      {(textAnswers[currentQuestion.id]?.trim().split(/\s+/).filter(w => w).length) || 0}
                    </span>
                  </div>
                </div>
                {(textAnswers[currentQuestion.id]?.trim().split(/\s+/).filter(w => w).length || 0) >= (currentQuestion.min_word_count || 0) && (
                  <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">✓ Met</span>
                )}
              </div>
            </div>
          )}
        </div>


        {/* Navigation Buttons */}
        <div className="flex items-center justify-between gap-4">
          <Button 
            variant="ghost" 
            size="lg"
            disabled={currentIndex === 0 || submitting || submitted}
            onClick={() => setCurrentIndex(currentIndex - 1)}
            className="px-6 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          >
            <ChevronLeft className="w-5 h-5 mr-2" /> Previous
          </Button>

          <div className="flex-1"></div>

          {currentIndex === questions.length - 1 ? (
            <Button 
              size="lg"
              onClick={handleSubmit}
              disabled={!isAnswered || submitting || submitted}
              isLoading={submitting}
              className="px-8 shadow-lg shadow-sbk-blue/20 hover:shadow-xl hover:shadow-sbk-blue/30 transition-all duration-200"
            >
              <Trophy className="w-5 h-5 mr-2" />
              Submit Assessment
            </Button>
          ) : (
            <Button 
              size="lg"
              onClick={() => setCurrentIndex(currentIndex + 1)}
              disabled={!isAnswered || submitting || submitted}
              className="px-8 shadow-lg shadow-sbk-blue/20 hover:shadow-xl hover:shadow-sbk-blue/30 transition-all duration-200"
            >
              Next Question <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
