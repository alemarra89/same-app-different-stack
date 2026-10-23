import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { ActionButton } from '../ui/ActionButton';
import { colors, common } from '../ui/theme';
import type { QrScannerProps } from './types';

export function QrScanner({ onCode, disabled }: QrScannerProps) {
  const [permission, requestPermission, getPermission] = useCameraPermissions();
  const [error, setError] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  useEffect(() => {
    if (!permission?.granted || cameraReady || error) return;
    // isAvailableAsync is Web-only in SDK 58: native availability comes from mount events.
    const timeout = setTimeout(() => setError(
      'Fotocamera assente o non pronta. Usa il codice manuale oppure chiudi e riapri lo scanner.',
    ), 12000);
    return () => clearTimeout(timeout);
  }, [permission?.granted, cameraReady, error]);
  const askPermission = async () => {
    setRequesting(true); setError(null);
    try { await requestPermission(); }
    catch { setError('Impossibile richiedere il permesso camera. Usa il codice manuale.'); }
    finally { setRequesting(false); }
  };
  if (permission === null) {
    return <Text style={common.body}>Verifica della fotocamera…</Text>;
  }
  if (!permission.granted) return <View style={styles.stack}>
    <Text style={common.body}>{permission.status === 'denied'
      ? 'Permesso camera negato. Puoi continuare con il codice manuale.'
      : 'Consenti l’accesso alla fotocamera per leggere i QR dei partecipanti.'}</Text>
    {error && <Text accessibilityRole="alert" style={common.body}>{error}</Text>}
    {permission.canAskAgain
      ? <ActionButton label="Consenti fotocamera" disabled={requesting} onPress={() => { void askPermission(); }} />
      : <>
        <ActionButton label="Apri impostazioni" onPress={() => {
          void Linking.openSettings().catch(() => setError('Apri le impostazioni del dispositivo e abilita la fotocamera.'));
        }} />
        <ActionButton label="Ricontrolla permesso" secondary onPress={() => {
          void getPermission().catch(() => setError('Verifica del permesso non riuscita.'));
        }} />
      </>}
  </View>;
  if (error) return <Text accessibilityRole="alert" style={common.body}>{error}</Text>;
  return <View style={styles.stack}>
    <View style={styles.preview} accessibilityLabel="Anteprima fotocamera per la lettura QR">
      <CameraView style={StyleSheet.absoluteFill} facing="back"
        onCameraReady={() => setCameraReady(true)}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={disabled ? undefined : ({ data }) => onCode(data)}
        onMountError={() => setError('Fotocamera non disponibile. Usa il codice manuale oppure chiudi e riapri lo scanner.')} />
      <View pointerEvents="none" style={styles.frame} />
    </View>
    <Text style={common.body}>Inquadra un QR contenente solo l’ID, per esempio EVT-002.</Text>
  </View>;
}
const styles = StyleSheet.create({
  stack: { gap: 12 },
  preview: { height: 250, backgroundColor: colors.text, borderRadius: 14, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center' },
  frame: { width: 180, height: 180, borderWidth: 3, borderColor: '#FFFFFF', borderRadius: 16 },
});
