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
  return error?.response?.data?.error || fallbackMessage;
}

export function validateUsername(username) {
  return /^[A-Za-z0-9_]{3,30}$/.test(username);
}
