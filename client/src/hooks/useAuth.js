import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMe, setInitialized, logout } from '../redux/slices/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);

  useEffect(() => {
    const expiry = localStorage.getItem('quickbill_token_expiry');
    if (expiry && new Date(expiry).getTime() < Date.now()) {
      dispatch(logout());
      dispatch(setInitialized());
      return;
    }
    if (auth.token && !auth.user) {
      dispatch(fetchMe()).finally(() => dispatch(setInitialized()));
    } else {
      dispatch(setInitialized());
    }
  }, [dispatch, auth.token, auth.user]);

  return auth;
};
