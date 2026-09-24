import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { Play, Pause, SkipForward, SkipBack, RotateCcw, Power, Settings, List, LayoutDashboard } from 'lucide-react';
import type { AppState, Question } from '../types';

export default function AdminPanel() {
  const navigate = useNavigate();
  const [appState, setAppState] = useState<AppState | null>(null);
  const [timer, setTimer] = useState<number>(0);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    const socket = io();
    socketRef.current = socket;

    socket.on('display:state_update', (state: AppState) => {
      setAppState(state);
      setTimer(state.activity.timer_state);
    });

    socket.on('timer:tick', (timeLeft: number) => {
      setTimer(timeLeft);
    });

    return () => {
      socket.disconnect();
    };
  }, [navigate]);

  const emitCommand = (cmd: string) => {
    if (socketRef.current) {
      if (cmd === 'admin:restart_activity' || cmd === 'admin:finish') {
        if (!window.confirm('Are you sure you want to perform this action?')) {
          return;
        }
      }
      socketRef.current.emit(cmd);
    }
  };

  if (!appState) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading...</div>;
  }

  const { activity, currentQuestion, currentQuestionNumber, totalQuestions } = appState;
  const isRunning = activity.status === 'running';

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Top Nav */}
      <nav className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="text-sky-400 w-6 h-6" />
          <h1 className="text-xl font-bold tracking-wide">Live Control Panel</h1>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/admin/questions" className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors">
            <List className="w-4 h-4" />
            Manage Questions
          </Link>
          <button 
            onClick={() => {
              localStorage.removeItem('adminToken');
              navigate('/admin/login');
            }}
            className="text-slate-400 hover:text-white text-sm"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="flex-1 p-6 flex flex-col md:flex-row gap-6 max-w-7xl mx-auto w-full">
        {/* Left Column: Controls */}
        <div className="w-full md:w-1/3 flex flex-col gap-6">
          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <h2 className="text-lg font-semibold mb-4 text-slate-300">Activity Controls</h2>
            
            <div className="grid grid-cols-2 gap-3 mb-6">
              {!isRunning ? (
                <button 
                  onClick={() => emitCommand('admin:start')}
                  className="col-span-2 flex items-center justify-center gap-2 py-4 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold shadow-lg transition-colors"
                >
                  <Play className="w-5 h-5" />
                  START
                </button>
              ) : (
                <button 
                  onClick={() => emitCommand('admin:pause')}
                  className="col-span-2 flex items-center justify-center gap-2 py-4 bg-amber-600 hover:bg-amber-500 rounded-xl font-bold shadow-lg transition-colors"
                >
                  <Pause className="w-5 h-5" />
                  PAUSE
                </button>
              )}

              <button 
                onClick={() => emitCommand('admin:prev')}
                className="flex items-center justify-center gap-2 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-medium transition-colors"
              >
                <SkipBack className="w-4 h-4" />
                PREV
              </button>

              <button 
                onClick={() => emitCommand('admin:next')}
                className="flex items-center justify-center gap-2 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-medium transition-colors"
              >
                NEXT
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <button 
                onClick={() => emitCommand('admin:restart_question')}
                className="w-full flex items-center justify-center gap-2 py-3 bg-slate-700/50 hover:bg-slate-600 border border-slate-600 rounded-xl font-medium text-slate-300 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Restart Timer
              </button>

              <button 
                onClick={() => emitCommand('admin:restart_activity')}
                className="w-full flex items-center justify-center gap-2 py-3 bg-red-900/30 hover:bg-red-800/50 border border-red-700/50 text-red-400 rounded-xl font-medium transition-colors"
              >
                <Settings className="w-4 h-4" />
                Restart Activity
              </button>

              <button 
                onClick={() => emitCommand('admin:finish')}
                className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 rounded-xl font-medium transition-colors"
              >
                <Power className="w-4 h-4" />
                End Activity
              </button>
            </div>
          </div>
          
          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 flex flex-col items-center">
            <h2 className="text-sm font-bold text-slate-400 tracking-wider mb-2 uppercase">Status</h2>
            <div className="text-3xl font-black text-white tracking-widest uppercase mb-4">
              {activity.status}
            </div>
            
            <h2 className="text-sm font-bold text-slate-400 tracking-wider mb-2 mt-4 uppercase">Live Timer</h2>
            <div className={`text-6xl font-black tabular-nums tracking-tighter ${timer <= 5 && timer > 0 ? 'text-red-500' : 'text-sky-400'}`}>
              {timer.toString().padStart(2, '0')}
            </div>
          </div>
        </div>

        {/* Right Column: Live Preview */}
        <div className="w-full md:w-2/3 bg-slate-950 rounded-2xl border border-slate-700 flex flex-col p-8 relative overflow-hidden shadow-inner">
          <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded shadow animate-pulse tracking-widest">
            LIVE PREVIEW
          </div>
          
          {currentQuestion ? (
            <div className="flex-1 flex flex-col h-full mt-4">
              <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
                <span className="text-xl font-bold text-slate-400 tracking-widest">QUESTION {currentQuestionNumber.toString().padStart(2, '0')}</span>
                <span className="text-slate-500 font-medium">{currentQuestionNumber} / {totalQuestions}</span>
              </div>
              
              <h2 className="text-3xl font-bold text-white mb-8 leading-relaxed">
                {currentQuestion.question}
              </h2>

              {currentQuestion.image_url && (
                <div className="flex justify-center mb-6">
                  <img 
                    src={currentQuestion.image_url} 
                    alt="Question" 
                    className="max-h-48 rounded-xl shadow-xl border-2 border-slate-700 object-contain"
                  />
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 mt-auto">
                {['A', 'B', 'C', 'D'].map((optLabel) => {
                  const key = `option_${optLabel.toLowerCase()}` as keyof Question;
                  const optValue = currentQuestion[key];
                  if (!optValue) return null;
                  return (
                    <div key={optLabel} className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex items-center">
                      <div className="w-8 h-8 rounded bg-slate-800 text-slate-400 flex items-center justify-center font-bold mr-4 text-sm">
                        {optLabel}
                      </div>
                      <div className="text-slate-300 font-medium text-lg">{optValue}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-xl font-medium tracking-wide">
              {activity.status === 'finished' ? 'Activity Completed' : 'No question active'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
