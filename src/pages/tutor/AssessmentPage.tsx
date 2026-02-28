import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { Button } from '../../components/common/Button';
import { Alert } from '../../components/common/Alert';
import { ChevronRight, ChevronLeft, Trophy, CheckCircle2, Clock, CheckCircle, BarChart3, Home } from 'lucide-react';
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError('Failed to load assessment. ' + message);
      toast.error('Gremlins in the wires! 👾 Could not fetch assessment data.');
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
    const toastId = toast.loading('One Momment✍️');

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
      toast.success('Assessment launched! 🚀 Fingers crossed!', { id: toastId });

      if ((sectionARawScore / sectionAMaxScore) >= 0.9) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#0ea5e9', '#6366f1', '#a855f7']
        });
      }
    } catch (err: unknown) {
      console.error('Failed to submit attempt:', err);
      const message = err instanceof Error ? err.message : 'Submission blocked by the firewall of doom! 🛡️ Try again.';
      toast.error(message, { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col justify-center items-center min-h-[50vh] gap-4">
      <LoadingSpinner />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-sbk-slate-50 flex items-center justify-center px-6 py-12">
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
      <div className="min-h-screen bg-gradient-to-br from-sbk-slate-50 via-white to-sbk-slate-50/50 flex items-center justify-center px-6 py-12">
        <div className="max-w-3xl w-full animate-in fade-in zoom-in duration-500">
          {/* Success Icon */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center justify-center p-6 rounded-full bg-sbk-green-100 ring-8 ring-green-50">
              <CheckCircle2 className="w-16 h-16 text-sbk-green-600" />
            </div>
          </div>
          
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-sbk-slate-900 mb-3">Assessment Submitted!</h1>
            <p className="text-lg text-sbk-slate-600">Your responses have been securely recorded.</p>
          </div>

          {/* Lifecycle Indicator */}
          <div className="mb-12">
            <div className="relative flex justify-between w-full max-w-lg mx-auto">
              {/* Progress Line */}
              <div className="absolute top-1/2 left-0 w-full h-1 bg-sbk-slate-200 -translate-y-1/2 -z-10 rounded-full"></div>
              <div className="absolute top-1/2 left-0 w-1/2 h-1 bg-sbk-green-500 -translate-y-1/2 -z-10 rounded-full"></div>

              {/* Step 1: Submitted */}
              <div className="flex flex-col items-center gap-2 bg-white px-2">
                <div className="w-10 h-10 rounded-full bg-sbk-green-500 flex items-center justify-center shadow-md ring-4 ring-white">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-bold text-sbk-green-700 uppercase tracking-wide">Submitted</span>
              </div>

              {/* Step 2: In Review */}
              <div className="flex flex-col items-center gap-2 bg-white px-2">
                <div className="w-10 h-10 rounded-full bg-sbk-amber-500 flex items-center justify-center shadow-md ring-4 ring-white animate-pulse">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-bold text-sbk-amber-600 uppercase tracking-wide">In Review</span>
              </div>

              {/* Step 3: Graded */}
              <div className="flex flex-col items-center gap-2 bg-white px-2">
                <div className="w-10 h-10 rounded-full bg-sbk-slate-200 flex items-center justify-center ring-4 ring-white">
                  <Trophy className="w-5 h-5 text-sbk-slate-400" />
                </div>
                <span className="text-xs font-bold text-sbk-slate-400 uppercase tracking-wide">Graded</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl border border-sbk-slate-200 shadow-xl shadow-sbk-slate-200/50 overflow-hidden mb-8">
            <div className="p-8 md:p-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 divide-y md:divide-y-0 md:divide-x divide-sbk-slate-100">

                {/* Section A Score */}
                <div className="flex flex-col justify-center items-center md:items-start text-center md:text-left pb-8 md:pb-0">
                  <span className="inline-block px-3 py-1 bg-sbk-blue/10 text-sbk-depth text-[10px] font-bold uppercase tracking-widest rounded-full mb-4">
                    Multiple Choice Results
                  </span>
                  <div className="mb-2">
                    <span className="text-5xl font-black text-sbk-slate-900 tracking-tight">{score}</span>
                    <span className="text-xl font-bold text-sbk-slate-400 ml-2">pts</span>
                  </div>
                  <p className="text-sm font-medium text-sbk-slate-500 leading-relaxed">
                    Your Section A answers have been auto-graded. This score contributes to your final assessment grade.
                  </p>
                </div>

                {/* Section B Status */}
                <div className="flex flex-col justify-center items-center md:items-start text-center md:text-left pt-8 md:pt-0 md:pl-12">
                   <span className="inline-block px-3 py-1 bg-sbk-amber-50 text-sbk-amber-700 text-[10px] font-bold uppercase tracking-widest rounded-full mb-4">
                    Short Answer Status
                  </span>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-3 h-3 rounded-full bg-sbk-amber-500 animate-pulse"></div>
                    <span className="text-2xl font-bold text-sbk-slate-900">Pending Review</span>
                  </div>
                  <p className="text-sm font-medium text-sbk-slate-500 leading-relaxed mb-4">
                    Your written responses have been queued for manual grading by an instructor.
                  </p>
                  <div className="bg-sbk-slate-50 rounded-lg p-3 w-full border border-sbk-slate-100">
                     <p className="text-xs text-sbk-slate-600 font-medium flex items-center justify-center md:justify-start gap-2">
                       <Clock className="w-3.5 h-3.5 text-sbk-slate-400" />
                       Expected timeframe: <span className="text-sbk-slate-900 font-bold">24-48 hours</span>
                     </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Status Bar */}
            <div className="bg-sbk-slate-50 px-8 py-4 border-t border-sbk-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
              <p className="text-sm font-bold text-sbk-slate-600">
                Overall Status: <span className="text-sbk-amber-600">Awaiting Review</span>
              </p>
              <p className="text-xs font-medium text-sbk-slate-400">
                Reference ID: #{id?.substring(0, 8)}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate('/results')}
              className="px-8 bg-sbk-slate-900 hover:bg-sbk-slate-800 text-white shadow-lg shadow-sbk-slate-900/20"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              View Performance History
            </Button>
            <Button 
              size="lg" 
              onClick={() => navigate('/dashboard')} 
              variant="outline"
              className="px-8 border-sbk-slate-200 hover:bg-sbk-slate-50 text-sbk-slate-700"
            >
              <Home className="w-4 h-4 mr-2" />
              Return to Dashboard
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
    <div className="min-h-screen bg-gradient-to-br from-sbk-slate-50 via-white to-sbk-slate-50/50">
      {/* Top Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-sbk-slate-100 z-50">
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
          <div className="inline-flex items-center justify-center px-4 py-1.5 bg-sbk-slate-100 rounded-full mb-4">
            <span className="text-xs font-bold text-sbk-slate-600 uppercase tracking-wider">Question {currentIndex + 1} of {questions.length}</span>
          </div>
          <div className="w-48 h-1 bg-sbk-slate-100 rounded-full overflow-hidden mx-auto">
            <div
              className="h-full bg-gradient-to-r from-sbk-primary to-sbk-depth transition-all duration-500"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Question Container */}
        <div className="bg-white rounded-2xl border border-sbk-slate-200 shadow-sm p-8 md:p-10 mb-10 focus-visible:ring-2 focus-visible:ring-sbk-blue">
          {/* Question Type Badge */}
          <div className="mb-8">
            <span className="inline-block text-xs font-bold text-sbk-slate-600 uppercase tracking-widest bg-sbk-slate-100 px-3 py-1.5 rounded-lg">
              {currentQuestion.question_type === 'multiple_choice' ? 'Multiple Choice' : 'Short Answer'}
            </span>
          </div>

          {/* Question Text */}
          <h2 className="text-xl md:text-2xl font-bold text-sbk-slate-900 mb-10 leading-relaxed">
            {currentQuestion.question_text}
          </h2>

          {/* Answer Section */}
          {currentQuestion.question_type === 'multiple_choice' ? (
            // Multiple Choice Options
            <div className="space-y-4">
              {options.map((option) => (
                <button
                  key={option.label}
                  onClick={() => handleOptionSelect(option.label as 'A' | 'B' | 'C' | 'D')}
                  disabled={submitting || submitted}
                  className={`w-full p-6 rounded-xl border-2 transition-all duration-200 text-left flex items-start gap-4 group ${
                    mcAnswers[currentQuestion.id] === option.label
                      ? 'border-sbk-primary bg-sbk-primary/10 shadow-md'
                      : 'border-sbk-slate-200 hover:border-sbk-primary/30 hover:bg-sbk-slate-50 hover:shadow-sm'
                  } ${(submitting || submitted) ? 'cursor-not-allowed opacity-75' : 'cursor-pointer active:scale-[0.99]'}`}
                >
                  {/* Option Letter Button */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-lg border-2 flex items-center justify-center font-bold text-sm transition-all duration-200 ${
                    mcAnswers[currentQuestion.id] === option.label
                      ? 'bg-sbk-primary border-sbk-primary text-white'
                      : 'bg-white border-sbk-slate-300 text-sbk-slate-600 group-hover:border-sbk-primary/40'
                  }`}>
                    {option.label}
                  </div>
                  {/* Option Text */}
                  <span className={`flex-1 text-lg font-semibold pt-0.5 ${
                    mcAnswers[currentQuestion.id] === option.label
                      ? 'text-sbk-slate-900'
                      : 'text-sbk-slate-700'
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
                <label className="block text-sm font-semibold text-sbk-slate-700 mb-3">
                  Your Answer
                </label>
                <textarea
                    className="w-full h-48 p-5 rounded-xl border-2 border-sbk-slate-200 focus:border-sbk-primary focus:ring-4 focus:ring-sbk-primary/10 focus:outline-none transition-all duration-200 resize-none text-lg leading-relaxed text-sbk-slate-700 placeholder-slate-400 font-medium"
                  placeholder="Type your detailed response here. Be thorough and clear in your answer..."
                  value={textAnswers[currentQuestion.id] || ''}
                  onChange={(e) => handleTextChange(e.target.value)}
                  disabled={submitting || submitted}
                />
              </div>
              
              {/* Word Count and Requirements */}
              <div className="flex justify-between items-center bg-sbk-slate-50 rounded-lg p-4 border border-sbk-slate-100">
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <span className="text-sbk-slate-600 font-medium">Minimum Words: </span>
                    <span className="font-bold text-sbk-slate-900">{currentQuestion.min_word_count || 0}</span>
                  </div>
                  <div className="hidden md:block h-4 border-l border-sbk-slate-200"></div>
                  <div className="md:block">
                    <span className="text-sbk-slate-600 font-medium">Your Words: </span>
                    <span className={`font-bold ${(textAnswers[currentQuestion.id]?.trim().split(/\s+/).filter(w => w).length || 0) >= (currentQuestion.min_word_count || 0) ? 'text-sbk-green-600' : 'text-sbk-amber-600'}`}>
                      {(textAnswers[currentQuestion.id]?.trim().split(/\s+/).filter(w => w).length) || 0}
                    </span>
                  </div>
                </div>
                {(textAnswers[currentQuestion.id]?.trim().split(/\s+/).filter(w => w).length || 0) >= (currentQuestion.min_word_count || 0) && (
                  <span className="text-xs font-bold text-sbk-green-600 bg-sbk-green-50 px-3 py-1 rounded-full">✓ Met</span>
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
            className="px-6 text-sbk-slate-600 hover:text-sbk-slate-900 hover:bg-sbk-slate-100"
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
