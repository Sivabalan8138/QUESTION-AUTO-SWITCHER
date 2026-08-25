import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Plus, Trash2, Edit2, Users, Save, X } from 'lucide-react';
import clsx from 'clsx';

export default function TeamManager() {
  const { token } = useAuth();
  const [teams, setTeams] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ id: '', name: '', registrationNo: '', college: '', points: 0, active: true });

  const fetchTeams = () => {
    fetch('/api/admin/teams', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setTeams(data));
  };

  useEffect(() => {
    fetchTeams();
  }, [token]);

  const handleSave = async () => {
    const url = formData.id ? `/api/admin/teams/${formData.id}` : '/api/admin/teams';
    const method = formData.id ? 'PUT' : 'POST';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(formData)
    });
    setIsAdding(false);
    fetchTeams();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this team?')) return;
    await fetch(`/api/admin/teams/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchTeams();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-wider flex items-center gap-2">
          <Users className="w-6 h-6 text-cyber-cyan" /> Team Management
        </h2>
        <button 
          onClick={() => { setIsAdding(true); setFormData({ id: '', name: '', registrationNo: '', college: '', points: 0, active: true }); }}
          className="bg-cyber-cyan hover:bg-cyan-400 text-black px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" /> Add Team
        </button>
      </div>

      {isAdding && (
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl flex flex-col gap-4 shadow-xl">
          <h3 className="font-bold tracking-wider">{formData.id ? 'Edit Team' : 'New Team'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Team Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="bg-gray-950 border border-gray-800 rounded-lg p-3" />
            <input type="text" placeholder="Registration No." value={formData.registrationNo} onChange={e => setFormData({...formData, registrationNo: e.target.value})} className="bg-gray-950 border border-gray-800 rounded-lg p-3" />
            <input type="text" placeholder="College Name" value={formData.college} onChange={e => setFormData({...formData, college: e.target.value})} className="bg-gray-950 border border-gray-800 rounded-lg p-3" />
            <input type="number" placeholder="Initial Points" value={formData.points} onChange={e => setFormData({...formData, points: Number(e.target.value)})} className="bg-gray-950 border border-gray-800 rounded-lg p-3" />
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <button onClick={() => setIsAdding(false)} className="px-6 py-2 rounded-lg font-bold text-gray-400 hover:text-white transition-colors flex items-center gap-2">
              <X className="w-5 h-5" /> Cancel
            </button>
            <button onClick={handleSave} className="bg-cyber-emerald hover:bg-emerald-400 text-black px-6 py-2 rounded-lg font-bold transition-colors flex items-center gap-2">
              <Save className="w-5 h-5" /> Save
            </button>
          </div>
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-950 text-gray-400 text-xs uppercase tracking-widest border-b border-gray-800">
              <th className="p-4 font-semibold">Team Details</th>
              <th className="p-4 font-semibold">Reg #</th>
              <th className="p-4 font-semibold text-right">Points</th>
              <th className="p-4 font-semibold text-center">Status</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {teams.map((team) => (
              <tr key={team.id} className={clsx("hover:bg-gray-800/30 transition-colors", !team.active && "opacity-50")}>
                <td className="p-4">
                  <p className="font-bold text-white">{team.name}</p>
                  <p className="text-sm text-gray-500">{team.college}</p>
                </td>
                <td className="p-4 font-mono text-gray-400">{team.registrationNo}</td>
                <td className="p-4 text-right font-bold text-cyber-amber text-lg">{team.points}</td>
                <td className="p-4 text-center">
                  <span className={clsx("px-2 py-1 text-xs rounded font-bold uppercase", team.active ? "bg-cyber-emerald/10 text-cyber-emerald" : "bg-gray-800 text-gray-500")}>
                    {team.active ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => { setFormData(team); setIsAdding(true); }} className="p-2 bg-gray-800 hover:bg-cyber-cyan hover:text-black text-gray-400 rounded transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(team.id)} className="p-2 bg-gray-800 hover:bg-cyber-rose hover:text-black text-gray-400 rounded transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
