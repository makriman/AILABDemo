import { Navigate, Route, Routes } from 'react-router-dom';
import Header from './components/layout/Header';
import NewQuizPage from './pages/NewQuizPage';
import QuizPage from './pages/QuizPage';
import ResultsPage from './pages/ResultsPage';

export default function App() {
  return (
    <div className="app-shell">
      <Header />
      <Routes>
        <Route path="/" element={<NewQuizPage />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
