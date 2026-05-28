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
      <Card style={[styles.card, auction.status === 'En vivo' && styles.liveCard]}>
        <View style={styles.rowBetween}>
          <View style={styles.auctionTitleWrap}>
            <Text style={styles.eyebrow}>{auction.category}</Text>
            <Text style={styles.cardTitle}>{auction.name}</Text>
          </View>
          <Badge label={auction.status} tone={tone} />
        </View>
        <View style={styles.auctionMetaGrid}>
          <MetaPill icon="calendar-outline" value={auction.date} />
          <MetaPill icon="location-outline" value={auction.location} />
          <MetaPill icon="cash-outline" value={auction.currency} />
          <MetaPill icon="albums-outline" value={`${auction.totalLots} lotes`} />
        </View>
        <View style={styles.cardFooter}>
          <Text style={styles.meta}>Remata {auction.auctioneer}</Text>
          <View style={styles.forward}>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

function MetaPill({ icon, value }: { icon: keyof typeof Ionicons.glyphMap; value: string }) {
  return (
    <View style={styles.metaPill}>
      <Ionicons name={icon} size={14} color={colors.primary} />
      <Text style={styles.meta} numberOfLines={1}>{value}</Text>
    </View>
  );
}

export function LotCard({ lot, onPress }: { lot: Lot; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.lotCard}>
      {lot.image ? <Image source={{ uri: lot.image }} style={styles.lotImage} /> : (
        <View style={[styles.lotImage, styles.noImage]}><Ionicons name="image-outline" size={28} color={colors.primary} /></View>
      )}
      <View style={styles.lotCopy}>
        <Badge label={`Lote ${lot.lotNumber}`} tone={lot.status?.toLowerCase() === 'vendido' || lot.status?.toLowerCase() === 'subastado' ? 'red' : 'purple'} />
        <Text numberOfLines={2} style={styles.lotTitle}>{lot.title}</Text>
        <Text style={styles.price}>{formatMoney(lot.basePrice)}</Text>
      </View>
    </Pressable>
  );
}

export function PaymentMethodCard({ payment, selected }: { payment: PaymentMethod; selected?: boolean }) {
  return (
    <Card style={[styles.payment, selected && styles.selected]}>
      <View style={styles.paymentIcon}>
        <Ionicons name={payment.type === 'Tarjeta' ? 'card-outline' : 'wallet-outline'} size={22} color={colors.primary} />
      </View>
      <View style={styles.grow}>
        <Text style={styles.cardTitle}>{payment.label}</Text>
        <Text style={styles.meta}>{payment.detail}</Text>
      </View>
      <Badge label={payment.verified ? 'Verificado' : 'Pendiente'} tone={payment.verified ? 'green' : 'yellow'} />
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
  card: { gap: spacing.md },
  liveCard: { borderColor: colors.primaryBorder, backgroundColor: colors.surface },
  auctionTitleWrap: { flex: 1, gap: spacing.xs },
  eyebrow: { color: colors.primary, fontSize: typography.caption, fontFamily: fonts.black, textTransform: 'uppercase' },
  cardTitle: { fontSize: typography.heading, lineHeight: 23, fontFamily: fonts.bold, color: colors.text, flexShrink: 1 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm },
  auctionMetaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  metaPill: { maxWidth: '48%', minHeight: 34, flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.surfaceAlt, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  meta: { color: colors.textMuted, fontSize: typography.small, fontFamily: fonts.regular },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, paddingTop: spacing.xs, borderTopWidth: 1, borderTopColor: colors.border },
  forward: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  lotCard: { flex: 1, minWidth: '46%', overflow: 'hidden', borderRadius: radius.lg, borderColor: colors.border, borderWidth: 1, backgroundColor: colors.surface },
  lotImage: { width: '100%', height: 136, backgroundColor: colors.surfaceAlt },
  noImage: { alignItems: 'center', justifyContent: 'center' },
  lotCopy: { padding: spacing.md, gap: spacing.xs },
  lotTitle: { fontSize: typography.body, lineHeight: 19, color: colors.text, fontFamily: fonts.bold },
  price: { fontSize: typography.body, fontFamily: fonts.black, color: colors.primaryDark },
  payment: { flexDirection: 'row', alignItems: 'center' },
  selected: { backgroundColor: colors.primarySoft, borderColor: colors.primaryBorder },
  paymentIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  grow: { flex: 1, gap: spacing.xs },
});
