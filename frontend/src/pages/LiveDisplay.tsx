import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { Trophy, Clock, Zap, Target, TrendingUp, AlertCircle, Shield } from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

export default function LiveDisplay() {
  const { socket, timerValue, auctionState, roundData, bids } = useSocket();
  const [activeTeams, setActiveTeams] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [bidAmount, setBidAmount] = useState<number | ''>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch active teams for bidding dropdown
  useEffect(() => {
    fetch('/api/teams/active')
      .then(res => res.json())
      .then(data => {
        setActiveTeams(data);
        if (data.length > 0) setSelectedTeam(data[0].id);
      })
      .catch(err => console.error(err));
  }, []);

  // Handle Confetti
  useEffect(() => {
    if (!socket) return;
    const handleCelebration = (data: { teamId: string, result: string }) => {
      if (data.result === 'CORRECT') {
        const end = Date.now() + 3 * 1000;
        const colors = ['#06b6d4', '#f59e0b', '#10b981'];

        (function frame() {
          confetti({
            particleCount: 5,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: colors
          });
          confetti({
            particleCount: 5,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: colors
          });

          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        }());
      }
    };
    
    socket.on('celebration', handleCelebration);
    return () => {
      socket.off('celebration', handleCelebration);
    };
  }, [socket]);

  // Handle Socket Errors
  useEffect(() => {
    if (!socket) return;
    const handleError = (data: { message: string }) => {
      setErrorMsg(data.message);
      setTimeout(() => setErrorMsg(null), 3000);
    };
    socket.on('bid_error', handleError);
    return () => {
      socket.off('bid_error', handleError);
    };
  }, [socket]);

  const placeBid = (amount: number, type: 'FAST' | 'CUSTOM' = 'CUSTOM') => {
    if (!socket || !selectedTeam || auctionState !== 'BIDDING_OPEN') return;
    socket.emit('place_bid', { teamId: selectedTeam, amount, type });
    setBidAmount('');
  };

  const getDifficultyColor = (diff: string) => {
    switch(diff) {
      case 'EASY': return 'text-cyber-emerald border-cyber-emerald';
      case 'MEDIUM': return 'text-cyber-amber border-cyber-amber';
      case 'HARD': return 'text-cyber-rose border-cyber-rose';
      case 'SUPER_CHALLENGE': return 'text-fuchsia-500 border-fuchsia-500 animate-pulse';
      default: return 'text-cyber-cyan border-cyber-cyan';
    }
  };

  const selectedTeamData = activeTeams.find(t => t.id === selectedTeam);

  return (
    <div className="min-h-screen bg-cyber-dark text-white p-4 md:p-8 font-sans flex flex-col xl:flex-row gap-6 relative overflow-hidden">
      
      {/* Background Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-cyber-cyan opacity-5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyber-rose opacity-5 blur-[120px] rounded-full pointer-events-none" />

      {/* Main Projector Content */}
      <div className="flex-1 flex flex-col gap-6 z-10">
        
        {/* Header & Status */}
        <div className="flex justify-between items-center bg-gray-900/60 backdrop-blur-md border border-gray-800 p-6 rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.1)]">
          <div className="flex items-center gap-4">
            <Zap className="w-10 h-10 text-cyber-cyan" />
            <div>
              <h1 className="text-3xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyber-cyan to-blue-500">ELECTROBID</h1>
              <p className="text-gray-400 text-sm tracking-widest uppercase">The EEE Auction Challenge</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className={clsx(
              "px-6 py-2 rounded-full font-bold tracking-widest text-sm border shadow-lg",
              auctionState === 'IDLE' ? 'bg-gray-800 text-gray-400 border-gray-700' :
              auctionState === 'BIDDING_OPEN' ? 'bg-cyber-emerald/10 text-cyber-emerald border-cyber-emerald/50 animate-pulse' :
              auctionState === 'BIDDING_CLOSED' ? 'bg-cyber-amber/10 text-cyber-amber border-cyber-amber/50' :
              auctionState === 'COMPLETED' ? 'bg-cyber-cyan/10 text-cyber-cyan border-cyber-cyan/50' :
              'bg-gray-800 text-gray-400 border-gray-700'
            )}>
              {auctionState.replace('_', ' ')}
            </div>

            <div className="flex items-center gap-3 bg-gray-950 px-6 py-3 rounded-xl border border-gray-800">
              <Clock className={clsx("w-6 h-6", timerValue <= 10 && timerValue > 0 ? "text-cyber-rose animate-bounce" : "text-cyber-cyan")} />
              <span className={clsx(
                "text-4xl font-mono font-bold w-16 text-center",
                timerValue <= 10 && timerValue > 0 ? "text-cyber-rose" : "text-white"
              )}>
                {timerValue}s
              </span>
            </div>
          </div>
        </div>

        {/* Active Question Banner */}
        <div className="flex-1 flex flex-col justify-center items-center bg-gray-900/60 backdrop-blur-md border border-gray-800 p-8 rounded-2xl relative">
          {!roundData?.question ? (
            <div className="flex flex-col items-center text-gray-500">
              <Target className="w-20 h-20 mb-4 opacity-50" />
              <h2 className="text-2xl font-light">Waiting for Next Question...</h2>
            </div>
          ) : (
            <div className="w-full max-w-4xl flex flex-col items-center text-center gap-6">
              <div className="flex gap-4">
                <span className="px-4 py-1 rounded-full bg-gray-800 border border-gray-700 text-sm font-semibold tracking-wider text-gray-300">
                  {roundData.question.category}
                </span>
                <span className={clsx("px-4 py-1 rounded-full border text-sm font-bold tracking-wider bg-black/50", getDifficultyColor(roundData.question.difficulty))}>
                  {roundData.question.difficulty}
                </span>
                <span className="px-4 py-1 rounded-full bg-cyber-amber/10 border border-cyber-amber/30 text-cyber-amber text-sm font-bold tracking-wider flex items-center gap-2">
                  <Trophy className="w-4 h-4" /> {roundData.question.basePoints} PTS
                </span>
              </div>
              
              <h2 className="text-3xl md:text-5xl font-medium leading-tight mt-4">
                {roundData.question.text}
              </h2>

              {auctionState === 'COMPLETED' && roundData.winner && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={clsx(
                    "mt-8 px-8 py-4 rounded-2xl border-2 flex flex-col items-center gap-2",
                    roundData.result === 'CORRECT' ? 'bg-cyber-emerald/10 border-cyber-emerald text-cyber-emerald' : 'bg-cyber-rose/10 border-cyber-rose text-cyber-rose'
                  )}
                >
                  <span className="font-bold text-xl uppercase">{roundData.winner.name}</span>
                  <span className="text-lg">Bid: {roundData.winningBid} PTS • Result: {roundData.result}</span>
                </motion.div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Bidding Sidebar */}
      <div className="w-full xl:w-[450px] flex flex-col gap-6 z-10 shrink-0">
        
        {/* Candidate Console */}
        <div className="bg-gray-900/80 backdrop-blur-md border border-gray-800 p-6 rounded-2xl flex flex-col gap-6 shadow-xl">
          <h3 className="text-xl font-bold border-b border-gray-800 pb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyber-cyan" /> 
            Candidate Console
          </h3>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-400 font-semibold uppercase tracking-wider">Select Your Team</label>
            <select 
              className="bg-gray-950 border border-gray-800 rounded-lg p-3 text-white focus:outline-none focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan transition-all"
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              disabled={auctionState === 'BIDDING_OPEN'}
            >
              <option value="" disabled>-- Choose Team --</option>
              {activeTeams.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.points} PTS)</option>
              ))}
            </select>
            {selectedTeamData && (
              <div className="text-right text-sm mt-1">
                <span className="text-gray-400">Balance: </span>
                <span className="text-cyber-amber font-bold">{selectedTeamData.points} PTS</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <label className="text-sm text-gray-400 font-semibold uppercase tracking-wider">Fast Bids</label>
            <div className="grid grid-cols-2 gap-3">
              {[100, 200, 300, 500].map(amt => (
                <button
                  key={amt}
                  disabled={auctionState !== 'BIDDING_OPEN' || !selectedTeamData || selectedTeamData.points < amt}
                  onClick={() => placeBid(amt, 'FAST')}
                  className="bg-gray-800 hover:bg-cyber-cyan hover:text-black border border-gray-700 hover:border-cyber-cyan disabled:opacity-30 disabled:hover:bg-gray-800 disabled:hover:text-white disabled:hover:border-gray-700 py-3 rounded-xl font-bold transition-all"
                >
                  +{amt}
                </button>
              ))}
            </div>
            <button
              disabled={auctionState !== 'BIDDING_OPEN' || !selectedTeamData || selectedTeamData.points < 1000}
              onClick={() => placeBid(1000, 'FAST')}
              className="w-full bg-cyber-amber/20 hover:bg-cyber-amber text-cyber-amber hover:text-black border border-cyber-amber/50 hover:border-cyber-amber disabled:opacity-30 disabled:hover:bg-cyber-amber/20 disabled:hover:text-cyber-amber py-3 rounded-xl font-bold uppercase tracking-wider transition-all flex justify-center items-center gap-2"
            >
              <TrendingUp className="w-5 h-5" /> +1000 Super Bid
            </button>
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <label className="text-sm text-gray-400 font-semibold uppercase tracking-wider">Custom Bid</label>
            <div className="flex gap-3">
              <input 
                type="number" 
                value={bidAmount}
                onChange={(e) => setBidAmount(Number(e.target.value))}
                placeholder="0"
                className="flex-1 bg-gray-950 border border-gray-800 rounded-xl p-3 text-white text-lg focus:outline-none focus:border-cyber-emerald"
                disabled={auctionState !== 'BIDDING_OPEN'}
              />
              <button 
                onClick={() => typeof bidAmount === 'number' && placeBid(bidAmount, 'CUSTOM')}
                disabled={auctionState !== 'BIDDING_OPEN' || typeof bidAmount !== 'number' || bidAmount <= 0}
                className="bg-cyber-emerald hover:bg-emerald-400 text-black px-6 font-bold rounded-xl disabled:opacity-30 transition-all"
              >
                SUBMIT
              </button>
            </div>
          </div>

          <AnimatePresence>
            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-cyber-rose/10 border border-cyber-rose text-cyber-rose p-3 rounded-lg flex items-center gap-2 text-sm"
              >
                <AlertCircle className="w-4 h-4" /> {errorMsg}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Live Bidding Stream */}
        <div className="bg-gray-900/80 backdrop-blur-md border border-gray-800 rounded-2xl flex flex-col overflow-hidden flex-1 shadow-xl">
          <div className="p-4 border-b border-gray-800 bg-gray-950/50">
            <h3 className="text-lg font-bold tracking-wider text-gray-300">Live Bids</h3>
          </div>
          <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-3">
            <AnimatePresence initial={false}>
              {bids.length === 0 ? (
                <div className="text-gray-500 text-center text-sm italic mt-4">No bids placed yet.</div>
              ) : (
                bids.map((bid, i) => (
                  <motion.div
                    key={bid.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={clsx(
                      "p-3 rounded-xl border flex justify-between items-center",
                      i === 0 ? "bg-cyber-cyan/10 border-cyber-cyan/50" : "bg-gray-800/50 border-gray-700/50"
                    )}
                  >
                    <div>
                      <div className={clsx("font-bold text-sm", i === 0 ? "text-cyber-cyan" : "text-gray-300")}>
                        {bid.team?.name || 'Unknown Team'}
                      </div>
                      <div className="text-xs text-gray-500">{new Date(bid.timestamp).toLocaleTimeString()}</div>
                    </div>
                    <div className={clsx("font-bold", i === 0 ? "text-cyber-amber text-lg" : "text-gray-400")}>
                      {bid.amount} PTS
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
}
