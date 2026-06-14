import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AlertCircle, Zap, Target, Activity, ArrowRight } from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const features = [
  { icon: Zap,      text: 'Automate candidate screening workflows' },
  { icon: Target,   text: 'AI-powered skill-based matching' },
  { icon: Activity, text: 'Real-time pipeline visibility' },
];

const Login = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (isRegistering && !formData.name.trim()) e.name = 'Name is required';
    if (!formData.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = 'Invalid email format';
    if (!formData.password) e.password = 'Password is required';
    else if (formData.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (isRegistering && formData.password !== formData.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      const result = isRegistering
        ? await register(formData.name, formData.email, formData.password)
        : await login(formData.email, formData.password);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setErrors({ form: result.error || 'Authentication failed' });
      }
    } catch (err) {
      setErrors({ form: err.message || 'An error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const switchMode = () => {
    setIsRegistering(v => !v);
    setErrors({});
    setFormData({ name: '', email: '', password: '', confirmPassword: '' });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-5/12 relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 flex-col justify-between p-12 text-white">
        {/* Soft layered glow for calm depth */}
        <div
          className="absolute inset-0 opacity-60 pointer-events-none"
          style={{ background: 'radial-gradient(900px circle at 15% 0%, rgba(255,255,255,0.10), transparent 45%)' }}
          aria-hidden="true"
        />
        <div className="relative">
          <div className="flex items-center gap-3 mb-14">
            <div className="w-10 h-10 rounded-xl bg-white/15 ring-1 ring-white/20 flex items-center justify-center">
              <span className="text-xl font-bold">T</span>
            </div>
            <span className="text-xl font-semibold tracking-tight">TalentFlow</span>
          </div>

          <h2 className="text-5xl font-semibold leading-[1.05] tracking-tightest mb-5">
            Recruitment,<br />made calm.
          </h2>
          <p className="text-brand-100/90 text-lg leading-relaxed mb-10 max-w-sm">
            The event-driven ATS built for modern recruiting teams who demand speed, automation, and insight.
          </p>

          <div className="space-y-4">
            {features.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 ring-1 ring-white/15 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-brand-100 text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-brand-200/80 text-sm">
          “Built for teams who move fast and hire smart.”
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="font-bold text-stone-900">TalentFlow</span>
          </div>

          <h1 className="text-2xl font-bold text-stone-900 mb-1">
            {isRegistering ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="text-stone-500 text-sm mb-8">
            {isRegistering
              ? 'Start managing your recruitment pipeline today'
              : 'Sign in to access your recruitment dashboard'}
          </p>

          {errors.form && (
            <div className="mb-5 flex items-start gap-3 bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{errors.form}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <Input
                label="Full Name"
                type="text"
                value={formData.name}
                onChange={e => handleChange('name', e.target.value)}
                placeholder="Jane Smith"
                error={errors.name}
                autoComplete="name"
              />
            )}

            <Input
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={e => handleChange('email', e.target.value)}
              placeholder="you@company.com"
              error={errors.email}
              autoComplete="email"
            />

            <Input
              label="Password"
              type="password"
              value={formData.password}
              onChange={e => handleChange('password', e.target.value)}
              placeholder="••••••••"
              error={errors.password}
              autoComplete={isRegistering ? 'new-password' : 'current-password'}
            />

            {isRegistering && (
              <Input
                label="Confirm Password"
                type="password"
                value={formData.confirmPassword}
                onChange={e => handleChange('confirmPassword', e.target.value)}
                placeholder="••••••••"
                error={errors.confirmPassword}
                autoComplete="new-password"
              />
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full mt-2"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {isRegistering ? 'Create Account' : 'Sign In'}
            </Button>
          </form>

          <p className="text-center mt-6 text-sm text-stone-500">
            {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={switchMode}
              className="text-brand-600 hover:text-brand-700 font-medium transition-colors"
            >
              {isRegistering ? 'Sign in' : 'Register'}
            </button>
          </p>

          {!isRegistering && (
            <div className="mt-6 pt-6 border-t border-stone-100 text-center">
              <p className="text-xs text-stone-400">Demo credentials</p>
              <p className="text-xs text-stone-500 mt-1">admin@ats.com / admin123</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
