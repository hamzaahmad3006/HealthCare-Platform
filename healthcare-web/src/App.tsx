import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { store } from './redux/store';
import { router } from './pages/Routes';
import { COLOR } from './constant/colors';

const WHITE = '#FFFFFF';

export function App(): JSX.Element {
  return (
    <Provider store={store}>
      <RouterProvider router={router} />
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: COLOR.ink[900],
            color: WHITE,
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: 500,
            boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.25)',
          },
          success: {
            iconTheme: {
              primary: COLOR.brand[500],
              secondary: WHITE,
            },
          },
          error: {
            iconTheme: {
              primary: COLOR.danger[500],
              secondary: WHITE,
            },
          },
        }}
      />
    </Provider>
  );
}
