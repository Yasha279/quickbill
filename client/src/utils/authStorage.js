export const TOKEN_KEY = 'quickbill_token';
export const USER_KEY = 'quickbill_user';
export const EXPIRY_KEY = 'quickbill_token_expiry';

export const clearAuthStorage = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(EXPIRY_KEY);
};

export const getStoredToken = () => localStorage.getItem(TOKEN_KEY);

export const isTokenValid = () => {
  const token = getStoredToken();
  const exp = localStorage.getItem(EXPIRY_KEY);
  if (!token || !exp) return false;
  return Date.now() < new Date(exp).getTime();
};
