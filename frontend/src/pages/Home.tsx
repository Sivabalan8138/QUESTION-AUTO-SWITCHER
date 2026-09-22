import { Link } from 'react-router-dom';
import { Zap, MonitorPlay, Settings } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="max-w-2xl w-full text-center space-y-8">
        
        {/* Branding */}
        <div className="space-y-4">
          <div className="flex justify-center">
            <Zap className="w-16 h-16 text-sky-400" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-300 tracking-wider">
            V.S.B. ENGINEERING COLLEGE, KARUR
          </h2>
          <h3 className="text-lg md:text-xl font-semibold text-sky-300 tracking-widest">
            DEPARTMENT OF ELECTRICAL AND ELECTRONICS ENGINEERING
          </h3>
          <h4 className="text-md md:text-lg text-slate-400 uppercase tracking-[0.2em]">
            Electrical Club
          </h4>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold text-white mt-8 mb-12 tracking-tight drop-shadow-lg">
          TECHNICAL QUESTION CHALLENGE
        </h1>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-12">
          <Link 
            to="/admin/login" 
            className="group flex items-center gap-3 px-8 py-4 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl transition-all duration-300 w-full sm:w-auto shadow-lg hover:shadow-sky-900/20"
          >
            <Settings className="w-6 h-6 text-slate-400 group-hover:text-white" />
            <span className="text-lg font-semibold text-slate-200 group-hover:text-white">ADMIN PANEL</span>
          </Link>
          
          <Link 
            to="/display" 
            className="group flex items-center gap-3 px-8 py-4 bg-sky-600 hover:bg-sky-500 rounded-xl transition-all duration-300 w-full sm:w-auto shadow-lg shadow-sky-600/30 hover:shadow-sky-500/50"
          >
            <MonitorPlay className="w-6 h-6 text-white" />
            <span className="text-lg font-bold text-white">DISPLAY MODE</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
