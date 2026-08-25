import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { Play, Pause, Square, RotateCcw, CheckCircle, XCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import clsx from 'clsx';

export default function AuctionControl() {
  const { socket, timerValue, auctionState, roundData, bids } = useSocket();
  const { token } = useAuth();
  const [questions, setQuestions] = useState<any[]>([]);
  const [timerInput, setTimerInput] = useState<number>(60);
  const [filterDiff, setFilterDiff] = useState<string>('ALL');

  useEffect(() => {
    fetch('/api/admin/questions', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setQuestions(data))
      .catch(err => console.error(err));
  }, [token]);

  const launchAuction = (qId: string) => {
    if (!socket || auctionState === 'BIDDING_OPEN') return;
    socket.emit('admin_start_auction', { questionId: qId });
  };

  const controlTimer = (action: string, seconds?: number) => {
    if (!socket) return;
    socket.emit('admin_timer_control', { action, seconds });
  };

  const evaluateWinner = (winnerId: string, result: 'CORRECT' | 'WRONG') => {
    if (!socket) return;
    socket.emit('admin_evaluate_winner', { winnerId, result });
  };

  const filteredQuestions = filterDiff === 'ALL' ? questions : questions.filter(q => q.difficulty === filterDiff);
  const highestBid = bids.length > 0 ? bids[0] : null;

  return (
    <div className="flex flex-col gap-6">
      
      {/* Current Round Header */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex items-center justify-between shadow-lg">
        <div>
          <h2 className="text-xl font-bold tracking-wider mb-1">Current Auction Status</h2>
          <div className="flex gap-4 items-center">
            <span className={clsx(
              "px-3 py-1 rounded border text-sm font-bold tracking-wider",
              auctionState === 'IDLE' ? 'bg-gray-800 border-gray-700' :
              auctionState === 'BIDDING_OPEN' ? 'bg-cyber-emerald/20 border-cyber-emerald text-cyber-emerald' :
              auctionState === 'BIDDING_CLOSED' ? 'bg-cyber-amber/20 border-cyber-amber text-cyber-amber' :
              'bg-cyber-cyan/20 border-cyber-cyan text-cyber-cyan'
            )}>
              {auctionState.replace('_', ' ')}
            </span>
            {roundData?.question && (
              <span className="text-gray-400">Question ID: <span className="text-white font-mono">{roundData.question.id.substring(0,8)}</span></span>
            )}
          </div>
        </div>
        <div className="text-right flex items-center gap-4">
          <div className="text-5xl font-mono font-bold text-cyber-cyan w-20 text-center">{timerValue}s</div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Left Column: Timer Controls & Evaluation */}
        <div className="flex flex-col gap-6">
          
          {/* Timer Controls */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col gap-6">
            <h3 className="font-bold tracking-wider text-gray-300 border-b border-gray-800 pb-2">Timer Controls</h3>
            <div className="flex gap-4">
              <button onClick={() => controlTimer('start')} className="flex-1 bg-cyber-emerald/10 hover:bg-cyber-emerald border border-cyber-emerald/30 hover:border-cyber-emerald text-cyber-emerald hover:text-black py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2">
                <Play className="w-5 h-5" /> Start / Resume
              </button>
              <button onClick={() => controlTimer('pause')} className="flex-1 bg-cyber-amber/10 hover:bg-cyber-amber border border-cyber-amber/30 hover:border-cyber-amber text-cyber-amber hover:text-black py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2">
                <Pause className="w-5 h-5" /> Pause
              </button>
              <button onClick={() => controlTimer('stop')} className="flex-1 bg-cyber-rose/10 hover:bg-cyber-rose border border-cyber-rose/30 hover:border-cyber-rose text-cyber-rose hover:text-black py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2">
                <Square className="w-5 h-5" /> Stop Bidding
              </button>
            </div>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1 block">Set Timer (s)</label>
                <input type="number" value={timerInput} onChange={e => setTimerInput(Number(e.target.value))} className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white focus:outline-none focus:border-cyber-cyan" />
              </div>
              <button onClick={() => controlTimer('start', timerInput)} className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-bold border border-gray-700 transition-all flex items-center justify-center gap-2">
                <RotateCcw className="w-5 h-5" /> Reset Timer
              </button>
            </div>
          </div>

          {/* Winner Evaluation */}
          <div className={clsx(
            "border rounded-2xl p-6 flex flex-col gap-4 transition-all duration-500",
            auctionState === 'BIDDING_CLOSED' ? 'bg-cyber-cyan/10 border-cyber-cyan shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'bg-gray-900 border-gray-800 opacity-50 pointer-events-none'
          )}>
            <h3 className="font-bold tracking-wider text-white border-b border-gray-800 pb-2">Winner Evaluation Panel</h3>
            
            {!highestBid ? (
              <div className="text-gray-400 text-sm italic">No bids were placed in this round.</div>
            ) : (
              <>
                <div className="bg-gray-950 border border-gray-800 p-4 rounded-xl">
                  <p className="text-gray-400 text-sm mb-1 uppercase tracking-wider">Highest Bidder</p>
                  <p className="text-xl font-bold text-cyber-cyan">{highestBid.team.name}</p>
                  <p className="text-lg">Bid Amount: <span className="font-bold text-cyber-amber">{highestBid.amount} PTS</span></p>
                </div>
                <div className="flex gap-4 mt-2">
                  <button onClick={() => evaluateWinner(highestBid.team.id, 'CORRECT')} className="flex-1 bg-cyber-emerald hover:bg-emerald-400 text-black py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2">
                    <CheckCircle className="w-6 h-6" /> MARK CORRECT
                  </button>
                  <button onClick={() => evaluateWinner(highestBid.team.id, 'WRONG')} className="flex-1 bg-cyber-rose hover:bg-rose-400 text-black py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2">
                    <XCircle className="w-6 h-6" /> MARK WRONG
                  </button>
                </div>
              </>
            )}
          </div>

        </div>

        {/* Right Column: Question Bank */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col gap-4 h-[650px]">
          <div className="flex justify-between items-center border-b border-gray-800 pb-4">
            <h3 className="font-bold tracking-wider text-gray-300">Launch Question</h3>
            <select value={filterDiff} onChange={e => setFilterDiff(e.target.value)} className="bg-gray-950 border border-gray-800 rounded text-sm px-3 py-1">
              <option value="ALL">All Difficulties</option>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
              <option value="SUPER_CHALLENGE">Super Challenge</option>
            </select>
          </div>
          
          <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-2">
            {filteredQuestions.map(q => (
              <div key={q.id} className="bg-gray-950 border border-gray-800 p-4 rounded-xl flex flex-col gap-3 hover:border-gray-600 transition-colors">
                <div className="flex justify-between items-start gap-4">
                  <p className="font-medium text-sm leading-snug flex-1">{q.text}</p>
                  <button 
                    onClick={() => launchAuction(q.id)}
                    disabled={auctionState === 'BIDDING_OPEN'}
                    className="shrink-0 bg-cyber-cyan hover:bg-cyan-400 text-black px-4 py-2 rounded font-bold text-xs disabled:opacity-30 flex items-center gap-1 transition-colors"
                  >
                    LAUNCH <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-gray-800 rounded text-gray-400">{q.category}</span>
                  <span className={clsx(
                    "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border",
                    q.difficulty === 'EASY' ? 'border-cyber-emerald text-cyber-emerald' :
                    q.difficulty === 'MEDIUM' ? 'border-cyber-amber text-cyber-amber' :
                    q.difficulty === 'HARD' ? 'border-cyber-rose text-cyber-rose' : 'border-fuchsia-500 text-fuchsia-500'
                  )}>{q.difficulty}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-cyber-amber/10 text-cyber-amber border border-cyber-amber/30 rounded">{q.basePoints} PTS</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
