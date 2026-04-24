import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import LoadingSpinner from '../components/common/LoadingSpinner';
import TextArea from '../components/common/TextArea';
import PageContainer from '../components/layout/PageContainer';
import { useQuizSession } from '../context/QuizSessionContext';
import { useToast } from '../context/ToastContext';
import { generateQuiz } from '../services/api';
import { parseApiError } from '../utils/helpers';

const JD_MIN = 50;
const JD_MAX = 15000;

export default function NewQuizPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { startSession } = useQuizSession();
  const [jobDescription, setJobDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function validate() {
    const trimmed = jobDescription.trim();

    if (!trimmed) {
      setError('Please paste a job description before submitting.');
      return false;
    }

    if (trimmed.length < JD_MIN) {
      setError(`Please provide at least ${JD_MIN} characters.`);
      return false;
    }

    if (trimmed.length > JD_MAX) {
      setError(`Please keep the description below ${JD_MAX} characters.`);
      return false;
    }

    setError('');
    return true;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const payload = await generateQuiz(jobDescription);
      startSession(payload);
      showToast('Temporary quiz generated. Complete it before this tab is refreshed.', 'success');
      navigate('/quiz');
    } catch (apiError) {
      showToast(
        parseApiError(apiError, 'Something went wrong generating your quiz. Please try again.'),
        'error'
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <PageContainer>
        <LoadingSpinner message="Generating your temporary quiz..." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Card>
        <h1>Generate a Temporary Quiz</h1>
        <p className="subtle">
          Paste a job description to generate five questions. This session is temporary and is lost on refresh.
        </p>
        <form className="form" onSubmit={handleSubmit}>
          <TextArea
            id="jobDescription"
            label="Job Description"
            value={jobDescription}
            onChange={(event) => {
              setJobDescription(event.target.value);
              if (error) {
                setError('');
              }
            }}
            placeholder="Paste the full job description here..."
            error={error}
            minLength={JD_MIN}
            maxLength={JD_MAX}
          />
          <Button type="submit" disabled={jobDescription.trim().length < JD_MIN}>
            Generate quiz
          </Button>
        </form>
      </Card>
    </PageContainer>
  );
}
