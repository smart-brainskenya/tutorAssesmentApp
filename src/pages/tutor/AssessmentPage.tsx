import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { Button } from '../../components/common/Button';
import { AlertCircle, ChevronRight, ChevronLeft, Trophy } from 'lucide-react';
import { api } from '../../services/api';
import { Question, Answer } from '../../types';
import { gradeShortAnswer } from '../../utils/grading';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';

export default function AssessmentPage() {
  const { id } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mcAnswers, setMcAnswers] = useState<Record<number, 'A' | 'B' | 'C' | 'D'>>({});
  const [textAnswers, setTextAnswers] = useState<Record<number, string>>({});
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
    setMcAnswers({ ...mcAnswers, [currentIndex]: option });
  };

  const handleTextChange = (text: string) => {
    if (submitting || submitted) return;
    setTextAnswers({ ...textAnswers, [currentIndex]: text });
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
      let totalEarnedScore = 0;
      let totalPossibleScore = 0;
      const detailAnswers: Omit<Answer, 'id' | 'attempt_id'>[] = [];

      questions.forEach((q, index) => {
        if (q.question_type === 'short_answer') {
          const response = textAnswers[index] || '';
          const result = gradeShortAnswer(response, q.min_word_count, q.expected_keywords, q.max_score);
          
          totalEarnedScore += result.score;
          totalPossibleScore += (q.max_score || 10);

          detailAnswers.push({
            question_id: q.id,
            text_response: response,
            score: result.score,
            matched_keywords: result.matchedKeywords,
            is_correct: result.isCorrect
          });
        } else {
          const selected = mcAnswers[index];
          const isCorrect = selected === q.correct_option;
          const qScore = isCorrect ? 10 : 0; // MC defaults to 10 points
          
          totalEarnedScore += qScore;
          totalPossibleScore += 10;
          
          detailAnswers.push({
            question_id: q.id,
            selected_option: selected,
            score: qScore,
            is_correct: isCorrect
          });
        }
      });

      const finalPercentage = Math.round((totalEarnedScore / totalPossibleScore) * 100);
      
      await api.submitAttempt({
        user_id: profile.id,
        category_id: id,
        score: totalEarnedScore,
        percentage: finalPercentage,
      }, detailAnswers);

      setScore(totalEarnedScore);
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
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sbk-blue"></div>
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50/50 flex items-center justify-center px-6 py-12">
        <div className="max-w-2xl w-full animate-in fade-in zoom-in duration-500">
          {/* Trophy Icon */}
          <div className={`flex justify-center mb-10`}>
            <div className={`inline-flex items-center justify-center p-8 rounded-2xl ${ranking.bg}`}>
              <Trophy className={`w-20 h-20 ${ranking.color}`} />
            </div>
          </div>
          
          {/* Title */}
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-3">Assessment Complete!</h1>
            <p className="text-lg text-slate-600">Here's how you performed on this assessment.</p>
          </div>
          
          {/* Results Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden mb-10">
            {/* Top Progress Bar */}
            <div className="h-2 bg-slate-100">
              <div 
                className={`h-full transition-all duration-1000 ease-out ${percentage >= 60 ? 'bg-gradient-to-r from-sbk-blue to-sbk-teal' : 'bg-gradient-to-r from-sbk-orange to-amber-600'}`}
                style={{ width: `${percentage}%` }}
              ></div>
            </div>

            {/* Results Grid */}
            <div className="p-10 md:p-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Score Section */}
                <div className="flex flex-col justify-center">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Your Score</p>
                  <p className="text-5xl md:text-6xl font-bold text-slate-900 mb-2">{score}</p>
                  <p className={`text-3xl font-bold ${percentage >= 60 ? 'text-sbk-blue' : 'text-sbk-orange'}`}>
                    {Math.round(percentage)}%
                  </p>
                  <p className="text-sm text-slate-500 mt-4">
                    {percentage >= 90 ? '🎉 Outstanding performance!' : 
                     percentage >= 75 ? '✓ Great job!' :
                     percentage >= 60 ? '→ Good effort! Keep practicing.' :
                     '→ Keep working on this skill.'}
                  </p>
                </div>

                {/* Ranking Section */}
                <div className={`flex flex-col justify-center p-6 rounded-xl ${ranking.bg}`}>
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Your Ranking</p>
                  <p className={`text-4xl font-bold ${ranking.color} mb-4`}>{ranking.title}</p>
                  <p className="text-sm text-slate-700">
                    SBK Performance Benchmark: 75%
                  </p>
                  <div className="mt-4 pt-4 border-t border-current border-opacity-10">
                    <p className="text-xs text-slate-600">
                      {percentage >= 75 ? 'You are above benchmark!' : 'Target: 75% or higher'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/dashboard')} 
              variant="outline"
              className="px-8"
            >
              Back to Dashboard
            </Button>
            <Button 
              size="lg" 
              onClick={() => window.location.reload()}
              className="px-8 shadow-lg shadow-sbk-blue/20"
            >
              Retake Assessment
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const isMc = currentQuestion.question_type === 'multiple_choice';
  const options = isMc ? [
    { label: 'A', text: currentQuestion.option_a },
    { label: 'B', text: currentQuestion.option_b },
    { label: 'C', text: currentQuestion.option_c },
    { label: 'D', text: currentQuestion.option_d },
  ] : [];

  const isAnswered = isMc 
    ? mcAnswers[currentIndex] !== undefined 
    : (textAnswers[currentIndex]?.trim().length || 0) > 0;

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
          <div className="inline-flex items-center justify-center px-4 py-1.5 bg-slate-100 rounded-full mb-4">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Question {currentIndex + 1} of {questions.length}</span>
          </div>
          <div className="w-48 h-1 bg-slate-100 rounded-full overflow-hidden mx-auto">
            <div 
              className="h-full bg-gradient-to-r from-sbk-blue to-sbk-teal transition-all duration-500"
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
          {isMc ? (
            // Multiple Choice Options
            <div className="space-y-4">
              {options.map((option) => (
                <button
                  key={option.label}
                  onClick={() => handleOptionSelect(option.label as any)}
                  disabled={submitting || submitted}
                  className={`w-full p-6 rounded-xl border-2 transition-all duration-200 text-left flex items-start gap-4 group ${
                    mcAnswers[currentIndex] === option.label 
                      ? 'border-sbk-blue bg-blue-50 shadow-md' 
                      : 'border-slate-200 hover:border-sbk-blue/30 hover:bg-slate-50 hover:shadow-sm'
                  } ${(submitting || submitted) ? 'cursor-not-allowed opacity-75' : 'cursor-pointer active:scale-[0.99]'}`}
                >
                  {/* Option Letter Button */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-lg border-2 flex items-center justify-center font-bold text-sm transition-all duration-200 ${
                    mcAnswers[currentIndex] === option.label 
                      ? 'bg-sbk-blue border-sbk-blue text-white' 
                      : 'bg-white border-slate-300 text-slate-600 group-hover:border-sbk-blue/40'
                  }`}>
                    {option.label}
                  </div>
                  {/* Option Text */}
                  <span className={`flex-1 text-lg font-semibold pt-0.5 ${
                    mcAnswers[currentIndex] === option.label 
                      ? 'text-primary-900' 
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
                    className="w-full h-48 p-5 rounded-xl border-2 border-slate-200 focus:border-sbk-blue focus:ring-4 focus:ring-sbk-blue/10 focus:outline-none transition-all duration-200 resize-none text-lg leading-relaxed text-slate-700 placeholder-slate-400 font-medium"
                  placeholder="Type your detailed response here. Be thorough and clear in your answer..."
                  value={textAnswers[currentIndex] || ''}
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
                    <span className={`font-bold ${(textAnswers[currentIndex]?.trim().split(/\s+/).filter(w => w).length || 0) >= (currentQuestion.min_word_count || 0) ? 'text-green-600' : 'text-amber-600'}`}>
                      {(textAnswers[currentIndex]?.trim().split(/\s+/).filter(w => w).length) || 0}
                    </span>
                  </div>
                </div>
                {(textAnswers[currentIndex]?.trim().split(/\s+/).filter(w => w).length || 0) >= (currentQuestion.min_word_count || 0) && (
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
