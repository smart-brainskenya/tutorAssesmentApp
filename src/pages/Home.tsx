import { Link } from 'react-router-dom';
import { Lightbulb, ShieldCheck, TrendingUp, Users } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-sbk-slate-50 flex flex-col font-sans">
      {/* Navigation */}
      <nav className="bg-white border-b border-sbk-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0 flex items-center gap-2">
              <Lightbulb className="w-8 h-8 text-sbk-blue" />
              <span className="font-bold text-xl text-sbk-slate-900 tracking-tight">SBK Tutor Intel</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-sbk-slate-600 hover:text-sbk-blue font-medium transition-colors px-3 py-2"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="bg-sbk-blue hover:bg-sbk-teal text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-grow">
        <div className="relative">
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
              alt="Team collaborating"
              className="w-full h-[500px] object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-sbk-slate-900/80 to-sbk-slate-50"></div>
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-6 drop-shadow-md">
              Smart Brains Kenya <br />
              <span className="text-sbk-blue">Tutor Assessment Portal</span>
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-sbk-slate-100 mb-10 drop-shadow">
              Our internal platform for evaluating, tracking, and elevating tutor performance. Ensure excellence in every session.
            </p>
            <div className="flex justify-center gap-4">
              <Link
                to="/login"
                className="bg-sbk-blue hover:bg-sbk-teal text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-sbk-blue/30 flex items-center gap-2"
              >
                Sign In to Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-sbk-slate-900">Empowering Our Tutors</h2>
            <p className="mt-4 text-lg text-sbk-slate-600">Secure, internal intelligence for continuous improvement.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-sbk-slate-200 text-center hover:border-sbk-blue/30 transition-colors">
              <div className="inline-flex items-center justify-center p-4 bg-sbk-blue/10 rounded-full mb-6 text-sbk-blue">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-sbk-slate-900 mb-3">Secure Assessments</h3>
              <p className="text-sbk-slate-600">Take mandated skill tests in a controlled, integrity-first environment.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-sbk-slate-200 text-center hover:border-sbk-blue/30 transition-colors">
              <div className="inline-flex items-center justify-center p-4 bg-sbk-teal/10 rounded-full mb-6 text-sbk-teal">
                <TrendingUp className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-sbk-slate-900 mb-3">Performance Tracking</h3>
              <p className="text-sbk-slate-600">Review metrics and identify areas for professional growth.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-sbk-slate-200 text-center hover:border-sbk-blue/30 transition-colors">
              <div className="inline-flex items-center justify-center p-4 bg-sbk-orange/10 rounded-full mb-6 text-sbk-orange">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-sbk-slate-900 mb-3">Admin Intelligence</h3>
              <p className="text-sbk-slate-600">Comprehensive dashboards for management to oversee tutor readiness.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-sbk-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-sbk-slate-500 font-medium">
          <p>Internal Tool - Authorized Personnel Only</p>
          <p className="mt-2">&copy; {new Date().getFullYear()} Smart Brains Kenya. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
