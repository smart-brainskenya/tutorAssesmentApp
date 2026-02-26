import { X, BookOpen } from 'lucide-react';
import { Question } from '../../types';
import { cn } from '../../lib/utils';
import { Button } from '../common/Button';

interface QuestionNavigatorProps {
  questions: Question[];
  currentIndex: number;
  mcAnswers: Record<string, string>;
  textAnswers: Record<string, string>;
  onNavigate: (index: number) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function QuestionNavigator({
  questions,
  currentIndex,
  mcAnswers,
  textAnswers,
  onNavigate,
  isOpen,
  onClose,
}: QuestionNavigatorProps) {
  // Determine if a question is answered
  const isAnswered = (question: Question) => {
    if (question.question_type === 'multiple_choice') {
      return !!mcAnswers[question.id];
    } else {
      return (textAnswers[question.id]?.trim().length || 0) > 0;
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Slide-over Panel */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-[70] flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-sbk-primary" />
              Question Navigator
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {questions.filter(q => isAnswered(q)).length} of {questions.length} answered
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Question Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
            {questions.map((question, index) => {
              const answered = isAnswered(question);
              const current = index === currentIndex;

              return (
                <button
                  key={question.id}
                  onClick={() => {
                    onNavigate(index);
                    if (window.innerWidth < 640) onClose(); // Auto-close on mobile
                  }}
                  className={cn(
                    "aspect-square rounded-lg flex flex-col items-center justify-center text-sm font-semibold transition-all duration-200 relative group",
                    current
                      ? "bg-sbk-primary text-white shadow-md shadow-sbk-primary/20 ring-2 ring-offset-2 ring-sbk-primary"
                      : answered
                        ? "bg-green-50 text-green-700 border-2 border-green-200 hover:border-green-300 hover:bg-green-100"
                        : "bg-slate-50 text-slate-600 border-2 border-slate-200 hover:border-sbk-primary/30 hover:text-sbk-primary"
                  )}
                >
                  <span className="text-lg">{index + 1}</span>
                  {answered && !current && (
                    <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend / Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50">
          <div className="flex justify-between items-center text-xs text-slate-500 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-sbk-primary"></div>
              <span>Current</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-100 border border-green-200">
                <div className="w-full h-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                </div>
              </div>
              <span>Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-100 border border-slate-200"></div>
              <span>Unanswered</span>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full justify-center"
            onClick={onClose}
          >
            Close Navigator
          </Button>
        </div>
      </div>
    </>
  );
}
