export function parseApiError(error, fallbackMessage) {
  if (error?.code === 'ECONNABORTED') {
    return 'The request took too long. Please try again.';
  }

  if (!error?.response) {
    return 'Unable to connect. Please check your connection and try again.';
  }

  return error?.response?.data?.error || fallbackMessage;
}
