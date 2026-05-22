import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { PageSpinner } from '../../component/common/LoadingSpinner';

const Login = lazy(() => import('./Login/Login').then((m) => ({ default: m.Login })));
const Register = lazy(() => import('./Register/Register').then((m) => ({ default: m.Register })));

export default function Auth(): JSX.Element {
  return (
    <Suspense fallback={<PageSpinner />}>
      <Routes>
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
      </Routes>
    </Suspense>
  );
}
