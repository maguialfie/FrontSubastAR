import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PaymentMethodCard, PurchaseCard, formatCurrency } from '@/components/domain/cards';
import { Badge, Body, Button, Card, ConfirmationModal, EmptyState, ErrorState, Header, Input, LoadingState, Screen, Title } from '@/components/ui/primitives';
import { colors, fonts, radius, spacing, typography } from '@/constants/theme';
import { useSession } from '@/providers/app-provider';
import { assetService, authService, chatService, insuranceService, paymentService, profileService, purchaseService } from '@/services/api';
import type { PaymentMethodKind } from '@/types/domain';

function GuestNotice() {
  const router = useRouter();
  return (
    <Card style={styles.notice}>
      <Ionicons name="lock-closed-outline" size={28} color={colors.primary} />
      <Title>Area personal</Title>
      <Body muted>Inicia sesion para acceder a esta seccion.</Body>
      <Button label="Iniciar sesion" onPress={() => router.push('/login')} />
    </Card>
  );
}

export function ProfileScreen() {
  const router = useRouter();
  const { session, signOut } = useSession();
  const { data: profile, isLoading, isError, refetch } = useQuery({ queryKey: ['profile'], queryFn: profileService.me, enabled: !!session });
  const { data: accountState } = useQuery({ queryKey: ['account-state'], queryFn: profileService.accountState, enabled: !!session });
  if (!session) return <Screen><Header title="Perfil" /><GuestNotice /></Screen>;
  if (isLoading) return <Screen><LoadingState /></Screen>;
  if (isError || !profile) return <Screen><Header title="Perfil" /><ErrorState onRetry={() => refetch()} /></Screen>;
  return (
    <Screen>
      <Header title="Perfil" />
      <Card style={styles.profileCard}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{profile.name[0]}</Text></View>
        <Title>{profile.name}</Title>
        <Body muted>{profile.email}</Body>
        <Badge label={`Categoria ${profile.category}`} />
      </Card>
      {accountState?.status === 'Multado' ? (
        <Card style={styles.problemStatus}>
          <Badge label="Multa pendiente de pago" tone="red" />
          <Body muted>{accountState.message ?? 'Regulariza tu cuenta para volver a participar en subastas.'}</Body>
          {accountState.penalty > 0 ? <Text style={styles.penalty}>{formatCurrency(accountState.penalty)}</Text> : null}
          <Button label="Regularizar cuenta" onPress={() => router.push('/profile/account-status')} />
        </Card>
      ) : null}
      <MenuItem icon="person-outline" label="Datos personales" onPress={() => router.push('/profile/edit')} />
      <MenuItem icon="stats-chart-outline" label="Metricas" onPress={() => router.push('/profile/metrics')} />
      <MenuItem icon="alert-circle-outline" label="Estado de cuenta" onPress={() => router.push('/profile/account-status')} />
      <MenuItem icon="card-outline" label="Medios de pago" onPress={() => router.push('/profile/payments')} />
      <MenuItem icon="cube-outline" label="Mis bienes" onPress={() => router.push('/profile/assets')} />
      <MenuItem icon="bag-check-outline" label="Mis compras" onPress={() => router.push('/purchases')} />
      <Button label="Cerrar sesion" variant="ghost" onPress={async () => {
        try { await authService.logout(); } finally { await signOut(); router.replace('/welcome'); }
      }} />
    </Screen>
  );
}

function MenuItem({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <Card style={styles.menuItem}>
        <Ionicons name={icon} size={21} color={colors.primary} />
        <Text style={styles.menuText}>{label}</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Card>
    </Pressable>
  );
}

export function MetricsScreen() {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['metrics'], queryFn: profileService.metrics });
  if (isLoading) return <Screen><LoadingState /></Screen>;
  if (isError || !data) return <Screen><Header title="Metricas" onBack={() => router.back()} /><ErrorState onRetry={() => refetch()} /></Screen>;
  return (
    <Screen>
      <Header title="Metricas" onBack={() => router.back()} />
      <View style={styles.metricGrid}>
        <Metric value={String(data.participated)} label="Participadas" />
        <Metric value={String(data.won)} label="Ganadas" />
        <Metric value={`${Math.round(data.successRate * 100)}%`} label="Tasa de exito" />
        <Metric value={formatCurrency(data.totalPaid)} label="Total pagado" />
      </View>
      <Card>
        <Title>Ganadas por mes</Title>
        <View style={styles.bars}>
          {data.winsByMonth.map((month) => <View key={month.month} style={[styles.bar, { height: Math.max(10, month.count * 22) }]} />)}
        </View>
        <Body muted>{data.winsByMonth.map((month) => month.month).join('   ') || 'Sin subastas ganadas registradas'}</Body>
      </Card>
    </Screen>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return <Card style={styles.metric}><Text style={styles.metricValue}>{value}</Text><Body muted>{label}</Body></Card>;
}

export function AccountStatusScreen() {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['account-state'], queryFn: profileService.accountState });
  if (isLoading) return <Screen><LoadingState /></Screen>;
  if (isError || !data) return <Screen><Header title="Estado de cuenta" onBack={() => router.back()} /><ErrorState onRetry={() => refetch()} /></Screen>;
  const regular = data.status === 'Regular';
  const blocked = data.status === 'Bloqueado';
  return (
    <Screen>
      <Header title="Estado de cuenta" onBack={() => router.back()} />
      <Card style={regular ? styles.okStatus : styles.problemStatus}>
        <Ionicons name={regular ? 'checkmark-circle-outline' : blocked ? 'lock-closed-outline' : 'alert-circle-outline'} size={38} color={regular ? colors.success : colors.danger} />
        <Title>{regular ? 'Cuenta habilitada' : blocked ? 'Cuenta bloqueada' : 'Perfil multado'}</Title>
        <Body muted>{data.message ?? (regular ? 'Podes participar en subastas, ofertar y publicar bienes.' : 'Regulariza tu situacion para volver a pujar.')}</Body>
        <Badge label={data.status} tone={regular ? 'green' : 'red'} />
        {data.penalty > 0 ? <Text style={styles.penalty}>{formatCurrency(data.penalty)}</Text> : null}
      </Card>
      {!regular ? <Button label="Ver compras pendientes" onPress={() => router.push('/purchases')} /> : <Card>
        <Text style={styles.cardTitle}>Estados contemplados</Text>
        <Body muted>Si existe una multa pendiente o bloqueo, esta pantalla informara el monto y las acciones para regularizarlo.</Body>
      </Card>}
    </Screen>
  );
}

export function PaymentsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedForRemoval, setSelectedForRemoval] = useState<string>();
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['payments'], queryFn: paymentService.list });
  const remove = useMutation({
    mutationFn: paymentService.remove,
    onSuccess: () => {
      setSelectedForRemoval(undefined);
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });
  return (
    <Screen>
      <Header title="Medios de pago" onBack={() => router.back()} />
      {isLoading ? <LoadingState /> : isError ? <ErrorState onRetry={() => refetch()} /> : data?.length ? data.map((payment) => (
        <View key={payment.id} style={styles.paymentRow}>
          <PaymentMethodCard payment={payment} selected={payment.verified} />
          <Button label="Eliminar" variant="ghost" onPress={() => setSelectedForRemoval(payment.id)} />
        </View>
      )) : <EmptyState title="Sin medios de pago" message="Agrega uno para participar de una puja." />}
      <Title>Agregar medio</Title>
      <Button label="Tarjeta de credito" variant="secondary" onPress={() => router.push({ pathname: '/profile/payments/add', params: { type: 'tarjeta_credito' } })} />
      <Button label="Cuenta bancaria" variant="secondary" onPress={() => router.push({ pathname: '/profile/payments/add', params: { type: 'cuenta_bancaria' } })} />
      <Button label="Cheque certificado" variant="secondary" onPress={() => router.push({ pathname: '/profile/payments/add', params: { type: 'cheque_certificado' } })} />
      <ConfirmationModal
        visible={!!selectedForRemoval}
        title="Eliminar medio de pago"
        message="Este medio dejara de estar disponible para futuras pujas y pagos pendientes."
        confirmLabel="Eliminar"
        pending={remove.isPending}
        onClose={() => setSelectedForRemoval(undefined)}
        onConfirm={() => selectedForRemoval && remove.mutate(selectedForRemoval)}
      />
    </Screen>
  );
}

export function AssetsScreen() {
  const router = useRouter();
  const [status, setStatus] = useState('Todos');
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['assets', status], queryFn: () => assetService.list(status) });
  return (
    <Screen>
      <Header title="Mis bienes" onBack={() => router.back()} />
      <View style={styles.filters}>
        {['Todos', 'Pendiente', 'Aceptado', 'Rechazado'].map((item) => (
          <Pressable key={item} style={[styles.filter, status === item && styles.filterActive]} onPress={() => setStatus(item)}>
            <Text style={[styles.filterText, status === item && styles.filterTextActive]}>{item}</Text>
          </Pressable>
        ))}
      </View>
      {isLoading ? <LoadingState /> : isError ? <ErrorState onRetry={() => refetch()} /> : data?.length ? data.map((asset) => (
        <Card key={asset.id}>
          <View style={styles.between}>
            <Text style={styles.cardTitle}>{asset.title}</Text>
            <Badge label={asset.status} tone={asset.status === 'Aceptado' ? 'green' : asset.status === 'Rechazado' ? 'red' : 'yellow'} />
          </View>
          <Body muted>{asset.category} - {asset.detail}</Body>
          <Button label="Ver detalle" variant="secondary" onPress={() => router.push({ pathname: '/profile/assets/[id]', params: { id: asset.id } })} />
        </Card>
      )) : <EmptyState title="Sin bienes en este estado" message="Tus solicitudes apareceran aca al ser registradas." />}
      <Button label="Subir un producto" onPress={() => router.push('/sell')} />
    </Screen>
  );
}

export function PurchasesScreen() {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['purchases'], queryFn: purchaseService.list });
  const sections = data ? [
    { label: 'Pendientes', items: data.filter((purchase) => purchase.paymentStatus.toLowerCase() !== 'pagado') },
    { label: 'En proceso de entrega', items: data.filter((purchase) => purchase.paymentStatus.toLowerCase() === 'pagado' && !['entregado', 'listo_para_retirar'].includes(purchase.deliveryStatus.toLowerCase())) },
    { label: 'Entregadas o listas para retiro', items: data.filter((purchase) => ['entregado', 'listo_para_retirar'].includes(purchase.deliveryStatus.toLowerCase())) },
  ] : [];
  return (
    <Screen>
      <Header title="Mis compras" onBack={() => router.back()} />
      {isLoading ? <LoadingState /> : isError ? <ErrorState onRetry={() => refetch()} /> : data?.length ? sections.map((section) => section.items.length ? (
        <View key={section.label} style={styles.purchaseSection}>
          <Text style={styles.sectionLabel}>{section.label}</Text>
          {section.items.map((purchase) => (
            <PurchaseCard key={purchase.id} purchase={purchase} onPress={() => router.push(`/purchases/${purchase.id}`)} />
          ))}
        </View>
      ) : null) : <EmptyState title="Todavia no hay compras" message="Los lotes ganados apareceran aca." />}
    </Screen>
  );
}

export function PurchaseDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['purchase', id], queryFn: () => purchaseService.get(id ?? '') });
  if (isLoading) return <Screen><LoadingState /></Screen>;
  if (isError || !data) return <Screen><Header title="Detalle de compra" onBack={() => router.back()} /><ErrorState onRetry={() => refetch()} /></Screen>;
  return (
    <Screen>
      <Header title="Detalle de compra" onBack={() => router.back()} />
      <Card>
        <Title>{data.lot.title}</Title>
        <Body muted>{data.auctionName}</Body>
        <SummaryLine label="Valor pujado" value={formatCurrency(data.amount)} />
        <SummaryLine label="Cargos y comision" value={formatCurrency(data.fee)} />
        {data.shippingCost != null ? <SummaryLine label="Envio" value={formatCurrency(data.shippingCost)} /> : null}
        <SummaryLine label="Total" value={formatCurrency(data.total ?? data.amount + data.fee)} bold />
      </Card>
      <Card>
        <Badge label={data.deliveryStatus} tone="green" />
        <Title>Coordinacion de entrega</Title>
        <Body muted>{data.deliveryAddress ?? 'La direccion de entrega se informara cuando este coordinada.'}</Body>
        <Button label="Ver seguimiento de entrega" variant="secondary" onPress={() => router.push(`/purchases/${id}/delivery`)} />
      </Card>
      {data.paymentStatus.toLowerCase() !== 'pagado' ? <Button label="Regularizar pago" onPress={() => router.push(`/purchases/${id}/payment`)} /> : null}
      <Button label="Ver factura" variant="secondary" icon="document-text-outline" onPress={() => router.push(`/purchases/${id}/invoice`)} />
      {data.insuranceId ? (
        <>
          <Card style={styles.policy}>
            <Badge label="Envio cubierto" tone="green" />
            <Body muted>Este lote cuenta con una poliza asociada para la cobertura informada.</Body>
          </Card>
          <Button label="Ver poliza de seguro" onPress={() => router.push(`/policy/${data.insuranceId}`)} />
        </>
      ) : null}
    </Screen>
  );
}

function SummaryLine({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return <View style={styles.between}><Body muted>{label}</Body><Text style={[styles.value, bold && styles.valueBold]}>{value}</Text></View>;
}

export function PurchasePaymentScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [paymentId, setPaymentId] = useState('');
  const { data: purchase, isLoading: loadingPurchase, isError: purchaseError } = useQuery({ queryKey: ['purchase', id], queryFn: () => purchaseService.get(id ?? '') });
  const { data: payments, isLoading: loadingPayments, isError: paymentsError } = useQuery({ queryKey: ['payments'], queryFn: paymentService.list });
  const usablePayments = payments?.filter((payment) => payment.verified) ?? [];
  const pay = useMutation({
    mutationFn: () => purchaseService.regularize(id ?? '', paymentId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['purchase', id] });
      router.replace(`/purchases/${id}`);
    },
  });
  if (loadingPurchase || loadingPayments) return <Screen><LoadingState /></Screen>;
  if (purchaseError || paymentsError || !purchase) return <Screen><Header title="Regularizar pago" onBack={() => router.back()} /><ErrorState /></Screen>;
  return (
    <Screen>
      <Header title="Regularizar pago" onBack={() => router.back()} />
      <Card>
        <Title>{purchase.lot.title}</Title>
        <SummaryLine label="Monto a regularizar" value={formatCurrency(purchase.total ?? purchase.amount + purchase.fee)} bold />
        <Body muted>Selecciona un medio verificado para confirmar el pago pendiente.</Body>
      </Card>
      {usablePayments.length ? usablePayments.map((payment) => (
        <Pressable key={payment.id} onPress={() => setPaymentId(payment.id)}>
          <PaymentMethodCard payment={payment} selected={paymentId === payment.id} />
        </Pressable>
      )) : (
        <EmptyState title="Sin medios habilitados" message="Agrega o verifica un medio de pago antes de regularizar la compra." />
      )}
      <Button label={pay.isPending ? 'Confirmando pago...' : 'Confirmar pago'} disabled={!paymentId || pay.isPending} onPress={() => pay.mutate()} />
      {!usablePayments.length ? <Button label="Agregar medio de pago" variant="secondary" onPress={() => router.push('/profile/payments')} /> : null}
      {pay.isError ? <Body muted>{pay.error instanceof Error ? pay.error.message : 'No fue posible regularizar el pago.'}</Body> : null}
    </Screen>
  );
}

export function DeliveryScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['purchase', id], queryFn: () => purchaseService.get(id ?? '') });
  if (isLoading) return <Screen><LoadingState /></Screen>;
  if (isError || !data) return <Screen><Header title="Entrega" onBack={() => router.back()} /><ErrorState onRetry={() => refetch()} /></Screen>;
  const status = data.deliveryStatus.toLowerCase();
  const ready = status === 'listo_para_retirar';
  const moving = status === 'en_camino';
  const delivered = status === 'entregado';
  const title = ready ? 'Listo para retirar' : moving ? 'Envio en camino' : delivered ? 'Entrega completada' : 'Coordinacion de entrega';
  const text = ready
    ? data.deliveryAddress ?? 'Acercate al deposito indicado con tu comprobante de compra.'
    : moving
      ? 'Tu lote se encuentra en traslado. Recibiras novedades cuando llegue a destino.'
      : delivered
        ? 'La entrega fue registrada correctamente.'
        : data.deliveryAddress ?? 'Estamos coordinando la direccion y modalidad de entrega.';
  return (
    <Screen>
      <Header title="Entrega" onBack={() => router.back()} />
      <Card style={data.insuranceId ? styles.policy : undefined}>
        <Ionicons name={ready ? 'location-outline' : moving ? 'car-outline' : delivered ? 'checkmark-circle-outline' : 'time-outline'} size={38} color={colors.primary} />
        <Badge label={data.deliveryStatus} tone={delivered || ready ? 'green' : 'purple'} />
        <Title>{title}</Title>
        <Body muted>{text}</Body>
      </Card>
      {data.insuranceId ? (
        <Card style={styles.policy}>
          <Badge label="Envio cubierto" tone="green" />
          <Body muted>La cobertura asociada al lote acompana esta entrega.</Body>
          <Button label="Ver poliza" variant="secondary" onPress={() => router.push(`/policy/${data.insuranceId}`)} />
        </Card>
      ) : null}
      <Button label="Volver al detalle" onPress={() => router.back()} />
    </Screen>
  );
}

export function InvoiceScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['invoice-content', id],
    queryFn: () => purchaseService.invoiceContent(id ?? ''),
  });
  if (isLoading) return <Screen><LoadingState /></Screen>;
  if (isError || !data) return <Screen><Header title="Factura" onBack={() => router.back()} /><ErrorState onRetry={() => refetch()} /></Screen>;
  return (
    <Screen>
      <Header title="Factura" onBack={() => router.back()} />
      <Card style={styles.policy}>
        <Ionicons name="document-text-outline" size={36} color={colors.primary} />
        <Title>Comprobante de compra</Title>
        <Body muted>Factura emitida por SubastAR</Body>
      </Card>
      <Card>
        <Text style={styles.invoiceText}>{data}</Text>
      </Card>
    </Screen>
  );
}

export function PolicyScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['policy', id], queryFn: () => insuranceService.get(id ?? '') });
  if (isLoading) return <Screen><LoadingState /></Screen>;
  if (isError || !data) return <Screen><Header title="Poliza de seguro" onBack={() => router.back()} /><ErrorState onRetry={() => refetch()} /></Screen>;
  return (
    <Screen>
      <Header title="Poliza de seguro" onBack={() => router.back()} />
      <Card style={styles.policy}>
        <Ionicons name="shield-checkmark-outline" size={36} color={colors.primary} />
        <Title>{data.company}</Title>
        <Body muted>Poliza {data.number} - Vigente hasta {data.validUntil ?? 'sin fecha informada'}</Body>
        <SummaryLine label="Valor asegurado" value={formatCurrency(data.insuredValue)} bold />
        <SummaryLine label="Cobertura" value={data.coverage ?? 'Sin detalle'} />
      </Card>
      <Card>
        <Text style={styles.cardTitle}>Piezas cubiertas</Text>
        {data.items.length ? data.items.map((item) => <Body key={item} muted>{item}</Body>) : <Body muted>No hay detalle de piezas informado.</Body>}
      </Card>
      <Card>
        <Text style={styles.cardTitle}>Contacto aseguradora</Text>
        <Body muted>{data.contact?.phone ?? 'Telefono no informado'}</Body>
        <Body muted>{data.contact?.email ?? 'Correo no informado'}</Body>
      </Card>
      <Button label="Ampliar cobertura" onPress={() => router.push(`/policy/${id}/extend` as Href)} />
      <Button label="Ver contacto completo" variant="secondary" onPress={() => router.push(`/policy/${id}/contact` as Href)} />
    </Screen>
  );
}

export function ExtendPolicyScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [newValue, setNewValue] = useState('');
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['policy', id], queryFn: () => insuranceService.get(id ?? '') });
  const extend = useMutation({
    mutationFn: () => insuranceService.extend(id ?? '', Number(newValue)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['policy', id] }),
  });
  if (isLoading) return <Screen><LoadingState /></Screen>;
  if (isError || !data) return <Screen><Header title="Ampliar poliza" onBack={() => router.back()} /><ErrorState onRetry={() => refetch()} /></Screen>;
  return (
    <Screen>
      <Header title="Ampliar poliza" onBack={() => router.back()} />
      <Card style={styles.policy}>
        <Title>Solicitar mayor cobertura</Title>
        <SummaryLine label="Cobertura actual" value={formatCurrency(data.insuredValue)} bold />
        <Body muted>Ingresa un valor superior al actual para solicitar la ampliacion.</Body>
      </Card>
      <Input label="Nuevo valor asegurado" keyboardType="number-pad" value={newValue} onChangeText={setNewValue} />
      <Button label={extend.isPending ? 'Solicitando...' : 'Confirmar solicitud'} disabled={!newValue || Number(newValue) <= data.insuredValue || extend.isPending} onPress={() => extend.mutate()} />
      {extend.isSuccess ? <Card style={styles.okStatus}><Badge label="Solicitud registrada" tone="green" /><Body muted>La nueva cobertura fue actualizada correctamente.</Body></Card> : null}
      {extend.isError ? <Body muted>{extend.error instanceof Error ? extend.error.message : 'No fue posible ampliar la cobertura.'}</Body> : null}
    </Screen>
  );
}

export function PolicyContactScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['policy', id], queryFn: () => insuranceService.get(id ?? '') });
  if (isLoading) return <Screen><LoadingState /></Screen>;
  if (isError || !data) return <Screen><Header title="Contacto compania" onBack={() => router.back()} /><ErrorState onRetry={() => refetch()} /></Screen>;
  return (
    <Screen>
      <Header title="Contacto compania" onBack={() => router.back()} />
      <Card style={styles.policy}>
        <Ionicons name="shield-checkmark-outline" size={36} color={colors.primary} />
        <Title>{data.company}</Title>
        <Body muted>Poliza {data.number}</Body>
      </Card>
      <Card>
        <SummaryLine label="Telefono" value={data.contact?.phone ?? 'No informado'} />
        <SummaryLine label="Correo" value={data.contact?.email ?? 'No informado'} />
        <SummaryLine label="Web" value={data.contact?.web ?? 'No informada'} />
      </Card>
      <Button label="Volver a la poliza" onPress={() => router.back()} />
    </Screen>
  );
}

export function ChatsScreen() {
  const router = useRouter();
  const { session } = useSession();
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['chats'], queryFn: chatService.conversations, enabled: !!session });
  return (
    <Screen>
      <Header title="Chats" />
      {!session ? <GuestNotice /> : isLoading ? <LoadingState /> : isError ? <ErrorState onRetry={() => refetch()} /> : data?.length ? data.map((chat) => (
        <Card key={chat.id} style={styles.chatRow}>
          <View style={styles.chatIcon}><Ionicons name="chatbubble-outline" size={20} color={colors.primary} /></View>
          <View style={styles.flex}>
            <Text style={styles.cardTitle}>{chat.name}</Text>
            <Body muted>{chat.lastMessage}</Body>
          </View>
          {chat.unread ? <Badge label={String(chat.unread)} /> : null}
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} onPress={() => router.push(`/chat/${chat.id}`)} />
        </Card>
      )) : <EmptyState title="Sin conversaciones" message="Tus consultas y notificaciones apareceran aca." />}
    </Screen>
  );
}

export function ConversationScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['messages', id], queryFn: () => chatService.messages(id ?? 'bot') });
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const send = useMutation({
    mutationFn: () => chatService.send(id ?? 'bot', message),
    onSuccess: () => { setMessage(''); queryClient.invalidateQueries({ queryKey: ['messages', id] }); },
  });
  const title = id === 'soporte' ? 'Soporte SubastAR' : id === 'poliza' ? 'Consultas de seguro' : 'Asistente SubastAR';
  return (
    <Screen>
      <Header title={title} onBack={() => router.back()} />
      {isLoading ? <LoadingState /> : isError ? <ErrorState onRetry={() => refetch()} /> : data?.map((message) => (
        <View key={message.id} style={[styles.bubble, message.author === 'user' && styles.userBubble]}>
          <Text style={[styles.message, message.author === 'user' && styles.userMessage]}>{message.text}</Text>
          <Text style={[styles.time, message.author === 'user' && styles.userTime]}>{message.time}</Text>
        </View>
      ))}
      <View style={styles.compose}>
        <Input placeholder="Escribe tu consulta..." value={message} onChangeText={setMessage} />
        <Button label={send.isPending ? 'Enviando...' : 'Enviar'} disabled={!message.trim() || send.isPending} onPress={() => send.mutate()} />
      </View>
      {send.isError ? <Body muted>{send.error instanceof Error ? send.error.message : 'No fue posible enviar el mensaje.'}</Body> : null}
    </Screen>
  );
}

export function EditProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['profile'], queryFn: profileService.me });
  const [address, setAddress] = useState('');
  const [country, setCountry] = useState('');
  const save = useMutation({
    mutationFn: () => profileService.update({ address: address || data?.address, country: country || data?.country }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['profile'] }); router.back(); },
  });
  if (isLoading) return <Screen><LoadingState /></Screen>;
  if (isError || !data) return <Screen><Header title="Datos personales" onBack={() => router.back()} /><ErrorState onRetry={() => refetch()} /></Screen>;
  return (
    <Screen>
      <Header title="Datos personales" onBack={() => router.back()} />
      <Title>{data.name}</Title>
      <Input label="Email" value={data.email} editable={false} />
      <Input label="DNI" value={data.dni ?? ''} editable={false} />
      <Input label="Domicilio" value={address || (data.address ?? '')} onChangeText={setAddress} />
      <Input label="Pais de origen" value={country || (data.country ?? '')} onChangeText={setCountry} />
      <Button label={save.isPending ? 'Guardando...' : 'Guardar cambios'} disabled={save.isPending} onPress={() => save.mutate()} />
      {save.isError ? <Body muted>{save.error instanceof Error ? save.error.message : 'No fue posible guardar.'}</Body> : null}
    </Screen>
  );
}

export function PaymentAddScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { type, onboarding, returnTo } = useLocalSearchParams<{ type?: PaymentMethodKind; onboarding?: string; returnTo?: string }>();
  const kind = type ?? 'tarjeta_credito';
  const [bank, setBank] = useState('');
  const [country, setCountry] = useState('Argentina');
  const [identifier, setIdentifier] = useState('');
  const [amount, setAmount] = useState('');
  const [holder, setHolder] = useState('');
  const [expiry, setExpiry] = useState('');
  const [security, setSecurity] = useState('');
  const [dni, setDni] = useState('');
  const [photo, setPhoto] = useState<{ uri: string; name: string; type: string; file?: Blob }>();
  const save = useMutation({
    mutationFn: () => paymentService.create({
      type: kind, bankName: bank, bankCountry: country, cbuIban: kind === 'cuenta_bancaria' ? identifier : undefined,
      reservedFunds: amount, cardNumber: kind === 'tarjeta_credito' ? identifier : undefined, holder, expiry,
      securityCode: security, holderDni: dni, issuerBank: bank, certifiedAmount: amount,
      chequeNumber: kind === 'cheque_certificado' ? identifier : undefined, chequePhoto: photo,
    }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['payments'] }); router.replace(onboarding ? { pathname: '/payment-success', params: { returnTo, type: kind } } : '/profile/payments'); },
  });
  async function pickCheque() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!result.canceled) {
      const asset = result.assets[0];
      setPhoto({ uri: asset.uri, name: asset.fileName ?? 'cheque.jpg', type: asset.mimeType ?? 'image/jpeg', file: asset.file });
    }
  }
  const label = kind === 'tarjeta_credito' ? 'Tarjeta de credito' : kind === 'cuenta_bancaria' ? 'Cuenta bancaria' : 'Cheque certificado';
  const canSave = kind === 'tarjeta_credito'
    ? !!identifier && !!holder && !!dni && !!expiry && !!security
    : kind === 'cuenta_bancaria'
      ? !!bank && !!country && !!identifier && Number(amount) > 0
      : !!bank && !!identifier && Number(amount) > 0 && !!photo;
  return (
    <Screen>
      <Header title={label} onBack={() => router.back()} />
      <Title>Agregar {label.toLowerCase()}</Title>
      {kind !== 'tarjeta_credito' ? <Input label="Banco" value={bank} onChangeText={setBank} /> : null}
      {kind === 'cuenta_bancaria' ? <Input label="Pais del banco" value={country} onChangeText={setCountry} /> : null}
      <Input label={kind === 'tarjeta_credito' ? 'Numero de tarjeta' : kind === 'cuenta_bancaria' ? 'CBU / IBAN' : 'Numero de cheque'} value={identifier} onChangeText={setIdentifier} />
      {kind === 'tarjeta_credito' ? <>
        <Input label="Titular" value={holder} onChangeText={setHolder} />
        <Input label="DNI titular" value={dni} onChangeText={setDni} />
        <Input label="Vencimiento" value={expiry} onChangeText={setExpiry} />
        <Input label="Codigo de seguridad" secureTextEntry value={security} onChangeText={setSecurity} />
      </> : <Input label={kind === 'cuenta_bancaria' ? 'Fondos reservados' : 'Monto certificado'} value={amount} keyboardType="number-pad" onChangeText={setAmount} />}
      {kind === 'cheque_certificado' ? <Button label={photo ? 'Foto cargada' : 'Fotografiar cheque'} variant="secondary" onPress={pickCheque} /> : null}
      <Button label={save.isPending ? 'Guardando...' : 'Guardar medio de pago'} disabled={!canSave || save.isPending} onPress={() => save.mutate()} />
      {save.isError ? <Body muted>{save.error instanceof Error ? save.error.message : 'No fue posible agregar el medio.'}</Body> : null}
    </Screen>
  );
}

export function PaymentSuccessScreen() {
  const router = useRouter();
  const { returnTo, type } = useLocalSearchParams<{ returnTo?: string; type?: PaymentMethodKind }>();
  const chequePending = type === 'cheque_certificado';
  return (
    <Screen style={styles.successScreen}>
      <Ionicons name={chequePending ? 'time-outline' : 'checkmark-circle-outline'} size={58} color={chequePending ? colors.primary : colors.success} />
      <Title>{chequePending ? 'Cheque enviado a revision' : 'Medio de pago agregado'}</Title>
      <Body muted>{chequePending ? 'Validaremos la documentacion. El cheque se habilitara para pujas cuando sea aprobado.' : 'Ya podes utilizarlo para participar en las subastas disponibles.'}</Body>
      <Button label={returnTo ? 'Continuar' : 'Ir al inicio'} onPress={() => router.replace((returnTo || '/(tabs)') as Href)} />
    </Screen>
  );
}

export function AssetDetailScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['asset', id], queryFn: () => assetService.get(id ?? '') });
  const accept = useMutation({
    mutationFn: (accepted: boolean) => assetService.acceptConditions(id ?? '', accepted),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['asset', id] });
    },
  });
  if (isLoading) return <Screen><LoadingState /></Screen>;
  if (isError || !data) return <Screen><Header title="Detalle del bien" onBack={() => router.back()} /><ErrorState onRetry={() => refetch()} /></Screen>;
  return (
    <Screen>
      <Header title="Detalle del bien" onBack={() => router.back()} />
      <Card>
        <Badge label={data.status} tone={data.status === 'Aceptado' ? 'green' : data.status === 'Rechazado' ? 'red' : 'yellow'} />
        <Title>{data.title}</Title>
        <Body muted>{data.detail}</Body>
        {data.basePrice != null ? <SummaryLine label="Precio base" value={formatCurrency(data.basePrice)} /> : null}
        {data.commission != null ? <SummaryLine label="Comision" value={formatCurrency(data.commission)} /> : null}
        {data.depositLocation ? <SummaryLine label="Deposito" value={data.depositLocation} /> : null}
      </Card>
      {data.status === 'Aceptado' ? <>
        <Button label="Aceptar condiciones" onPress={() => accept.mutate(true)} />
        <Button label="Rechazar condiciones" variant="secondary" onPress={() => accept.mutate(false)} />
      </> : null}
      {accept.isSuccess ? <Card style={styles.okStatus}><Badge label="Respuesta enviada" tone="green" /><Body muted>Registramos tu decision sobre las condiciones del bien.</Body></Card> : null}
      {accept.isError ? <Body muted>{accept.error instanceof Error ? accept.error.message : 'No fue posible registrar la decision.'}</Body> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  notice: { alignItems: 'center', marginTop: spacing.huge },
  profileCard: { alignItems: 'center', backgroundColor: colors.surfaceAlt },
  avatar: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  avatarText: { fontFamily: fonts.black, fontSize: 28, color: colors.primary },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md },
  menuText: { flex: 1, color: colors.text, fontFamily: fonts.medium },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  metric: { width: '47%' },
  metricValue: { color: colors.primary, fontFamily: fonts.black, fontSize: typography.heading },
  bars: { height: 105, flexDirection: 'row', gap: spacing.md, alignItems: 'flex-end', justifyContent: 'center' },
  bar: { width: 22, borderRadius: radius.sm, backgroundColor: colors.primary },
  okStatus: { alignItems: 'center', backgroundColor: colors.successSoft },
  problemStatus: { alignItems: 'center', backgroundColor: colors.dangerSoft },
  penalty: { color: colors.danger, fontSize: typography.title, fontFamily: fonts.black },
  cardTitle: { color: colors.text, fontSize: typography.body, fontFamily: fonts.bold },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md },
  value: { color: colors.text, fontSize: typography.body, fontFamily: fonts.regular },
  valueBold: { fontFamily: fonts.black, color: colors.primaryDark },
  policy: { backgroundColor: colors.primarySoft },
  invoiceText: { fontFamily: fonts.regular, color: colors.text, lineHeight: 24 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  filter: { borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.surfaceAlt },
  filterActive: { backgroundColor: colors.primarySoft },
  filterText: { color: colors.textMuted, fontFamily: fonts.medium, fontSize: typography.small },
  filterTextActive: { color: colors.primary },
  purchaseSection: { gap: spacing.md },
  sectionLabel: { color: colors.textMuted, fontSize: typography.small, fontFamily: fonts.bold, textTransform: 'uppercase' },
  chatRow: { flexDirection: 'row', alignItems: 'center' },
  paymentRow: { gap: spacing.xs },
  chatIcon: { width: 42, height: 42, backgroundColor: colors.primarySoft, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  bubble: { maxWidth: '84%', alignSelf: 'flex-start', padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surfaceAlt, gap: spacing.xs },
  userBubble: { alignSelf: 'flex-end', backgroundColor: colors.primary },
  message: { color: colors.text, fontSize: typography.body, fontFamily: fonts.regular },
  userMessage: { color: '#FFF' },
  time: { color: colors.textMuted, fontSize: typography.caption, fontFamily: fonts.regular },
  userTime: { color: '#DED9FF' },
  compose: { marginTop: spacing.lg, gap: spacing.sm },
  successScreen: { alignItems: 'center', paddingTop: 70 },
});
