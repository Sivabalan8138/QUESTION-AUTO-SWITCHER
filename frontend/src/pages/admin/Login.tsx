import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Zap } from 'lucide-react';

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      
      if (res.ok) {
        login(data.token);
        navigate('/admin/auction');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cyber-dark text-white flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 p-8 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden">
        
        {/* Glow effect */}
        <div className="absolute top-[-50px] right-[-50px] w-32 h-32 bg-cyber-cyan opacity-20 blur-[50px]" />
        
        <div className="flex flex-col items-center mb-8">
          <Zap className="w-12 h-12 text-cyber-cyan mb-2" />
          <h1 className="text-2xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyber-cyan to-blue-500">
            ADMIN SECURE LOGIN
          </h1>
          <p className="text-sm text-gray-500 uppercase tracking-widest mt-2">Electrobid System Control</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-6 relative z-10">
          <div>
            <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider block mb-2">Master Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl p-4 text-white focus:outline-none focus:border-cyber-cyan transition-colors"
              placeholder="Enter Access Key..."
              required
            />
          </div>

          {error && (
            <div className="bg-cyber-rose/10 border border-cyber-rose text-cyber-rose p-3 rounded-lg flex items-center gap-2 text-sm">
              <ShieldAlert className="w-4 h-4" /> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyber-cyan hover:bg-cyan-400 text-black font-bold py-4 rounded-xl transition-colors disabled:opacity-50 mt-2 tracking-widest uppercase"
          >
            {loading ? 'Authenticating...' : 'Initialize Session'}
          </button>
        </form>
      </div>
    </div>
  );
}
