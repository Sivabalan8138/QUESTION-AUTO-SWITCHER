import React, { useEffect, useState } from 'react';
import { Trophy, Users, CheckCircle2, Coins, Medal } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

export default function Leaderboard() {
  const [teams, setTeams] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalTeams: 0, totalSolved: 0, totalPoints: 0 });

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(res => res.json())
      .then(data => {
        setTeams(data);
        const tTeams = data.length;
        const tSolved = data.reduce((acc: number, t: any) => acc + t.correctAnswers, 0);
        const tPoints = data.reduce((acc: number, t: any) => acc + t.points, 0);
        setStats({ totalTeams: tTeams, totalSolved: tSolved, totalPoints: tPoints });
      })
      .catch(err => console.error(err));
  }, []);

  const getPodiumColor = (rank: number) => {
    if (rank === 0) return 'from-yellow-400 to-yellow-600 border-yellow-500 shadow-yellow-500/20'; // Gold
    if (rank === 1) return 'from-gray-300 to-gray-500 border-gray-400 shadow-gray-400/20'; // Silver
    if (rank === 2) return 'from-amber-600 to-amber-800 border-amber-700 shadow-amber-700/20'; // Bronze
    return '';
  };

  const top3 = teams.slice(0, 3);
  const remainingTeams = teams.slice(3);

  return (
    <div className="min-h-screen bg-cyber-dark text-white p-6 font-sans">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        
        {/* Header */}
        <div className="flex flex-col items-center gap-2 text-center pt-8">
          <h1 className="text-4xl md:text-5xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyber-cyan to-blue-500">
            TOURNAMENT LEADERBOARD
          </h1>
          <p className="text-gray-400 uppercase tracking-widest text-sm">Live Standings & Statistics</p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-900/60 border border-gray-800 p-6 rounded-2xl flex items-center gap-4">
            <div className="p-4 bg-cyber-cyan/10 rounded-xl">
              <Users className="w-8 h-8 text-cyber-cyan" />
            </div>
            <div>
              <p className="text-gray-400 text-sm font-semibold uppercase tracking-wider">Registered Teams</p>
              <p className="text-3xl font-bold">{stats.totalTeams}</p>
            </div>
          </div>
          <div className="bg-gray-900/60 border border-gray-800 p-6 rounded-2xl flex items-center gap-4">
            <div className="p-4 bg-cyber-emerald/10 rounded-xl">
              <CheckCircle2 className="w-8 h-8 text-cyber-emerald" />
            </div>
            <div>
              <p className="text-gray-400 text-sm font-semibold uppercase tracking-wider">Questions Solved</p>
              <p className="text-3xl font-bold">{stats.totalSolved}</p>
            </div>
          </div>
          <div className="bg-gray-900/60 border border-gray-800 p-6 rounded-2xl flex items-center gap-4">
            <div className="p-4 bg-cyber-amber/10 rounded-xl">
              <Coins className="w-8 h-8 text-cyber-amber" />
            </div>
            <div>
              <p className="text-gray-400 text-sm font-semibold uppercase tracking-wider">Total Economy</p>
              <p className="text-3xl font-bold">{stats.totalPoints} PTS</p>
            </div>
          </div>
        </div>

        {/* Top 3 Podium */}
        {top3.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10 pb-6 items-end">
            {[top3[1], top3[0], top3[2]].map((team, idx) => {
              if (!team) return <div key={idx} className="hidden md:block"></div>;
              const actualRank = team.id === top3[0]?.id ? 0 : team.id === top3[1]?.id ? 1 : 2;
              
              return (
                <motion.div
                  key={team.id}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: actualRank * 0.1 }}
                  className={clsx(
                    "flex flex-col items-center bg-gradient-to-b border p-6 rounded-3xl shadow-2xl relative",
                    getPodiumColor(actualRank),
                    actualRank === 0 ? "md:min-h-[320px] z-10" : "md:min-h-[260px] opacity-90 scale-95"
                  )}
                >
                  <div className="absolute -top-8 bg-gray-950 rounded-full p-2 border-2 shadow-xl" style={{ borderColor: 'inherit' }}>
                    <Medal className="w-10 h-10" style={{ color: actualRank === 0 ? '#fbbf24' : actualRank === 1 ? '#9ca3af' : '#b45309' }} />
                  </div>
                  <div className="mt-6 text-center w-full">
                    <h2 className="text-2xl font-bold truncate px-2">{team.name}</h2>
                    <p className="text-sm opacity-80 mt-1">{team.college}</p>
                  </div>
                  <div className="mt-auto pt-6 text-center">
                    <p className="text-4xl font-black">{team.points}</p>
                    <p className="text-sm font-bold uppercase tracking-wider opacity-80">Points</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Full Standings Table */}
        {remainingTeams.length > 0 && (
          <div className="bg-gray-900/80 border border-gray-800 rounded-2xl overflow-hidden mt-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-950/80 text-gray-400 text-xs uppercase tracking-widest">
                    <th className="p-4 font-semibold">Rank</th>
                    <th className="p-4 font-semibold">Team Name</th>
                    <th className="p-4 font-semibold">Registration #</th>
                    <th className="p-4 font-semibold">College</th>
                    <th className="p-4 font-semibold text-center text-cyber-emerald">Correct</th>
                    <th className="p-4 font-semibold text-center text-cyber-rose">Wrong</th>
                    <th className="p-4 font-semibold text-right text-cyber-cyan">Balance (PTS)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50 text-sm">
                  {remainingTeams.map((team, index) => (
                    <tr key={team.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="p-4 font-bold text-gray-500">#{index + 4}</td>
                      <td className="p-4 font-semibold text-white">{team.name}</td>
                      <td className="p-4 text-gray-400 font-mono">{team.registrationNo}</td>
                      <td className="p-4 text-gray-400 truncate max-w-[200px]">{team.college}</td>
                      <td className="p-4 text-center font-bold text-cyber-emerald">{team.correctAnswers}</td>
                      <td className="p-4 text-center font-bold text-cyber-rose">{team.wrongAnswers}</td>
                      <td className="p-4 text-right font-bold text-cyber-cyan text-lg">{team.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
