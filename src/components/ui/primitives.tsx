import { Ionicons } from '@expo/vector-icons';
import type { PropsWithChildren, ReactNode } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandWordmark } from '@/components/brand/logo';
import { colors, deepShadow, fonts, radius, shadow, spacing, typography, MaxContentWidth } from '@/constants/theme';

export function Screen({ children, scroll = true, style }: PropsWithChildren<{ scroll?: boolean; style?: StyleProp<ViewStyle> }>) {
  const content = <View style={[styles.content, style]}>{children}</View>;
  return (
    <SafeAreaView style={styles.safe}>
      {scroll ? <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>{content}</ScrollView> : content}
    </SafeAreaView>
  );
}

export function Header({ title, subtitle, onBack, right }: { title: string; subtitle?: string; onBack?: () => void; right?: ReactNode }) {
  return (
    <View style={styles.header}>
      {onBack ? (
        <Pressable onPress={onBack} style={styles.back}>
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </Pressable>
      ) : <BrandWordmark compact />}
      <View style={styles.headerCopy}>
        {title ? <Text style={styles.headerTitle}>{title}</Text> : null}
        {subtitle ? <Text style={styles.subtle}>{subtitle}</Text> : null}
      </View>
      {right ?? <View style={styles.headerSpacer} />}
    </View>
  );
}

export function Title({ children }: PropsWithChildren) {
  return <Text style={styles.title}>{children}</Text>;
}

export function Body({ children, muted = false }: PropsWithChildren<{ muted?: boolean }>) {
  return <Text style={[styles.body, muted && styles.subtle]}>{children}</Text>;
}

export function Card({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled,
}: {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.button, styles[`button_${variant}`], pressed && styles.pressed, disabled && styles.disabled]}>
      {icon ? <Ionicons name={icon} size={17} color={variant === 'primary' || variant === 'danger' ? '#FFF' : colors.primary} /> : null}
      <Text style={[styles.buttonText, styles[`buttonText_${variant}`]]}>{label}</Text>
    </Pressable>
  );
}

export function Input({ label, error, ...props }: TextInputProps & { label?: string; error?: string }) {
  return (
    <View style={styles.inputWrap}>
      {label ? <Text style={styles.inputLabel}>{label}</Text> : null}
      <TextInput placeholderTextColor={colors.textMuted} style={[styles.input, error && styles.inputError]} {...props} />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

export function SearchInput(props: TextInputProps) {
  return (
    <View style={styles.search}>
      <Ionicons name="search-outline" size={18} color={colors.textMuted} />
      <TextInput placeholderTextColor={colors.textMuted} style={styles.searchField} {...props} />
    </View>
  );
}

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function Badge({ label, tone = 'purple' }: { label: string; tone?: 'purple' | 'green' | 'red' | 'yellow' }) {
  return (
    <View style={[styles.badge, styles[`badge_${tone}`]]}>
      <Text style={[styles.badgeText, styles[`badgeText_${tone}`]]}>{label}</Text>
    </View>
  );
}

export function LoadingState() {
  return <View style={styles.state}><ActivityIndicator color={colors.primary} /><Body muted>Cargando información...</Body></View>;
}

export function EmptyState({ title, message }: { title: string; message: string }) {
  return <Card style={styles.state}><View style={styles.stateIcon}><Ionicons name="albums-outline" size={24} color={colors.primary} /></View><Text style={styles.sectionTitle}>{title}</Text><Body muted>{message}</Body></Card>;
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <Card style={styles.state}>
      <View style={[styles.stateIcon, styles.errorIcon]}><Ionicons name="cloud-offline-outline" size={25} color={colors.danger} /></View>
      <Text style={styles.sectionTitle}>No pudimos cargar la información</Text>
      <Body muted>{message ?? 'Revisá que el backend esté encendido e intentá nuevamente.'}</Body>
      {onRetry ? <Button label="Reintentar" variant="secondary" onPress={onRetry} /> : null}
    </Card>
  );
}

export function AuthRequiredModal({ visible, onClose, onLogin, onRegister }: { visible: boolean; onClose: () => void; onLogin: () => void; onRegister: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Card style={styles.modalCard}>
          <Ionicons name="lock-closed-outline" size={30} color={colors.primary} />
          <Title>Iniciá sesión</Title>
          <Body muted>Necesitas una cuenta para pujar, vender productos o gestionar compras.</Body>
          <Button label="Iniciar sesión" onPress={onLogin} />
          <Button label="Crear cuenta" variant="secondary" onPress={onRegister} />
          <Button label="Ahora no" variant="ghost" onPress={onClose} />
        </Card>
      </View>
    </Modal>
  );
}

export function ConfirmationModal({
  visible,
  title,
  message,
  confirmLabel,
  pending,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  pending?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Card style={styles.modalCard}>
          <Ionicons name="alert-circle-outline" size={30} color={colors.primary} />
          <Title>{title}</Title>
          <Body muted>{message}</Body>
          <Button label={pending ? 'Procesando...' : confirmLabel} variant="danger" disabled={pending} onPress={onConfirm} />
          <Button label="Cancelar" variant="ghost" disabled={pending} onPress={onClose} />
        </Card>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surfaceAlt },
  scroll: { flexGrow: 1, alignItems: 'center' },
  content: { flex: 1, width: '100%', maxWidth: MaxContentWidth, padding: spacing.xl, gap: spacing.lg, paddingBottom: 92 },
  header: { flexDirection: 'row', alignItems: 'center', minHeight: 52, gap: spacing.md },
  back: { height: 40, width: 40, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, ...shadow },
  headerCopy: { flex: 1 },
  headerSpacer: { width: 34 },
  headerTitle: { fontSize: typography.heading, fontFamily: fonts.black, color: colors.text },
  title: { color: colors.text, fontSize: typography.title, lineHeight: 31, fontFamily: fonts.black },
  body: { fontSize: typography.body, lineHeight: 20, color: colors.text, fontFamily: fonts.regular },
  subtle: { color: colors.textMuted },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md, ...shadow },
  button: { minHeight: 48, borderRadius: radius.sm, flexDirection: 'row', gap: spacing.sm, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg },
  button_primary: { backgroundColor: colors.primary, ...deepShadow },
  button_secondary: { backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primaryBorder },
  button_ghost: { backgroundColor: 'transparent' },
  button_danger: { backgroundColor: colors.danger },
  buttonText: { fontSize: 14, fontFamily: fonts.bold },
  buttonText_primary: { color: '#FFF' },
  buttonText_secondary: { color: colors.primary },
  buttonText_ghost: { color: colors.primary },
  buttonText_danger: { color: '#FFF' },
  pressed: { opacity: 0.76 },
  disabled: { opacity: 0.45 },
  inputWrap: { gap: spacing.xs },
  inputLabel: { fontSize: typography.small, color: colors.textMuted, fontFamily: fonts.bold },
  input: { minHeight: 48, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: spacing.md, color: colors.text, backgroundColor: colors.surface, fontFamily: fonts.regular },
  inputError: { borderColor: colors.danger },
  errorText: { color: colors.danger, fontSize: typography.small, fontFamily: fonts.regular },
  search: { backgroundColor: colors.surface, borderRadius: radius.pill, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, minHeight: 48, gap: spacing.sm, borderWidth: 1, borderColor: colors.border },
  searchField: { flex: 1, color: colors.text, fontFamily: fonts.regular },
  chip: { borderRadius: radius.pill, backgroundColor: colors.surfaceAlt, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  chipActive: { backgroundColor: colors.primarySoft },
  chipText: { fontSize: typography.small, color: colors.textMuted, fontFamily: fonts.medium },
  chipTextActive: { color: colors.primary },
  badge: { alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderWidth: 1, borderColor: 'transparent' },
  badge_purple: { backgroundColor: colors.primarySoft, borderColor: colors.primaryBorder },
  badge_green: { backgroundColor: colors.successSoft, borderColor: '#C9EED5' },
  badge_red: { backgroundColor: colors.dangerSoft, borderColor: '#F7C9C9' },
  badge_yellow: { backgroundColor: colors.warningSoft, borderColor: '#F1DBA8' },
  badgeText: { fontSize: typography.caption, fontFamily: fonts.bold },
  badgeText_purple: { color: colors.primary },
  badgeText_green: { color: colors.success },
  badgeText_red: { color: colors.danger },
  badgeText_yellow: { color: colors.warning },
  state: { alignItems: 'center', justifyContent: 'center', minHeight: 170, gap: spacing.sm },
  stateIcon: { width: 48, height: 48, borderRadius: radius.pill, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  errorIcon: { backgroundColor: colors.dangerSoft },
  sectionTitle: { color: colors.text, fontSize: typography.heading, fontFamily: fonts.bold, textAlign: 'center' },
  overlay: { flex: 1, backgroundColor: 'rgba(17,17,23,0.45)', alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  modalCard: { width: '100%', maxWidth: 360, alignItems: 'center' },
});
