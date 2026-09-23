import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

export async function generateQuiz(jobDescription) {
  const headers = {};
  const generationSecret = import.meta.env.VITE_QUIZ_GENERATION_SECRET;

  if (typeof generationSecret === 'string' && generationSecret.trim()) {
    headers['X-Quiz-Generation-Secret'] = generationSecret.trim();
  }

  const { data } = await api.post('/quiz/generate', { jobDescription }, { timeout: 70000, headers });
  return data;
}

export async function submitQuiz(attemptToken, answers) {
  const { data } = await api.post('/quiz/submit', {
    attemptToken,
    answers,
  });
  return data;
}

export default api;
