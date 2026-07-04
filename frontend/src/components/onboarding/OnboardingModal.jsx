import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Workflow, Target, Activity, CheckCircle, ArrowRight, Briefcase, Users, Zap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

const STORAGE_KEY = 'ats_onboarding_complete';

const features = [
  {
    icon: Workflow,
    title: 'Workflow Automation',
    description: 'Drag-and-drop builder to create multi-step recruitment automations — send emails, SMS, and webhooks triggered by candidate events.',
    color: 'bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400',
  },
  {
    icon: Target,
    title: 'AI-Powered Matching',
    description: 'Skill-weighted scoring algorithm matches candidates to jobs, highlighting required, operational, and hygiene skill alignment.',
    color: 'bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400',
  },
  {
    icon: Activity,
    title: 'Real-Time Timeline',
    description: 'Live workflow run logs streamed via SSE — watch automation steps execute in real time for every application.',
    color: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400',
  },
];

function ProgressDots({ total, current }) {
  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`block rounded-full transition-all duration-300 ${
            i === current ? 'w-6 h-2 bg-brand-600' : 'w-2 h-2 bg-stone-300 dark:bg-stone-600'
          }`}
        />
      ))}
    </div>
  );
}

export default function OnboardingModal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const TOTAL = 4;

  useEffect(() => {
    if (user && !localStorage.getItem(STORAGE_KEY)) {
      setOpen(true);
    }
  }, [user]);

  function complete() {
    localStorage.setItem(STORAGE_KEY, 'true');
    setOpen(false);
  }

  function handleNavigate(path) {
    complete();
    navigate(path);
  }

  if (!user) return null;

  const isAdminOrRecruiter = user.role === 'Admin' || user.role === 'Recruiter';

  const steps = [
    // Step 0 — Welcome
    <div key="welcome" className="text-center py-2">
      <div className="w-20 h-20 rounded-2xl bg-brand-600 flex items-center justify-center mx-auto mb-6 shadow-lg">
        <span className="text-4xl font-bold text-white">T</span>
      </div>
      <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-3">Welcome to TalentBay</h2>
      <p className="text-stone-500 dark:text-stone-400 text-base leading-relaxed max-w-sm mx-auto">
        Your AI-powered recruitment command centre. Let's take a quick look at what you can do.
      </p>
      <div className="mt-6 flex flex-col gap-2 text-left max-w-xs mx-auto">
        {[
          { icon: Zap, text: 'Automate candidate screening' },
          { icon: Target, text: 'AI-powered skill matching' },
          { icon: Activity, text: 'Real-time workflow visibility' },
        ].map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-3 text-sm text-stone-600 dark:text-stone-400">
            <Icon className="w-4 h-4 text-brand-600 dark:text-brand-400 flex-shrink-0" />
            {text}
          </div>
        ))}
      </div>
    </div>,

    // Step 1 — Features
    <div key="features" className="py-2">
      <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-1 text-center">Key Features</h2>
      <p className="text-sm text-stone-500 dark:text-stone-400 text-center mb-5">Everything you need to modernise recruitment</p>
      <div className="space-y-3">
        {features.map(({ icon: Icon, title, description, color }) => (
          <div key={title} className="flex gap-4 p-4 rounded-xl border border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/60">
            <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-800 dark:text-stone-200 mb-0.5">{title}</p>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">{description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>,

    // Step 2 — Quick Start
    <div key="quickstart" className="py-2">
      <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-1 text-center">Quick Start</h2>
      <p className="text-sm text-stone-500 dark:text-stone-400 text-center mb-5">
        {isAdminOrRecruiter ? 'Jump into your first task' : 'Here\'s where to start'}
      </p>
      <div className="space-y-3">
        {isAdminOrRecruiter ? (
          <>
            <button
              onClick={() => handleNavigate('/jobs')}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-brand-300 dark:hover:border-brand-700 hover:bg-brand-50 dark:hover:bg-brand-950/60 transition-colors text-left group"
            >
              <div className="w-10 h-10 rounded-lg bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center text-brand-600 dark:text-brand-400 flex-shrink-0">
                <Briefcase className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">Post a Job Opening</p>
                <p className="text-xs text-stone-500 dark:text-stone-400">Add your first role to start receiving applications</p>
              </div>
              <ArrowRight className="w-4 h-4 text-stone-400 dark:text-stone-500 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors" />
            </button>
            <button
              onClick={() => handleNavigate('/candidates')}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-brand-300 dark:hover:border-brand-700 hover:bg-brand-50 dark:hover:bg-brand-950/60 transition-colors text-left group"
            >
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-green-600 dark:text-green-400 flex-shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">Add Candidates</p>
                <p className="text-xs text-stone-500 dark:text-stone-400">Import candidate profiles with resume parsing</p>
              </div>
              <ArrowRight className="w-4 h-4 text-stone-400 dark:text-stone-500 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors" />
            </button>
            <button
              onClick={() => handleNavigate('/workflows')}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-brand-300 dark:hover:border-brand-700 hover:bg-brand-50 dark:hover:bg-brand-950/60 transition-colors text-left group"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-purple-600 dark:text-purple-400 flex-shrink-0">
                <Workflow className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">Build a Workflow</p>
                <p className="text-xs text-stone-500 dark:text-stone-400">Automate your screening process with triggers and steps</p>
              </div>
              <ArrowRight className="w-4 h-4 text-stone-400 dark:text-stone-500 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors" />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => handleNavigate('/jobs')}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-brand-300 dark:hover:border-brand-700 hover:bg-brand-50 dark:hover:bg-brand-950/60 transition-colors text-left group"
            >
              <div className="w-10 h-10 rounded-lg bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center text-brand-600 dark:text-brand-400 flex-shrink-0">
                <Briefcase className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">Browse Job Openings</p>
                <p className="text-xs text-stone-500 dark:text-stone-400">View all current positions and their requirements</p>
              </div>
              <ArrowRight className="w-4 h-4 text-stone-400 dark:text-stone-500 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors" />
            </button>
            <button
              onClick={() => handleNavigate('/matches')}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-brand-300 dark:hover:border-brand-700 hover:bg-brand-50 dark:hover:bg-brand-950/60 transition-colors text-left group"
            >
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-green-600 dark:text-green-400 flex-shrink-0">
                <Target className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">View Candidate Matches</p>
                <p className="text-xs text-stone-500 dark:text-stone-400">See how candidates score against job requirements</p>
              </div>
              <ArrowRight className="w-4 h-4 text-stone-400 dark:text-stone-500 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors" />
            </button>
          </>
        )}
      </div>
    </div>,

    // Step 3 — Done
    <div key="done" className="text-center py-4">
      <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center mx-auto mb-5">
        <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
      </div>
      <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-2">You're all set!</h2>
      <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed max-w-xs mx-auto mb-6">
        TalentBay is ready to transform your recruitment workflow. Head to the dashboard to get started.
      </p>
      <Button variant="primary" size="lg" onClick={complete} rightIcon={<ArrowRight className="w-4 h-4" />}>
        Go to Dashboard
      </Button>
    </div>,
  ];

  return (
    <Modal open={open} onClose={complete} title="" size="md" className="!rounded-2xl">
      <div className="min-h-[320px] flex flex-col">
        <div className="flex-1">
          {steps[step]}
        </div>
        <ProgressDots total={TOTAL} current={step} />
        <div className="flex items-center justify-between mt-5 pt-4 border-t border-stone-100 dark:border-stone-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={complete}
          >
            Skip tour
          </Button>
          <div className="flex gap-2">
            {step > 0 && step < TOTAL - 1 && (
              <Button variant="outline" size="sm" onClick={() => setStep(s => s - 1)}>
                Back
              </Button>
            )}
            {step < TOTAL - 1 && (
              <Button variant="primary" size="sm" onClick={() => setStep(s => s + 1)} rightIcon={<ArrowRight className="w-3 h-3" />}>
                Next
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
