import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = () => {
  const { token, initialized } = useSelector((state) => state.auth);

  if (!initialized) return <LoadingSpinner fullScreen />;
  if (!token) return <Navigate to="/login" replace />;

  return <Outlet />;
};

export default ProtectedRoute;


