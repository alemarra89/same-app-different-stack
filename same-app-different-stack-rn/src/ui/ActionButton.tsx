import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from './theme';
type Props = {
  label: string; onPress: () => void; disabled?: boolean; secondary?: boolean; accessibilityHint?: string;
};
export function ActionButton({ label, onPress, disabled = false, secondary = false, accessibilityHint }: Props) {
  const [focused, setFocused] = useState(false);
  return <Pressable accessibilityRole="button" accessibilityLabel={label}
    accessibilityHint={accessibilityHint} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
    onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
    style={({ pressed }) => [styles.button, secondary && styles.secondary,
      pressed && styles.pressed, focused && styles.focus, disabled && styles.disabled]}>
    <Text style={[styles.label, secondary && styles.secondaryLabel]}>{label}</Text>
  </Pressable>;
}
const styles = StyleSheet.create({
  button: { minHeight: 50, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent,
    borderWidth: 2, borderColor: colors.accent },
  secondary: { backgroundColor: colors.card, borderColor: colors.border },
  label: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', textAlign: 'center' },
  secondaryLabel: { color: colors.accentDark }, pressed: { opacity: 0.78 },
  focus: { borderColor: colors.text, outlineWidth: 2, outlineColor: colors.accent },
  disabled: { opacity: 0.5 },
});
