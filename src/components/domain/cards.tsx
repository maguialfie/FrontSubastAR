import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge, Body, Card } from '@/components/ui/primitives';
import { colors, fonts, radius, spacing, typography } from '@/constants/theme';
import type { Auction, Lot, PaymentMethod, Purchase } from '@/types/domain';

const formatMoney = (value: number) => `USD ${value.toLocaleString('es-AR')}`;

export function AuctionCard({ auction, onPress }: { auction: Auction; onPress: () => void }) {
  const tone = auction.status === 'En vivo' ? 'green' : auction.status === 'Finalizada' ? 'red' : 'purple';
  return (
    <Pressable onPress={onPress}>
      <Card style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle}>{auction.name}</Text>
          <Badge label={auction.status} tone={tone} />
        </View>
        <Body muted>{auction.category} - {auction.currency}</Body>
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
          <Text style={styles.meta}>{auction.date}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={14} color={colors.textMuted} />
          <Text style={styles.meta}>{auction.location}</Text>
        </View>
      </Card>
    </Pressable>
  );
}

export function LotCard({ lot, onPress }: { lot: Lot; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.lotCard}>
      {lot.image ? <Image source={{ uri: lot.image }} style={styles.lotImage} /> : (
        <View style={[styles.lotImage, styles.noImage]}><Ionicons name="image-outline" size={28} color={colors.primary} /></View>
      )}
      <View style={styles.lotCopy}>
        <Text numberOfLines={2} style={styles.lotTitle}>{lot.title}</Text>
        <Text style={styles.lotNumber}>Lote {lot.lotNumber}</Text>
        <Text style={styles.price}>{formatMoney(lot.basePrice)}</Text>
      </View>
    </Pressable>
  );
}

export function PaymentMethodCard({ payment, selected }: { payment: PaymentMethod; selected?: boolean }) {
  return (
    <Card style={[styles.payment, selected && styles.selected]}>
      <Ionicons name={payment.type === 'Tarjeta' ? 'card-outline' : 'wallet-outline'} size={22} color={colors.primary} />
      <View style={styles.grow}>
        <Text style={styles.cardTitle}>{payment.label}</Text>
        <Text style={styles.meta}>{payment.detail}</Text>
      </View>
      {selected ? <Ionicons name="checkmark-circle" size={22} color={colors.primary} /> : null}
    </Card>
  );
}

export function PurchaseCard({ purchase, onPress }: { purchase: Purchase; onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <Card>
        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle}>{purchase.lot.title}</Text>
          <Badge label={purchase.paymentStatus} tone="green" />
        </View>
        <Text style={styles.price}>{formatMoney(purchase.amount)}</Text>
        <Body muted>{purchase.deliveryStatus}</Body>
      </Card>
    </Pressable>
  );
}

export function formatCurrency(amount: number) {
  return formatMoney(amount);
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  cardTitle: { fontSize: typography.body, fontFamily: fonts.bold, color: colors.text, flexShrink: 1 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  meta: { color: colors.textMuted, fontSize: typography.small, fontFamily: fonts.regular },
  lotCard: { flex: 1, minWidth: '46%', overflow: 'hidden', borderRadius: radius.md, borderColor: colors.border, borderWidth: 1, backgroundColor: colors.surface },
  lotImage: { width: '100%', height: 122, backgroundColor: colors.surfaceAlt },
  noImage: { alignItems: 'center', justifyContent: 'center' },
  lotCopy: { padding: spacing.sm, gap: spacing.xs },
  lotTitle: { fontSize: typography.small, color: colors.text, fontFamily: fonts.bold },
  lotNumber: { fontSize: typography.caption, color: colors.textMuted, fontFamily: fonts.regular },
  price: { fontSize: typography.body, fontFamily: fonts.black, color: colors.text },
  payment: { flexDirection: 'row', alignItems: 'center' },
  selected: { backgroundColor: colors.primarySoft, borderColor: colors.primaryBorder },
  grow: { flex: 1, gap: spacing.xs },
});
