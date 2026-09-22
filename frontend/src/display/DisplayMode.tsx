import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { AppState, Question } from '../types';

export default function DisplayMode() {
  const [appState, setAppState] = useState<AppState | null>(null);
  const [timer, setTimer] = useState<number>(0);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
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
  }, []);

  if (!appState) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="animate-pulse text-2xl tracking-widest text-sky-500">CONNECTING...</div>
      </div>
    );
  }

  const { activity, currentQuestion, currentQuestionNumber, totalQuestions } = appState;

  if (activity.status === 'idle') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-center text-white">
        <div className="space-y-6 max-w-4xl opacity-80">
          <h2 className="text-3xl font-bold text-slate-300 tracking-wider">V.S.B. ENGINEERING COLLEGE, KARUR</h2>
          <h3 className="text-2xl font-semibold text-sky-400 tracking-widest">DEPARTMENT OF ELECTRICAL AND ELECTRONICS ENGINEERING</h3>
          <h4 className="text-xl text-slate-400 uppercase tracking-[0.2em]">Electrical Club</h4>
          <div className="h-px w-full bg-gradient-to-r from-transparent via-sky-800 to-transparent my-12" />
          <h1 className="text-6xl font-extrabold text-white tracking-tight">TECHNICAL QUESTION CHALLENGE</h1>
          <p className="text-2xl text-slate-500 mt-8 animate-pulse">Waiting for activity to start...</p>
        </div>
      </div>
    );
  }

  if (activity.status === 'finished') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-center text-white">
        <div className="space-y-8 max-w-4xl">
          <h1 className="text-6xl font-extrabold text-white tracking-tight text-sky-400 mb-12">ACTIVITY COMPLETED</h1>
          <h2 className="text-4xl font-bold text-slate-200">Thank You</h2>
          <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-700 to-transparent my-12" />
          <h4 className="text-2xl text-slate-300 uppercase tracking-[0.1em]">Electrical Club</h4>
          <h3 className="text-2xl font-semibold text-slate-400">Department of Electrical and Electronics Engineering</h3>
          <h2 className="text-2xl font-bold text-slate-500 mt-4">V.S.B. Engineering College, Karur</h2>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="h-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-center text-white">
        <h2 className="text-3xl font-bold text-slate-500 mb-4">NO QUESTION ACTIVE</h2>
        <p className="text-xl text-slate-600">Please start the activity or add questions from the Admin Panel.</p>
      </div>
    );
  }

  const isUrgent = timer <= 5 && timer > 0;

  return (
    <div className="h-screen bg-slate-950 text-white flex flex-col p-4 md:p-8 overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-sky-600 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-800 blur-[120px]"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 flex flex-col items-center justify-center text-center space-y-1 mb-4 md:mb-6 border-b border-slate-800 pb-4">
        <div className="text-xs md:text-sm font-bold text-slate-400 tracking-widest">V.S.B. ENGINEERING COLLEGE, KARUR</div>
        <div className="text-xs md:text-sm font-semibold text-sky-500 tracking-widest">DEPARTMENT OF ELECTRICAL AND ELECTRONICS ENGINEERING | ELECTRICAL CLUB</div>
        <div className="text-lg md:text-xl font-black text-slate-200 tracking-wider mt-1">TECHNICAL QUESTION CHALLENGE</div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col max-w-6xl w-full mx-auto min-h-0">
        <div className="flex justify-between items-end mb-4">
          <div className="text-2xl md:text-3xl font-bold text-sky-400 tracking-widest">
            QUESTION {currentQuestionNumber.toString().padStart(2, '0')}
          </div>
          <div className="text-xl md:text-2xl font-medium text-slate-500">
            {currentQuestionNumber.toString().padStart(2, '0')} / {totalQuestions.toString().padStart(2, '0')}
          </div>
        </div>

        {/* Question Text */}
        <div className="bg-slate-900/80 border border-slate-700/50 backdrop-blur-sm rounded-2xl p-6 md:p-8 mb-6 shadow-2xl flex-shrink-0">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-white drop-shadow-md">
            {currentQuestion.question}
          </h2>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 flex-shrink-0">
          {['A', 'B', 'C', 'D'].map((optLabel) => {
            const optValue = currentQuestion[`option_${optLabel.toLowerCase()}` as keyof Question];
            return (
              <div 
                key={optLabel} 
                className="flex items-center bg-slate-800/80 border border-slate-600/50 rounded-xl p-4 md:p-5 shadow-lg text-xl md:text-2xl"
              >
                <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-lg bg-sky-900/50 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold mr-4 md:mr-6">
                  {optLabel}
                </div>
                <div className="font-medium text-slate-200">{optValue}</div>
              </div>
            );
          })}
        </div>

        {/* Timer */}
        <div className="mt-auto flex justify-center pb-2 md:pb-4 flex-shrink-0">
          <div className={`flex flex-col items-center justify-center ${isUrgent ? 'animate-urgent' : ''}`}>
            <div className={`text-6xl md:text-8xl lg:text-[9rem] font-black leading-none tabular-nums tracking-tighter ${isUrgent ? 'text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]' : 'text-sky-400 drop-shadow-[0_0_20px_rgba(14,165,233,0.3)]'}`}>
              {timer.toString().padStart(2, '0')}
            </div>
            <div className={`text-xl md:text-2xl font-bold tracking-[0.3em] mt-1 ${isUrgent ? 'text-red-400' : 'text-sky-600'}`}>
              SECONDS
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
