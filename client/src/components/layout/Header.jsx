import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Button from '../common/Button';

export default function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <Link to="/dashboard" className="brand">
          JD Quiz
        </Link>
        <nav className="nav-links" aria-label="Main navigation">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/quiz/new">New Quiz</Link>
          <Link to="/history">History</Link>
        </nav>
        <div className="header-user">
          <span className="field-caption">@{user?.username}</span>
          <Button
            variant="secondary"
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
