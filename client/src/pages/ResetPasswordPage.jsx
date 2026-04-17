import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import PageContainer from '../components/layout/PageContainer';
import { useToast } from '../context/ToastContext';
import { fetchResetQuestion, verifyResetPassword } from '../services/api';
import { parseApiError } from '../utils/helpers';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLoadQuestion(event) {
    event.preventDefault();
    if (!username.trim()) {
      showToast('Enter your username first.', 'error');
      return;
    }

    setLoading(true);
    try {
      const data = await fetchResetQuestion(username);
      setSecurityQuestion(data.securityQuestion);
      setStep(2);
    } catch (error) {
      showToast(parseApiError(error, 'Username not found.'), 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(event) {
    event.preventDefault();

    if (!securityAnswer.trim()) {
      showToast('Please provide the security answer.', 'error');
      return;
    }

    if (newPassword.length < 8) {
      showToast('New password must be at least 8 characters.', 'error');
      return;
    }

    setLoading(true);
    try {
      await verifyResetPassword({ username, securityAnswer, newPassword });
      showToast('Password updated successfully.', 'success');
      navigate('/login');
    } catch (error) {
      showToast(parseApiError(error, 'Unable to reset password.'), 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageContainer>
      <Card>
        <h1>Reset password</h1>
        {step === 1 ? (
          <form className="form" onSubmit={handleLoadQuestion}>
            <Input
              id="username"
              label="Username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
            />
            <Button type="submit" loading={loading}>
              Continue
            </Button>
          </form>
        ) : (
          <form className="form" onSubmit={handleResetPassword}>
            <p className="security-question">{securityQuestion}</p>
            <Input
              id="securityAnswer"
              label="Security Answer"
              value={securityAnswer}
              onChange={(event) => setSecurityAnswer(event.target.value)}
            />
            <Input
              id="newPassword"
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
            />
            <Button type="submit" loading={loading}>
              Update password
            </Button>
          </form>
        )}
        <div className="auth-links">
          <Link to="/login">Back to login</Link>
        </div>
      </Card>
    </PageContainer>
  );
}
