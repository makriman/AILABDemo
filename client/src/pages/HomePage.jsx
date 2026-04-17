import { Link, Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import PageContainer from '../components/layout/PageContainer';
import Button from '../components/common/Button';

export default function HomePage() {
  const { isAuthenticated, loading } = useAuth();

  if (!loading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <PageContainer>
      <section className="hero">
        <h1>Job Description Quiz App</h1>
        <p>
          Paste a job description, generate a five-question quiz, and practice active reading before interviews.
        </p>
        <div className="hero-actions">
          <Link to="/signup">
            <Button>Create account</Button>
          </Link>
          <Link to="/login">
            <Button variant="secondary">Log in</Button>
          </Link>
        </div>
      </section>
    </PageContainer>
  );
}
