import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from './src/store';
import { RootNavigator } from './src/navigation/RootNavigator';
import { PushManager } from './src/components/PushManager';

export default function App(): JSX.Element {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <RootNavigator />
        <PushManager />
      </SafeAreaProvider>
    </Provider>
  );
}
