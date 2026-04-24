import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

export async function generateQuiz(jobDescription) {
  const { data } = await api.post('/quiz/generate', { jobDescription }, { timeout: 70000 });
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
