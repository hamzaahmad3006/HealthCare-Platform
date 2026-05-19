import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { authRoutes } from './Auth/index';
import { frontendRoutes } from './Frontend/index';
import { dashboardRoutes } from './Dashboard/index';
import { NotFound } from './NotFound/NotFound';

const notFoundRoute: RouteObject = { path: '*', element: <NotFound /> };

export const router = createBrowserRouter([
  ...authRoutes,
  ...frontendRoutes,
  ...dashboardRoutes,
  notFoundRoute,
]);
