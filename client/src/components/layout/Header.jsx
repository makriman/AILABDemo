import { Link, useNavigate } from 'react-router-dom';
import { useQuizSession } from '../../context/QuizSessionContext';
import Button from '../common/Button';

export default function Header() {
  const navigate = useNavigate();
  const { quiz, attemptToken, result, answers, clearSession } = useQuizSession();

  const hasSession =
    Boolean(quiz) ||
    Boolean(attemptToken) ||
    Boolean(result) ||
    Object.keys(answers || {}).length > 0;

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <Link to="/" className="brand">
          JD Quiz
        </Link>

        {hasSession ? (
          <Button
            variant="secondary"
            onClick={() => {
              clearSession();
              navigate('/');
            }}
          >
            Start over
          </Button>
        ) : null}
      </div>
    </header>
  );
}
