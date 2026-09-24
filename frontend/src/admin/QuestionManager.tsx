import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import type { Question } from '../types';
import Papa from 'papaparse';
import * as mammoth from 'mammoth';
import { Upload, Plus, Trash2, Edit2, ChevronLeft, Save, X, Download } from 'lucide-react';

export default function QuestionManager() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Question>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchQuestions();
  }, [navigate]);

  const fetchQuestions = async () => {
    setLoading(true);
    const res = await fetch('/api/questions');
    const data = await res.json();
    setQuestions(data);
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.docx')) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        const html = result.value;
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        const rows = doc.querySelectorAll('tr');
        if (rows.length < 2) {
          alert('Invalid Word Document. Please ensure it contains a table with S.NO, Emoj, Time columns.');
          return;
        }

        const parsedQuestions = [];
        for (let i = 1; i < rows.length; i++) {
          const cells = rows[i].querySelectorAll('td, th');
          if (cells.length >= 3) {
            const question = cells[1].textContent?.trim() || '';
            const timeStr = cells[2].textContent?.trim() || '';
            const timeLimit = parseInt(timeStr.replace(/[^0-9]/g, ''), 10) || 20;
            
            if (question) {
              parsedQuestions.push({
                question,
                option_a: '',
                option_b: '',
                option_c: '',
                option_d: '',
                time_limit: timeLimit,
                question_order: questions.length + parsedQuestions.length + 1
              });
            }
          }
        }

        if (parsedQuestions.length === 0) {
          alert('No valid questions found in the Word document.');
          return;
        }

        for (const q of parsedQuestions) {
          await fetch('/api/questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(q)
          });
        }
        
        fetchQuestions();
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (error) {
        console.error("Error parsing Word document:", error);
        alert("Error parsing Word document. Please make sure it's a valid .docx file.");
      }
    } else {
      Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const parsedQuestions = results.data.map((row: any, index: number) => ({
          question: row['Question'],
          option_a: row['Option A'] || '',
          option_b: row['Option B'] || '',
          option_c: row['Option C'] || '',
          option_d: row['Option D'] || '',
          time_limit: parseInt(row['Time'] || '10', 10),
          image_url: row['Image URL'] || '',
          question_order: questions.length + index + 1
        }));

        // Validate basic format
        if (parsedQuestions.some(q => !q.question)) {
          alert('Invalid CSV format. Please ensure all rows have a Question.');
          return;
        }

        for (const q of parsedQuestions) {
          await fetch('/api/questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(q)
          });
        }
        
        fetchQuestions();
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    });
    }
  };

  const deleteQuestion = async (id: number) => {
    if (!window.confirm('Delete this question?')) return;
    await fetch(`/api/questions/${id}`, { method: 'DELETE' });
    fetchQuestions();
  };

  const deleteAllQuestions = async () => {
    if (!window.confirm('Are you absolutely sure you want to delete ALL questions? This cannot be undone.')) return;
    if (!window.confirm('Please confirm again: Delete ALL questions?')) return;
    await fetch('/api/questions', { method: 'DELETE' });
    fetchQuestions();
  };

  const startEdit = (q: Question) => {
    setEditingId(q.id);
    setEditForm(q);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await fetch(`/api/questions/${editingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm)
    });
    setEditingId(null);
    fetchQuestions();
  };

  const addNew = async () => {
    const newQ = {
      question: 'New Question',
      option_a: 'Option A',
      option_b: 'Option B',
      option_c: 'Option C',
      option_d: 'Option D',
      time_limit: 10,
      image_url: '',
      question_order: questions.length + 1
    };
    const res = await fetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newQ)
    });
    const data = await res.json();
    await fetchQuestions();
    
    // Start editing the new question instantly
    setEditingId(data.id);
    setEditForm({ ...newQ, id: data.id });
    
    // Scroll to the bottom to see it
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setEditForm({ ...editForm, image_url: data.url });
      } else {
        alert('Upload failed: ' + data.message);
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    }
  };



  if (loading) return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-300 flex flex-col">
      <nav className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link to="/admin" className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5 text-sky-400" />
          </Link>
          <h1 className="text-xl font-bold tracking-wide text-white">Question Management</h1>
        </div>
        <div className="flex items-center gap-4">
          <input 
            type="file" 
            accept=".csv,.docx" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Upload className="w-4 h-4" />
            Import CSV / Word
          </button>
          <a 
            href="/excel_template.csv"
            download="excel_template.csv"
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Excel Template
          </a>
          <a 
            href="/word_template.docx"
            download="word_template.docx"
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Word Template
          </a>
          <button 
            onClick={addNew}
            className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-sky-900/30"
          >
            <Plus className="w-4 h-4" />
            Add Question
          </button>
          {questions.length > 0 && (
            <button 
              onClick={deleteAllQuestions}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-red-900/30 ml-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete All
            </button>
          )}
        </div>
      </nav>

      <div className="flex-1 p-6 max-w-6xl mx-auto w-full">
        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/50 text-slate-400 text-sm uppercase tracking-wider">
                  <th className="p-4 font-semibold w-16">#</th>
                  <th className="p-4 font-semibold">Question Details</th>
                  <th className="p-4 font-semibold w-24">Time</th>
                  <th className="p-4 font-semibold w-32">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {questions.map((q, idx) => (
                  <tr key={q.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="p-4 text-slate-500 font-medium">{idx + 1}</td>
                    <td className="p-4">
                      {editingId === q.id ? (
                        <div className="space-y-3">
                          <input 
                            value={editForm.question || ''} 
                            onChange={e => setEditForm({...editForm, question: e.target.value})}
                            className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-lg font-medium"
                          />
                          <div className="flex items-center gap-4">
                            {editForm.image_url && (
                              <img src={editForm.image_url} alt="Question" className="h-16 w-16 object-cover rounded" />
                            )}
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-slate-700 file:text-white hover:file:bg-slate-600" />
                            {editForm.image_url && (
                              <button onClick={() => setEditForm({ ...editForm, image_url: '' })} className="text-red-400 hover:text-red-300 text-sm">Remove Image</button>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <input value={editForm.option_a || ''} onChange={e => setEditForm({...editForm, option_a: e.target.value})} className="bg-slate-900 border border-slate-600 rounded p-2 text-sm" placeholder="Option A" />
                            <input value={editForm.option_b || ''} onChange={e => setEditForm({...editForm, option_b: e.target.value})} className="bg-slate-900 border border-slate-600 rounded p-2 text-sm" placeholder="Option B" />
                            <input value={editForm.option_c || ''} onChange={e => setEditForm({...editForm, option_c: e.target.value})} className="bg-slate-900 border border-slate-600 rounded p-2 text-sm" placeholder="Option C" />
                            <input value={editForm.option_d || ''} onChange={e => setEditForm({...editForm, option_d: e.target.value})} className="bg-slate-900 border border-slate-600 rounded p-2 text-sm" placeholder="Option D" />
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-4">
                          {q.image_url && (
                            <img src={q.image_url} alt="Question" className="h-20 w-20 object-cover rounded shadow" />
                          )}
                          <div className="flex-1">
                            <div className="text-white text-lg font-medium mb-2">{q.question}</div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-slate-400">
                              <div><span className="text-slate-500 mr-2">A:</span>{q.option_a}</div>
                              <div><span className="text-slate-500 mr-2">B:</span>{q.option_b}</div>
                              <div><span className="text-slate-500 mr-2">C:</span>{q.option_c}</div>
                              <div><span className="text-slate-500 mr-2">D:</span>{q.option_d}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      {editingId === q.id ? (
                        <input 
                          type="number"
                          value={editForm.time_limit || 10} 
                          onChange={e => setEditForm({...editForm, time_limit: parseInt(e.target.value, 10)})}
                          className="w-16 bg-slate-900 border border-slate-600 rounded p-2 text-center"
                        />
                      ) : (
                        <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-slate-900 text-sky-400 font-medium text-sm">
                          {q.time_limit}s
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      {editingId === q.id ? (
                        <div className="flex gap-2">
                          <button onClick={saveEdit} className="p-2 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/40 rounded transition-colors"><Save className="w-4 h-4" /></button>
                          <button onClick={() => setEditingId(null)} className="p-2 bg-slate-600/20 text-slate-400 hover:bg-slate-600/40 rounded transition-colors"><X className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button onClick={() => startEdit(q)} className="p-2 bg-sky-600/20 text-sky-400 hover:bg-sky-600/40 rounded transition-colors"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => deleteQuestion(q.id)} className="p-2 bg-red-600/20 text-red-400 hover:bg-red-600/40 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                
                {questions.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500">
                      No questions found. Add one or import from CSV.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
