import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Plus, Trash2, Edit2, Database, Save, X, Upload } from 'lucide-react';
import clsx from 'clsx';

export default function QuestionManager() {
  const { token } = useAuth();
  const [questions, setQuestions] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({ id: '', text: '', category: '', difficulty: 'EASY', basePoints: 100, answer: '' });

  const fetchQuestions = () => {
    fetch('/api/admin/questions', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setQuestions(data));
  };

  useEffect(() => {
    fetchQuestions();
  }, [token]);

  const handleSave = async () => {
    const url = formData.id ? `/api/admin/questions/${formData.id}` : '/api/admin/questions';
    const method = formData.id ? 'PUT' : 'POST';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(formData)
    });
    setIsAdding(false);
    fetchQuestions();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    await fetch(`/api/admin/questions/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchQuestions();
  };

  const handleBulkUpload = async () => {
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    
    await fetch('/api/admin/questions/upload', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: fd
    });
    
    setFile(null);
    setUploading(false);
    fetchQuestions();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-wider flex items-center gap-2">
          <Database className="w-6 h-6 text-cyber-cyan" /> Question Bank
        </h2>
        <div className="flex gap-3">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-1 px-3 flex items-center gap-2">
            <input type="file" accept=".xlsx" onChange={e => setFile(e.target.files?.[0] || null)} className="text-sm w-48 text-gray-400 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-gray-800 file:text-white" />
            <button onClick={handleBulkUpload} disabled={!file || uploading} className="bg-cyber-emerald hover:bg-emerald-400 text-black px-3 py-1 rounded font-bold disabled:opacity-50 text-sm flex items-center gap-1">
              <Upload className="w-4 h-4" /> {uploading ? 'Wait' : 'Upload'}
            </button>
          </div>
          <button 
            onClick={() => { setIsAdding(true); setFormData({ id: '', text: '', category: '', difficulty: 'EASY', basePoints: 100, answer: '' }); }}
            className="bg-cyber-cyan hover:bg-cyan-400 text-black px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" /> Add Question
          </button>
        </div>
      </div>

      {isAdding && (
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl flex flex-col gap-4 shadow-xl">
          <h3 className="font-bold tracking-wider">{formData.id ? 'Edit Question' : 'New Question'}</h3>
          <div className="grid grid-cols-1 gap-4">
            <textarea placeholder="Question Text" value={formData.text} onChange={e => setFormData({...formData, text: e.target.value})} className="bg-gray-950 border border-gray-800 rounded-lg p-3 w-full h-24" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input type="text" placeholder="Category" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="bg-gray-950 border border-gray-800 rounded-lg p-3" />
              <select value={formData.difficulty} onChange={e => setFormData({...formData, difficulty: e.target.value})} className="bg-gray-950 border border-gray-800 rounded-lg p-3 text-white">
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
                <option value="SUPER_CHALLENGE">Super Challenge</option>
              </select>
              <input type="number" placeholder="Base Points" value={formData.basePoints} onChange={e => setFormData({...formData, basePoints: Number(e.target.value)})} className="bg-gray-950 border border-gray-800 rounded-lg p-3" />
              <input type="text" placeholder="Answer (Optional)" value={formData.answer} onChange={e => setFormData({...formData, answer: e.target.value})} className="bg-gray-950 border border-gray-800 rounded-lg p-3" />
            </div>
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
              <th className="p-4 font-semibold w-1/2">Question</th>
              <th className="p-4 font-semibold">Tags</th>
              <th className="p-4 font-semibold text-right">Base PTS</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {questions.map((q) => (
              <tr key={q.id} className="hover:bg-gray-800/30 transition-colors">
                <td className="p-4">
                  <p className="font-semibold text-white">{q.text}</p>
                  {q.answer && <p className="text-xs text-cyber-emerald mt-1">Answer: {q.answer}</p>}
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-gray-800 rounded text-gray-400">{q.category}</span>
                    <span className={clsx(
                      "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border",
                      q.difficulty === 'EASY' ? 'border-cyber-emerald text-cyber-emerald' :
                      q.difficulty === 'MEDIUM' ? 'border-cyber-amber text-cyber-amber' :
                      q.difficulty === 'HARD' ? 'border-cyber-rose text-cyber-rose' : 'border-fuchsia-500 text-fuchsia-500'
                    )}>{q.difficulty}</span>
                  </div>
                </td>
                <td className="p-4 text-right font-bold text-cyber-cyan">{q.basePoints}</td>
                <td className="p-4">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => { setFormData(q); setIsAdding(true); }} className="p-2 bg-gray-800 hover:bg-cyber-cyan hover:text-black text-gray-400 rounded transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(q.id)} className="p-2 bg-gray-800 hover:bg-cyber-rose hover:text-black text-gray-400 rounded transition-colors">
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
