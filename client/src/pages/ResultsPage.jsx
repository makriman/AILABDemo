import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import QuizResultsView from '../components/quiz/QuizResultsView';
import PageContainer from '../components/layout/PageContainer';
import { useQuizSession } from '../context/QuizSessionContext';
import { useToast } from '../context/ToastContext';

const EXPIRED_SESSION_MESSAGE = 'This temporary quiz session has expired. Generate a new one.';

export default function ResultsPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { result, clearSession } = useQuizSession();

  useEffect(() => {
    if (!result) {
      showToast(EXPIRED_SESSION_MESSAGE, 'info');
      navigate('/', { replace: true });
    }
  }, [navigate, result, showToast]);

  if (!result) {
    return null;
  }

  return (
    <PageContainer>
      <QuizResultsView result={result} />
      <Card>
        <h2>Next Step</h2>
        <p className="subtle">This result is temporary and will be lost if you refresh the page.</p>
        <div style={{ marginTop: '12px' }}>
          <Button
            onClick={() => {
              clearSession();
              navigate('/');
            }}
          >
            Generate another quiz
          </Button>
        </div>
      </Card>
    </PageContainer>
  );
}
