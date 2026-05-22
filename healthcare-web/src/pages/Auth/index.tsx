import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { PageSpinner } from '../../component/common/LoadingSpinner';

const Login = lazy(() => import('./Login/Login').then((m) => ({ default: m.Login })));
const Register = lazy(() => import('./Register/Register').then((m) => ({ default: m.Register })));
const ForgotPassword = lazy(() => import('./ForgotPassword/ForgotPassword').then((m) => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import('./ResetPassword/ResetPassword').then((m) => ({ default: m.ResetPassword })));

export default function Auth(): JSX.Element {
  return (
    <Suspense fallback={<PageSpinner />}>
      <Routes>
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />
      </Routes>
    </Suspense>
  );
}
