import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { AuctionCard, formatCurrency, LotCard, PaymentMethodCard } from '@/components/domain/cards';
import { AuthRequiredModal, Badge, Body, Button, Card, Chip, EmptyState, ErrorState, Header, Input, LoadingState, Screen, SearchInput, Title } from '@/components/ui/primitives';
import { colors, fonts, radius, spacing, typography } from '@/constants/theme';
import { useSession } from '@/providers/app-provider';
import { auctionService, paymentService, profileService } from '@/services/api';
import { ApiError } from '@/services/http';

function useId() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return id ?? '';
}

export function HomeScreen() {
  const router = useRouter();
  const { session } = useSession();
  const [requiresAuth, setRequiresAuth] = useState(false);
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['auctions', 'featured'], queryFn: () => auctionService.list() });
  const { data: accountState } = useQuery({ queryKey: ['account-state'], queryFn: profileService.accountState, enabled: !!session });
  const featured = data?.[0];
  if (accountState?.status === 'Bloqueado') {
    return (
      <Screen>
        <Header title="Inicio bloqueado" />
        <Card style={styles.blockedHome}>
          <Ionicons name="lock-closed-outline" size={46} color={colors.danger} />
          <Title>Tu cuenta está bloqueada</Title>
          <Body muted>{accountState.message ?? 'No podés operar mientras la cuenta permanezca bloqueada.'}</Body>
          <Button label="Ver estado de cuenta" onPress={() => router.push('/profile/account-status')} />
        </Card>
      </Screen>
    );
  }
  return (
    <Screen>
      <Header title="" right={<Ionicons name="notifications-outline" size={22} color={colors.text} />} />
      <Body muted>Bienvenido{session ? `, ${session.profile.name.split(' ')[0]}` : ''}</Body>
      {isLoading ? <LoadingState /> : isError ? <ErrorState onRetry={() => refetch()} /> : featured ? <AuctionCard auction={featured} onPress={() => router.push(`/auction/${featured.id}`)} /> : <EmptyState title="No hay subastas destacadas" message="Volvé a consultar más tarde." />}
      <Pressable style={styles.exploreHero} onPress={() => router.push('/(tabs)/auctions')}>
        <Ionicons name="hammer-outline" size={27} color="#FFF" />
        <View style={styles.flex}>
          <Text style={styles.heroTitle}>Explorar subastas</Text>
          <Text style={styles.heroBody}>Ver catálogos y pujar</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#FFF" />
      </Pressable>
      <Pressable style={styles.sellHero} onPress={() => session ? router.push('/sell') : setRequiresAuth(true)}>
        <Ionicons name="add-circle-outline" size={27} color={colors.primary} />
        <View style={styles.flex}>
          <Text style={styles.sellTitle}>Subir bien</Text>
          <Text style={styles.heroBodyDark}>Subir bienes para subastar</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.primary} />
      </Pressable>
      <AuthRequiredModal
        visible={requiresAuth}
        onClose={() => setRequiresAuth(false)}
        onLogin={() => { setRequiresAuth(false); router.push({ pathname: '/login', params: { returnTo: '/sell' } }); }}
        onRegister={() => { setRequiresAuth(false); router.push({ pathname: '/register', params: { returnTo: '/sell' } }); }}
      />
    </Screen>
  );
}

export function AuctionsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ status?: string; category?: string; currency?: string }>();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(params.status ?? 'Todas');
  const category = params.category ?? 'Todas';
  const currency = params.currency ?? 'Todas';
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['auctions', search, status, category, currency],
    queryFn: () => auctionService.list({ search, status, category, currency }),
  });
  return (
    <Screen>
      <Header title="Subastas" />
      <SearchInput value={search} onChangeText={setSearch} placeholder="Buscar subasta" />
      <View style={styles.chips}>
        {['Todas', 'En vivo', 'Próximas', 'Finalizada'].map((item) => (
          <Chip label={item} active={item === status} onPress={() => setStatus(item)} key={item} />
        ))}
      </View>
      <Button label="Filtros avanzados" variant="ghost" icon="options-outline" onPress={() => router.push('/auction-filters')} />
      {isLoading ? <LoadingState /> : isError ? <ErrorState onRetry={() => refetch()} /> : data?.length ? data.map((auction) => (
        <AuctionCard key={auction.id} auction={auction} onPress={() => router.push(`/auction/${auction.id}`)} />
      )) : <EmptyState title="Sin resultados" message="Proba con otros filtros o palabras clave." />}
    </Screen>
  );
}

export function AuctionDetailScreen() {
  const router = useRouter();
  const id = useId();
  const { data: auction, isLoading, isError, refetch } = useQuery({ queryKey: ['auction', id], queryFn: () => auctionService.get(id) });
  if (isLoading) return <Screen><LoadingState /></Screen>;
  if (isError || !auction) return <Screen><Header title="Datos subasta" onBack={() => router.back()} /><ErrorState onRetry={() => refetch()} /></Screen>;
  return (
    <Screen>
      <Header title="Datos subasta" onBack={() => router.back()} />
      <Card style={styles.detailHero}>
        <View style={styles.between}>
          <Title>{auction.name}</Title>
          <Badge label={auction.status} tone="green" />
        </View>
        <InfoRow icon="calendar-outline" label="Fecha y hora" value={auction.date} />
        <InfoRow icon="location-outline" label="Lugar" value={auction.location} />
        <InfoRow icon="cash-outline" label="Moneda" value={auction.currency} />
        <InfoRow icon="person-outline" label="Rematador" value={auction.auctioneer} />
      </Card>
      <Card>
        <Body muted>Cantidad de lotes disponibles</Body>
        <Text style={styles.bigNumber}>{auction.totalLots}</Text>
      </Card>
      <Button label="Ver catálogo" onPress={() => router.push(`/auction/${id}/catalog`)} />
      {auction.status === 'En vivo' ? <>
        <Button label="Ir a pujar" onPress={() => router.push(`/live/${id}`)} />
        <Button label="Ver Streaming" variant="secondary" icon="radio-outline" onPress={() => router.push(`/live/${id}`)} />
      </> : null}
    </Screen>
  );
}

function InfoRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} color={colors.primary} size={18} />
      <View>
        <Text style={styles.meta}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export function CatalogScreen() {
  const router = useRouter();
  const id = useId();
  const [filter, setFilter] = useState('Todas');
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['catalog', id], queryFn: () => auctionService.catalog(id) });
  const { data: auction } = useQuery({ queryKey: ['auction', id], queryFn: () => auctionService.get(id) });
  const lots = data?.filter((lot) => {
    if (filter === 'Todas') return true;
    const sold = lot.status?.toLowerCase() === 'vendido' || lot.status?.toLowerCase() === 'subastado';
    return filter === 'Vendidos' ? sold : !sold;
  });
  return (
    <Screen>
      <Header title="Catálogo" subtitle={auction?.name} onBack={() => router.back()} />
      <View style={styles.chips}>
        {['Todas', 'Disponibles', 'Vendidos'].map((item) => <Chip key={item} label={item} active={filter === item} onPress={() => setFilter(item)} />)}
      </View>
      {isLoading ? <LoadingState /> : isError ? <ErrorState onRetry={() => refetch()} /> : (
        <View style={styles.grid}>
          {lots?.map((lot) => <LotCard lot={lot} key={lot.id} onPress={() => router.push({ pathname: '/lot/[id]', params: { id: lot.id, auctionId: id } })} />)}
          {!lots?.length ? <EmptyState title="No hay lotes" message="No encontramos piezas para este estado." /> : null}
        </View>
      )}
    </Screen>
  );
}

export function LotDetailScreen() {
  const router = useRouter();
  const id = useId();
  const { auctionId } = useLocalSearchParams<{ auctionId?: string }>();
  const [authModal, setAuthModal] = useState(false);
  const { session } = useSession();
  const { data: lot, isLoading, isError, refetch } = useQuery({ queryKey: ['lot', id, auctionId], queryFn: () => auctionService.lot(id, auctionId ?? '') });
  if (isLoading) return <Screen><LoadingState /></Screen>;
  if (isError || !lot) return <Screen><Header title="Detalle del lote" onBack={() => router.back()} /><ErrorState onRetry={() => refetch()} /></Screen>;
  const joinLive = () => session ? router.push(`/live/${lot.auctionId}`) : setAuthModal(true);
  return (
    <Screen>
      <Header title={`Lote ${lot.lotNumber}`} onBack={() => router.back()} />
      {lot.image ? <Image source={{ uri: lot.image }} style={styles.heroImage} /> : <View style={[styles.heroImage, styles.imagePlaceholder]}><Ionicons name="image-outline" size={42} color={colors.primary} /></View>}
      <Title>{lot.title}</Title>
      <Body muted>{lot.description}</Body>
      {lot.artist ? <Card>
        <InfoRow icon="color-palette-outline" label="Artista" value={lot.artist} />
        {lot.creationDate ? <InfoRow icon="calendar-outline" label="Fecha de creación" value={lot.creationDate} /> : null}
        {lot.owner ? <InfoRow icon="document-text-outline" label="Procedencia" value={lot.owner} /> : null}
        {lot.history ? <Body muted>{lot.history}</Body> : null}
      </Card> : null}
      <Card style={styles.priceCard}>
        <Body muted>Precio base</Body>
        <Text style={styles.price}>{formatCurrency(lot.basePrice)}</Text>
      </Card>
      <Button label="Ir a pujar" onPress={joinLive} />
      <AuthRequiredModal
        visible={authModal}
        onClose={() => setAuthModal(false)}
        onLogin={() => { setAuthModal(false); router.push({ pathname: '/login', params: { returnTo: `/live/${lot.auctionId}` } }); }}
        onRegister={() => { setAuthModal(false); router.push({ pathname: '/register', params: { returnTo: `/live/${lot.auctionId}` } }); }}
      />
    </Screen>
  );
}

export function LiveAuctionScreen() {
  const router = useRouter();
  const id = useId();
  const [amount, setAmount] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [lastLotId, setLastLotId] = useState<string>();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['live', id],
    queryFn: () => auctionService.live(id),
    refetchInterval: 5000,
  });
  const { data: paymentData } = useQuery({ queryKey: ['payments'], queryFn: paymentService.list });
  const { data: auction } = useQuery({ queryKey: ['auction', id], queryFn: () => auctionService.get(id) });
  const usablePayments = paymentData?.filter((payment) => payment.verified) ?? [];
  useEffect(() => {
    if (data?.lot?.id) setLastLotId(data.lot.id);
  }, [data?.lot?.id]);
  if (isLoading) return <Screen><LoadingState /></Screen>;
  if (isError || !data) return <Screen><Header title="Subasta en vivo" onBack={() => router.back()} /><ErrorState onRetry={() => refetch()} /></Screen>;
  if (!data.lot) return (
    <Screen>
      <Header title="Subasta en vivo" onBack={() => router.back()} />
      <EmptyState title="No hay lote activo" message="El lote finalizó o aún no comenzó." />
      {lastLotId ? <Button label="Consultar resultado del lote" onPress={() => router.push({ pathname: '/result/[id]', params: { id, itemId: lastLotId } })} /> : null}
    </Screen>
  );
  return (
    <Screen>
      <Header title="Subasta en vivo" subtitle={auction?.name} onBack={() => router.back()} />
      <View style={styles.liveBanner}><View style={styles.liveDot} /><Text style={styles.liveText}>EN VIVO</Text><Text style={styles.timer}>00:{data.secondsLeft}</Text></View>
      {data.lot.image ? <Image source={{ uri: data.lot.image }} style={styles.liveImage} /> : <View style={[styles.liveImage, styles.imagePlaceholder]}><Ionicons name="image-outline" size={38} color={colors.primary} /></View>}
      <Title>{data.lot.title}</Title>
      <Card style={styles.bidPanel}>
        <Body muted>Mejor oferta actual</Body>
        <Text style={styles.offer}>{formatCurrency(data.bestBid)}</Text>
        <Body muted>Puja mínima: {formatCurrency(data.minBid)}</Body>
        {data.maxBid != null ? <Body muted>Puja máxima: {formatCurrency(data.maxBid)}</Body> : null}
        <Input label="Tu oferta" value={amount} keyboardType="number-pad" onChangeText={setAmount} />
        {usablePayments.length ? usablePayments.map((payment) => (
          <Pressable key={payment.id} onPress={() => setPaymentId(payment.id)}>
            <PaymentMethodCard payment={payment} selected={paymentId === payment.id} />
          </Pressable>
        )) : (
          <Card style={styles.noPayment}>
            <Body muted>No puedes pujar porque todavía no cuentas con medio de pago</Body>
            <Button label="Agregar medio de pago" variant="secondary" onPress={() => router.push('/profile/payments')} />
          </Card>
        )}
        <Button
          label="Pujar"
          disabled={!paymentId || !amount.trim() || Number(amount) <= 0}
          onPress={() => router.push(`/live/${id}/confirm?amount=${encodeURIComponent(amount)}&paymentId=${encodeURIComponent(paymentId)}&itemId=${data.lot?.id}`)}
        />
      </Card>
      <Text style={styles.sectionHeading}>Historial de pujas</Text>
      {data.history.map((bid) => (
        <View style={styles.bidRow} key={bid.id}>
          <Text style={styles.infoValue}>{bid.bidder}</Text>
          <Text style={styles.price}>{formatCurrency(bid.amount)}</Text>
          <Text style={styles.meta}>{bid.timestamp}</Text>
        </View>
      ))}
      <Button label="Ver historial completo" variant="ghost" onPress={() => router.push(`/live/${id}/history?itemId=${data.lot?.id}`)} />
    </Screen>
  );
}

export function BidHistoryScreen() {
  const router = useRouter();
  const { id, itemId } = useLocalSearchParams<{ id: string; itemId?: string }>();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['bid-history', id, itemId],
    queryFn: () => auctionService.bidHistory(id, itemId ?? ''),
    enabled: !!itemId,
  });
  return (
    <Screen>
      <Header title="Historial de pujas" onBack={() => router.back()} />
      {!itemId ? <EmptyState title="Sin lote seleccionado" message="Ingresa desde una subasta en vivo para consultar su historial." /> :
        isLoading ? <LoadingState /> :
          isError ? <ErrorState onRetry={() => refetch()} /> :
            data?.length ? data.map((bid, index) => (
              <Card key={bid.id} style={styles.historyCard}>
                <Badge label={index === 0 ? 'Oferta líder' : `Oferta ${index + 1}`} tone={index === 0 ? 'green' : 'purple'} />
                <Text style={styles.offer}>{formatCurrency(bid.amount)}</Text>
                <Body muted>{bid.bidder} - {bid.timestamp}</Body>
              </Card>
            )) : <EmptyState title="Sin pujas registradas" message="Todavía no se realizaron ofertas para este lote." />}
    </Screen>
  );
}

export function ConfirmBidScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id, amount, paymentId, itemId } = useLocalSearchParams<{ id: string; amount?: string; paymentId?: string; itemId?: string }>();
  const { data: payments, isLoading } = useQuery({ queryKey: ['payments'], queryFn: paymentService.list });
  const [accepted, setAccepted] = useState(false);
  const payment = payments?.find((method) => method.id === paymentId);
  const mutation = useMutation({
    mutationFn: () => auctionService.bid(id, Number(amount), paymentId ?? ''),
    onSuccess: () => {
      setAccepted(true);
      queryClient.invalidateQueries({ queryKey: ['live', id] });
    },
  });
  if (isLoading) return <Screen><LoadingState /></Screen>;
  if (!amount || !paymentId || !payment) return <Screen><Header title="Confirmar puja" onBack={() => router.back()} /><EmptyState title="Puja incompleta" message="Seleccioná monto y medio de pago desde la subasta en vivo." /></Screen>;
  const bidError = mutation.error instanceof ApiError ? mutation.error : undefined;
  const restricted = bidError?.status === 403;
  const restrictionMessage = bidError?.message.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') ?? '';
  const insufficientCategory = restricted && restrictionMessage.includes('categoria');
  return (
    <Screen>
      <Header title="Confirmar puja" onBack={() => router.back()} />
      <Title>{accepted ? 'Puja aceptada' : 'Revisa tu oferta'}</Title>
      <Card style={accepted ? styles.bidAccepted : styles.bidPanel}>
        {accepted ? <Ionicons name="checkmark-circle-outline" size={42} color={colors.success} /> : null}
        <Body muted>Monto de tu oferta</Body>
        <Text style={styles.offer}>{formatCurrency(Number(amount))}</Text>
        <PaymentMethodCard payment={payment} selected />
      </Card>
      {mutation.isError ? (
        <Card style={styles.restricted}>
          <Badge label={restricted ? 'Puja restringida' : 'Puja rechazada'} tone="red" />
          <Title>{insufficientCategory ? 'No puedes pujar' : restricted ? 'No puedes ofertar en este lote' : 'No pudimos registrar la oferta'}</Title>
          <Body muted>{insufficientCategory ? 'Todavía no cuentas con una categoría suficiente para participar en esta subasta.' : mutation.error instanceof Error ? mutation.error.message : 'La puja fue rechazada.'}</Body>
          {restricted && !insufficientCategory ? <Button label="Ver estado de cuenta" variant="secondary" onPress={() => router.push('/profile/account-status')} /> : null}
        </Card>
      ) : null}
      {!accepted ? <Button label={mutation.isPending ? 'Enviando...' : 'Confirmar puja'} disabled={mutation.isPending} onPress={() => mutation.mutate()} /> : (
        <>
          <Button label="Volver a la subasta en vivo" onPress={() => router.replace(`/live/${id}`)} />
          {itemId ? <Button label="Consultar resultado luego" variant="secondary" onPress={() => router.push({ pathname: '/result/[id]', params: { id, itemId } })} /> : null}
        </>
      )}
    </Screen>
  );
}

export function ResultScreen() {
  const router = useRouter();
  const { id, itemId } = useLocalSearchParams<{ id: string; itemId?: string }>();
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['result', id, itemId], queryFn: () => auctionService.result(id, itemId ?? ''), enabled: !!itemId });
  if (!itemId) return <Screen><Header title="Resultado" onBack={() => router.back()} /><EmptyState title="Resultado no disponible" message="Abrí el resultado desde una subasta finalizada." /></Screen>;
  if (isLoading) return <Screen><LoadingState /></Screen>;
  if (isError || !data) return <Screen><Header title="Resultado" onBack={() => router.back()} /><ErrorState onRetry={() => refetch()} /></Screen>;
  if (data.status === 'en_curso') return <Screen><Header title="Resultado" onBack={() => router.back()} /><EmptyState title="Subasta en curso" message="Todavía no se declaró un resultado para este lote." /></Screen>;
  return (
    <Screen style={styles.result}>
      <Ionicons name={data.won ? 'trophy-outline' : 'time-outline'} size={58} color={colors.primary} />
      <Text style={styles.congrats}>{data.won ? 'Ganaste la subasta' : 'La subasta finalizó'}</Text>
      <Body muted>{data.lotName}</Body>
      {data.won ? <Card style={styles.total}>
        <ResultLine label="Monto abonado" value={data.finalAmount != null ? formatCurrency(data.finalAmount) : 'A confirmar'} />
        <ResultLine label="Medio de pago" value={data.paymentMethod ?? 'Ver en Mis compras'} />
        <ResultLine label="Fecha" value={data.date ?? 'A confirmar'} />
      </Card> : data.finalAmount != null ? <Text style={styles.resultItem}>{formatCurrency(data.finalAmount)}</Text> : null}
      <Body muted>{data.won ? 'Consulta el pago y la entrega en Mis compras.' : 'Tu oferta no resultó ganadora.'}</Body>
      {data.won ? <Button label="Ir a Mis compras" onPress={() => router.push('/purchases')} /> : null}
      <Button label="Seguir participando en la subasta" variant="secondary" onPress={() => router.replace(`/live/${id}`)} />
    </Screen>
  );
}

function ResultLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.resultLine}>
      <Body muted>{label}</Body>
      <Text style={styles.resultValue}>{value}</Text>
    </View>
  );
}

export function AuctionFiltersScreen() {
  const router = useRouter();
  const [status, setStatus] = useState('Todas');
  const [category, setCategory] = useState('Todas');
  const [currency, setCurrency] = useState('Todas');
  return (
    <Screen>
      <Header title="Filtros" onBack={() => router.back()} />
      <Title>Filtrar subastas</Title>
      <Body muted>Seleccioná estado, categoría y moneda para encontrar subastas disponibles.</Body>
      <Text style={styles.sectionHeading}>Estado</Text>
      <View style={styles.chips}>{['Todas', 'En vivo', 'Próximas'].map((item) => <Chip key={item} label={item} active={status === item} onPress={() => setStatus(item)} />)}</View>
      <Text style={styles.sectionHeading}>Categoría</Text>
      <View style={styles.chips}>{['Todas', 'Oro', 'Platino', 'Plata', 'Especial', 'Común'].map((item) => <Chip key={item} label={item} active={category === item} onPress={() => setCategory(item)} />)}</View>
      <Text style={styles.sectionHeading}>Moneda</Text>
      <View style={styles.chips}>{['USD', 'ARS'].map((item) => <Chip key={item} label={item} active={currency === item} onPress={() => setCurrency(item)} />)}</View>
      <Button label="Aplicar filtros" onPress={() => router.replace({ pathname: '/(tabs)/auctions', params: { status, category, currency } })} />
      <Button label="Limpiar todo" variant="ghost" onPress={() => { setStatus('Todas'); setCategory('Todas'); setCurrency('Todas'); }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  exploreHero: { minHeight: 84, borderRadius: radius.lg, padding: spacing.lg, backgroundColor: colors.primaryDark, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  heroTitle: { fontSize: typography.heading, color: '#FFF', fontFamily: fonts.bold },
  heroBody: { fontSize: typography.small, color: '#D7D0FF', fontFamily: fonts.regular },
  sellHero: { minHeight: 82, borderRadius: radius.lg, padding: spacing.lg, backgroundColor: colors.primarySoft, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  sellTitle: { fontSize: typography.heading, color: colors.text, fontFamily: fonts.bold },
  heroBodyDark: { fontSize: typography.small, color: colors.textMuted, fontFamily: fonts.regular },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  detailHero: { backgroundColor: colors.surfaceAlt },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.md },
  infoRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  meta: { color: colors.textMuted, fontSize: typography.caption, fontFamily: fonts.regular },
  infoValue: { color: colors.text, fontSize: typography.body, fontFamily: fonts.medium },
  bigNumber: { color: colors.primary, fontSize: 28, fontFamily: fonts.black },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  heroImage: { height: 258, width: '100%', backgroundColor: colors.surfaceAlt, borderRadius: radius.lg },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  priceCard: { backgroundColor: colors.primarySoft },
  price: { fontSize: typography.body, color: colors.text, fontFamily: fonts.black },
  liveBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.dangerSoft, padding: spacing.md, borderRadius: radius.md },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger },
  liveText: { color: colors.danger, fontFamily: fonts.black, flex: 1 },
  timer: { color: colors.danger, fontFamily: fonts.black },
  liveImage: { height: 190, width: '100%', borderRadius: radius.lg },
  bidPanel: { backgroundColor: colors.surfaceAlt },
  noPayment: { backgroundColor: colors.primarySoft },
  restricted: { backgroundColor: colors.dangerSoft, borderColor: colors.danger },
  bidAccepted: { backgroundColor: colors.successSoft, alignItems: 'center' },
  historyCard: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' },
  blockedHome: { alignItems: 'center', marginTop: spacing.huge, backgroundColor: colors.dangerSoft },
  offer: { color: colors.primaryDark, fontFamily: fonts.black, fontSize: typography.title },
  sectionHeading: { color: colors.text, fontFamily: fonts.bold, fontSize: typography.heading },
  bidRow: { borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.md },
  result: { alignItems: 'center', paddingTop: 54 },
  congrats: { color: colors.text, fontFamily: fonts.black, fontSize: 28, textAlign: 'center' },
  resultItem: { color: colors.primary, fontFamily: fonts.bold, fontSize: typography.heading },
  total: { alignSelf: 'stretch' },
  resultLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md },
  resultValue: { color: colors.text, fontFamily: fonts.bold, fontSize: typography.body, textAlign: 'right' },
});
