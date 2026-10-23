import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { AccessibilityInfo, AppState, FlatList, Keyboard, KeyboardAvoidingView, Platform, StyleSheet,
  Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EVENT } from '../data/event';
import { useCheckIn } from '../hooks/useCheckIn';
import type { Participant } from '../models/participant';
import { QrScanner } from '../scanner/QrScanner';
import { ActionButton } from '../ui/ActionButton';
import { colors, common } from '../ui/theme';

export function CheckInScreen() {
  const { participants, ready, busy, feedback, service } = useCheckIn();
  const [query, setQuery] = useState('');
  const [code, setCode] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [foreground, setForeground] = useState(AppState.currentState === 'active');
  const [confirmReset, setConfirmReset] = useState(false);
  const [focusField, setFocusField] = useState<'search' | 'code' | null>(null);
  const codeInput = useRef<ComponentRef<typeof TextInput>>(null);
  const searchInput = useRef<ComponentRef<typeof TextInput>>(null);

  useEffect(() => {
    if (feedback && Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(feedback.message);
  }, [feedback]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => setForeground(state === 'active'));
    return () => subscription.remove();
  }, []);

  const present = participants.filter(({ checkedIn }) => checkedIn).length;
  const normalizedQuery = query.trim().toLocaleLowerCase('it-IT');
  const filtered = participants.filter(({ name, id }) =>
    name.toLocaleLowerCase('it-IT').includes(normalizedQuery) ||
    id.toLocaleLowerCase('it-IT').includes(normalizedQuery));
  const submit = () => {
    Keyboard.dismiss();
    void service.checkIn(code);
  };

  const header = <View style={styles.header}>
    <View style={styles.brandRow}>
      <View style={styles.brandMark}><Text style={styles.brandMarkText}>✓</Text></View>
      <View><Text style={styles.brand}>Event Check-in</Text>
        <Text style={styles.eyebrow}>ACCOGLIENZA PARTECIPANTI</Text></View>
    </View>
    <View style={styles.eventCard}>
      <Text style={styles.eventDate}>{EVENT.date} · MEETUP</Text>
      <Text accessibilityRole="header" style={styles.eventTitle}>{EVENT.name}</Text>
      <Text style={styles.eventSubtitle}>Un incontro, tante connessioni. Si parte da qui.</Text>
      <View style={styles.countRow}>
        <Text accessibilityLiveRegion="polite" style={styles.count}>
          {ready ? `${present} / ${participants.length} presenti` : 'Caricamento presenze…'}
        </Text>
        <Text style={styles.countHint}>{ready ? `${participants.length - present} in attesa` : 'Storage locale'}</Text>
      </View>
      <View accessibilityRole="progressbar" accessibilityLabel="Partecipanti presenti"
        accessibilityValue={{ min: 0, max: participants.length, now: present }} style={styles.track}>
        <View style={[styles.fill, { width: `${present / participants.length * 100}%` }]} />
      </View>
    </View>

    <View style={common.card}>
      <Text accessibilityRole="header" style={common.title}>Registra un ingresso</Text>
      <Text style={common.body}>Scansiona il QR del partecipante o inserisci il suo codice.</Text>
      <ActionButton label={scannerOpen ? 'Chiudi scanner' : 'Scansiona QR'}
        disabled={!ready || busy || confirmReset} onPress={() => {
          Keyboard.dismiss(); setScannerOpen((open) => !open);
        }} />
      {scannerOpen && foreground && !confirmReset && <QrScanner disabled={!ready || busy}
        onCode={(value) => { void service.checkIn(value, 'scanner'); }} />}
      <View style={styles.dividerRow}><View style={styles.divider} />
        <Text style={styles.dividerText}>oppure usa il codice</Text><View style={styles.divider} /></View>
      <Text style={styles.label} onPress={() => codeInput.current?.focus()}>Codice partecipante</Text>
      <TextInput ref={codeInput} value={code} onChangeText={setCode}
        accessibilityLabel="Codice partecipante" accessibilityHint="Per esempio EVT-001"
        placeholder="Es. EVT-001" placeholderTextColor={colors.muted}
        autoCapitalize="characters" autoCorrect={false} returnKeyType="done"
        editable={ready && !busy && !confirmReset} onSubmitEditing={submit}
        onFocus={() => setFocusField('code')} onBlur={() => setFocusField(null)}
        style={[styles.input, styles.codeInput, focusField === 'code' && styles.inputFocus]} />
      <ActionButton label={busy ? 'Attendi…' : 'Conferma check-in'} secondary
        disabled={!ready || busy || confirmReset || !code.trim()} onPress={submit} />
      {!ready && !busy && <ActionButton label="Riprova caricamento" secondary
        onPress={() => { void service.load(); }} />}
    </View>

    <View style={styles.sectionHeading}>
      <Text accessibilityRole="header" style={common.title}>Partecipanti</Text>
      <Text style={styles.sectionCount}>{filtered.length} di {participants.length}</Text>
    </View>
    <Text style={styles.label} onPress={() => searchInput.current?.focus()}>Cerca per nome o ID</Text>
    <TextInput ref={searchInput} value={query} onChangeText={setQuery}
      accessibilityLabel="Cerca per nome o ID" placeholder="Cerca per nome o ID"
      placeholderTextColor={colors.muted} autoCorrect={false} returnKeyType="search"
      onFocus={() => setFocusField('search')} onBlur={() => setFocusField(null)}
      style={[styles.input, focusField === 'search' && styles.inputFocus]} />
  </View>;

  return <SafeAreaView style={styles.safe}>
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FlatList<Participant> data={filtered} keyExtractor={({ id }) => id}
        contentContainerStyle={styles.content} ListHeaderComponent={header}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'web' ? 'none' : 'on-drag'}
        ItemSeparatorComponent={() => <View style={styles.rowGap} />}
        renderItem={({ item }) => <View style={styles.participant} accessible
          accessibilityLabel={`${item.name}, ${item.id}, ${item.checkedIn ? 'Presente' : 'In attesa'}`}>
          <View style={[styles.avatar, item.checkedIn && styles.avatarPresent]}>
            <Text style={styles.initials}>{item.name.split(' ').map((part) => part[0]).join('')}</Text>
          </View>
          <View style={styles.personDetails}><Text style={styles.personName}>{item.name}</Text>
            <Text style={styles.personId}>{item.id}</Text></View>
          <View style={[styles.badge, item.checkedIn && styles.badgePresent]}>
            <Text style={[styles.badgeText, item.checkedIn && styles.badgePresentText]}>
              {item.checkedIn ? '✓ Presente' : 'In attesa'}</Text></View>
        </View>}
        ListEmptyComponent={<Text style={styles.empty}>Nessun partecipante trovato.</Text>}
        ListFooterComponent={<View style={styles.footer}>
          {confirmReset ? <View style={common.card}>
            <Text accessibilityRole="header" style={common.title}>Reimpostare la demo?</Text>
            <Text style={common.body}>Tutti i check-in salvati su questo dispositivo saranno azzerati.</Text>
            <ActionButton label="Annulla" secondary disabled={busy} onPress={() => setConfirmReset(false)} />
            <ActionButton label="Sì, reimposta demo" disabled={busy} onPress={() => {
              void service.reset().then(() => setConfirmReset(false));
            }} />
          </View> : <ActionButton label="Reimposta demo" secondary disabled={busy}
            onPress={() => { setScannerOpen(false); setConfirmReset(true); }} />}
          <Text style={styles.localNote}>Solo su questo dispositivo · Dati salvati in locale</Text>
        </View>} />
      {feedback && <View style={styles.feedbackContainer}>
        <View accessibilityRole={feedback.tone === 'error' ? 'alert' : undefined}
          accessibilityLiveRegion="polite"
          style={[styles.feedback, feedback.tone === 'error' && styles.feedbackError]}>
          <Text style={[styles.feedbackText, feedback.tone === 'error' && styles.errorText]}>
            {feedback.message}
          </Text>
        </View>
      </View>}
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background }, flex: { flex: 1 },
  content: { width: '100%', maxWidth: 680, alignSelf: 'center', padding: 20, paddingBottom: 28 },
  header: { gap: 14, marginBottom: 14 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 8 },
  brandMark: { width: 44, height: 44, backgroundColor: colors.accent, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  brandMarkText: { color: '#FFFFFF', fontSize: 27, fontWeight: '700' },
  brand: { fontSize: 20, color: colors.text, fontWeight: '700' },
  eyebrow: { fontSize: 10, letterSpacing: 1.4, color: colors.muted, marginTop: 3, fontWeight: '600' },
  eventCard: { borderRadius: 22, padding: 22, backgroundColor: colors.accentDark, gap: 12, marginBottom: 4 },
  eventDate: { color: '#CDE9DA', fontSize: 12, fontWeight: '700', letterSpacing: 1.2 },
  eventTitle: { color: '#FFFFFF', fontSize: 30, fontWeight: '700', lineHeight: 36 },
  eventSubtitle: { color: '#DDECE5', fontSize: 15, lineHeight: 22 },
  countRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginTop: 12 },
  count: { color: '#FFFFFF', fontSize: 23, fontWeight: '700' }, countHint: { color: '#DDECE5', fontSize: 13 },
  track: { height: 6, backgroundColor: '#497763', borderRadius: 3, overflow: 'hidden' },
  fill: { height: 6, backgroundColor: '#B7E4C9', borderRadius: 3 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 2 },
  divider: { height: 1, backgroundColor: colors.border, flex: 1 }, dividerText: { color: colors.muted, fontSize: 12 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
  input: { minHeight: 52, borderWidth: 2, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 12, backgroundColor: colors.card, fontSize: 16, color: colors.text },
  codeInput: { letterSpacing: 1 }, inputFocus: { borderColor: colors.accent },
  feedback: { borderRadius: 12, padding: 14, backgroundColor: colors.soft },
  feedbackContainer: { width: '100%', maxWidth: 680, alignSelf: 'center', paddingHorizontal: 20,
    paddingVertical: 10, backgroundColor: colors.background },
  feedbackError: { backgroundColor: colors.errorSoft },
  feedbackText: { color: colors.accentDark, fontSize: 15, fontWeight: '600', lineHeight: 22 }, errorText: { color: colors.error },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  sectionCount: { fontSize: 13, color: colors.muted },
  participant: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12, padding: 16,
    borderWidth: 1, borderColor: colors.border, borderRadius: 16, backgroundColor: colors.card },
  avatar: { width: 42, height: 42, backgroundColor: '#EFF2F0', borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  avatarPresent: { backgroundColor: colors.soft }, initials: { fontSize: 14, fontWeight: '700', color: colors.accentDark },
  personDetails: { flexGrow: 1, flexShrink: 1, minWidth: 105, gap: 4 },
  personName: { color: colors.text, fontSize: 16, fontWeight: '600' }, personId: { color: colors.muted, fontSize: 13 },
  badge: { backgroundColor: '#EFF2F0', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 9 },
  badgePresent: { backgroundColor: colors.soft }, badgeText: { fontSize: 12, fontWeight: '600', color: colors.muted },
  badgePresentText: { color: colors.accentDark }, rowGap: { height: 9 },
  empty: { color: colors.muted, textAlign: 'center', paddingVertical: 28, fontSize: 16 },
  footer: { gap: 16, marginTop: 24 }, localNote: { textAlign: 'center', color: colors.muted, fontSize: 12, lineHeight: 18 },
});
