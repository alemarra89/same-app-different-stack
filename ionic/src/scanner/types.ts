export type ScanResult =
  | { status: 'scanned'; id: string }
  | { status: 'cancelled' }
  | { status: 'unavailable'; reason: 'permission' | 'camera' | 'unsupported' | 'unknown' };
export interface QrScanner { scan(): Promise<ScanResult> }
export const SCANNER_MESSAGES = {
  permission: 'Permesso fotocamera negato. Puoi abilitarlo nelle impostazioni dell’app oppure inserire il codice manualmente.',
  camera: 'Fotocamera non disponibile. Inserisci il codice manualmente.',
  unsupported: 'Scanner non disponibile su questa piattaforma. Inserisci il codice manualmente.',
  unknown: 'Impossibile avviare la scansione. Controlla il permesso fotocamera o usa il codice manuale.',
} as const;
