export function formatDate(iso) {
  if (!iso) {
    return 'Unknown date';
  }

  try {
    return new Date(iso).toLocaleString();
  } catch (error) {
    return iso;
  }
}

export function parseApiError(error, fallbackMessage) {
  if (error?.code === 'ECONNABORTED') {
    return 'The request took too long. Please try again.';
  }

  if (!error?.response) {
    return 'Unable to connect. Please check your connection and try again.';
  }

  return error?.response?.data?.error || fallbackMessage;
}

export function validateUsername(username) {
  return /^[A-Za-z0-9_]{3,30}$/.test(username);
}
