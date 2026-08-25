import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { History, Download, Trash2, CheckCircle2, XCircle, Slash } from 'lucide-react';
import clsx from 'clsx';

export default function HistoryLogs() {
  const { token } = useAuth();
  const [rounds, setRounds] = useState<any[]>([]);

  const fetchHistory = () => {
    fetch('/api/admin/history/rounds', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setRounds(data));
  };

  useEffect(() => {
    fetchHistory();
  }, [token]);

  const handleClearHistory = async () => {
    if (!confirm('WARNING: Are you sure you want to clear ALL auction history, score logs, and bids? This cannot be undone.')) return;
    await fetch('/api/admin/history/clear', {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchHistory();
  };

  const exportCSV = () => {
    // Simple CSV export
    let csv = 'Round ID,Question,Category,Difficulty,Status,Winner,Winning Bid,Result,Created At\n';
    rounds.forEach(r => {
      csv += `"${r.id}","${r.question?.text?.replace(/"/g, '""') || 'Unknown'}","${r.question?.category}","${r.question?.difficulty}","${r.status}","${r.winner?.name || 'None'}","${r.winningBid || 0}","${r.result || 'N/A'}","${new Date(r.createdAt).toLocaleString()}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `electrobid_audit_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-wider flex items-center gap-2">
          <History className="w-6 h-6 text-cyber-cyan" /> Audit History
        </h2>
        <div className="flex gap-3">
          <button onClick={exportCSV} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors border border-gray-700">
            <Download className="w-5 h-5" /> Export CSV
          </button>
          <button onClick={handleClearHistory} className="bg-cyber-rose/20 hover:bg-cyber-rose text-cyber-rose hover:text-black border border-cyber-rose/50 hover:border-cyber-rose px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors">
            <Trash2 className="w-5 h-5" /> Clear All
          </button>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
        <h3 className="font-bold tracking-wider text-gray-300 border-b border-gray-800 pb-2">Completed Auction Rounds Log</h3>
        
        <div className="flex flex-col gap-3">
          {rounds.length === 0 ? (
            <div className="text-gray-500 italic py-8 text-center">No history logs found.</div>
          ) : rounds.map((r, i) => (
            <div key={r.id} className="bg-gray-950 border border-gray-800 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
              
              <div className="flex items-center gap-4 flex-1 w-full">
                <div className="bg-gray-900 rounded-full w-10 h-10 flex items-center justify-center font-bold text-cyber-cyan shrink-0">
                  {rounds.length - i}
                </div>
                <div>
                  <p className="font-semibold text-white">{r.question?.text || 'Deleted Question'}</p>
                  <p className="text-xs text-gray-500 mt-1 flex gap-2">
                    <span>{new Date(r.createdAt).toLocaleString()}</span>
                    <span>•</span>
                    <span className="uppercase text-cyber-amber">{r.question?.difficulty || 'UNKNOWN'}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6 shrink-0 border-l border-gray-800 pl-6 h-full">
                <div className="flex flex-col items-end w-32">
                  <span className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Winner</span>
                  <span className="font-bold text-cyber-cyan truncate max-w-full">{r.winner?.name || 'None'}</span>
                </div>
                <div className="flex flex-col items-end w-24">
                  <span className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Bid</span>
                  <span className="font-bold text-cyber-amber">{r.winningBid || 0} PTS</span>
                </div>
                <div className="w-10 flex justify-center">
                  {r.result === 'CORRECT' ? <CheckCircle2 className="w-8 h-8 text-cyber-emerald" /> :
                   r.result === 'WRONG' ? <XCircle className="w-8 h-8 text-cyber-rose" /> :
                   <Slash className="w-8 h-8 text-gray-600" />}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
