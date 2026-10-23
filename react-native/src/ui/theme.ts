import { StyleSheet } from 'react-native';
export const colors = {
  accent: '#25785B', accentDark: '#19533F', background: '#F3F6F4', card: '#FFFFFF',
  text: '#172F27', muted: '#53675F', border: '#D5DFD9', soft: '#E7F2EC',
  error: '#9C302B', errorSoft: '#FFF0ED',
} as const;
export const common = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: 20, borderWidth: 1,
    borderColor: colors.border, padding: 20, gap: 14 },
  title: { color: colors.text, fontSize: 20, fontWeight: '700' },
  body: { color: colors.muted, fontSize: 15, lineHeight: 22 },
});
