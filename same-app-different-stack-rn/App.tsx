import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CheckInScreen } from './src/screens/CheckInScreen';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <CheckInScreen />
    </SafeAreaProvider>
  );
}

