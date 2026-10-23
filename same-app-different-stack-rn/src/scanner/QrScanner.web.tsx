import { Text } from 'react-native';
import { common } from '../ui/theme';
import type { QrScannerProps } from './types';
export function QrScanner(_props: QrScannerProps) {
  return <Text accessibilityRole="alert" style={common.body}>
    Scanner QR non abilitato in questa versione Web. Inserisci il codice manualmente.
    Per la scansione usa l’app su un dispositivo Android o iOS.
  </Text>;
}
