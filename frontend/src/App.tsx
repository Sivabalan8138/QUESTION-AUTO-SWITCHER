import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import DisplayMode from './display/DisplayMode';
import AdminPanel from './admin/AdminPanel';
import AdminLogin from './admin/AdminLogin';
import QuestionManager from './admin/QuestionManager';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/display" element={<DisplayMode />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/admin/questions" element={<QuestionManager />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
