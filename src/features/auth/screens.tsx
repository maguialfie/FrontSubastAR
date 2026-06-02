import { zodResolver } from '@hookform/resolvers/zod';
import * as ImagePicker from 'expo-image-picker';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';

import { BrandLogo } from '@/components/brand/logo';
import { ActionRow, Body, Button, Card, Header, InfoTile, Input, Screen, SectionLabel, StatusPanel, StepIndicator, Title, UploadBox } from '@/components/ui/primitives';
import { colors, fonts, spacing, typography } from '@/constants/theme';
import { useSafeBack } from '@/hooks/use-safe-back';
import { useSession } from '@/providers/app-provider';
import { authService } from '@/services/api';
import type { FileUpload } from '@/types/domain';

function ErrorNotice({ message }: { message: string }) {
  return (
    <Card style={styles.errorCard}>
      <Text style={styles.error}>{message}</Text>
    </Card>
  );
}

const loginSchema = z.object({
  email: z.email('Ingresá un correo válido.'),
  password: z.string().min(6, 'Mínimo 6 caracteres.'),
});
const login2faSchema = z.object({
  code: z.string().min(4, 'Ingresá el código recibido.').max(8, 'Código demasiado largo.'),
});

const registerSchema = z.object({
  name: z.string().min(2, 'Ingresa tu nombre.'),
  surname: z.string().min(2, 'Ingresa tu apellido.'),
  email: z.email('Correo inválido.'),
  address: z.string().min(5, 'Ingresa tu domicilio.'),
  country: z.string().min(2, 'Ingresá tu país.'),
});

const verifySchema = z.object({ code: z.string().min(4, 'Ingresá el código recibido.') });
const passwordSchema = z.object({
  password: z.string().min(8, 'Mínimo 8 caracteres.'),
  confirmation: z.string().min(8, 'Confirmá tu contraseña.'),
}).refine((values) => values.password === values.confirmation, { path: ['confirmation'], message: 'Las contraseñas no coinciden.' });

const registrationSteps = ['Datos', 'Código', 'Clave', 'Pago'];

export function SplashScreen() {
  const router = useRouter();
  const { loading, session } = useSession();
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => router.replace(session ? '/(tabs)' : '/welcome'), 800);
      return () => clearTimeout(timer);
    }
  }, [loading, router, session]);
  return (
    <Screen scroll={false} style={styles.splash}>
      <Card style={styles.splashCard}>
        <BrandLogo iconSize={112} />
        <Body muted>Subastas online con una experiencia premium, clara y confiable.</Body>
      </Card>
    </Screen>
  );
}

export function WelcomeScreen() {
  const router = useRouter();
  const { enterAsGuest } = useSession();
  return (
    <Screen style={styles.welcome}>
      <Card style={styles.welcomeHero}>
        <BrandLogo iconSize={88} />
        <View style={styles.centerCopy}>
          <Title>Descubrí objetos únicos</Title>
          <Body muted>Explorá subastas seleccionadas, pujás con respaldo operativo y gestionás tus compras desde un entorno seguro.</Body>
        </View>
        <View style={styles.tileRow}>
          <InfoTile icon="shield-checkmark-outline" label="Cuenta" value="Validación segura" />
          <InfoTile icon="hammer-outline" label="Subastas" value="Pujas en vivo" />
        </View>
      </Card>
      <Card style={styles.actionsCard}>
        <Button label="Iniciar sesión" onPress={() => router.push('/login')} />
        <Button label="Crear cuenta" variant="secondary" onPress={() => router.push('/register')} />
        <Button label="Continuar como invitado" variant="ghost" onPress={() => { enterAsGuest(); router.replace('/(tabs)'); }} />
      </Card>
    </Screen>
  );
}

export function LoginScreen() {
  const router = useRouter();
  const back = useSafeBack();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const { enterAsGuest } = useSession();
  const [apiError, setApiError] = useState('');
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });
  const submit = handleSubmit(async (values) => {
    try {
      setApiError('');
      const response = await authService.login(values.email, values.password);
      router.push({
        pathname: '/login-2fa',
        params: {
          challengeId: response.challengeId,
          email: response.email,
          message: response.message,
          returnTo: returnTo || '/(tabs)',
        },
      });
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'No fue posible ingresar.');
    }
  });
  return (
    <Screen>
      <Header title="Iniciar sesión" onBack={back} />
      <Card style={styles.formCard}>
        <Title>Bienvenido, qué bueno verte otra vez</Title>
        <StatusPanel icon="lock-closed-outline" title="Acceso seguro" message="Ingresá para pujar, vender bienes, revisar compras y administrar tus medios de pago." />
        <Controller control={control} name="email" render={({ field: { onChange, value } }) => (
          <Input label="Correo electrónico" keyboardType="email-address" autoCapitalize="none" value={value} onChangeText={onChange} error={errors.email?.message} />
        )} />
        <Controller control={control} name="password" render={({ field: { onChange, value } }) => (
          <Input label="Contraseña" secureTextEntry value={value} onChangeText={onChange} error={errors.password?.message} />
        )} />
        {apiError ? <ErrorNotice message={apiError} /> : null}
        <Button label={isSubmitting ? 'Ingresando...' : 'Iniciar sesión'} disabled={isSubmitting} onPress={submit} />
        <Button label="¿No tienes una cuenta? Regístrate" variant="ghost" onPress={() => router.push({ pathname: '/register', params: { returnTo } })} />
        <View style={styles.centerSeparator}><Body muted>O</Body></View>
        <Button label="Continúa como un invitado" variant="ghost" onPress={() => { enterAsGuest(); router.replace('/(tabs)'); }} />
      </Card>
    </Screen>
  );
}

export function LoginTwoFactorScreen() {
  const router = useRouter();
  const back = useSafeBack();
  const { challengeId, email, message, returnTo } = useLocalSearchParams<{ challengeId?: string; email?: string; message?: string; returnTo?: string }>();
  const { signIn } = useSession();
  const [currentChallengeId, setCurrentChallengeId] = useState(challengeId ?? '');
  const [currentEmail, setCurrentEmail] = useState(email ?? '');
  const [apiError, setApiError] = useState('');
  const [infoMessage, setInfoMessage] = useState(message ?? '');
  const [isResending, setIsResending] = useState(false);
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof login2faSchema>>({
    resolver: zodResolver(login2faSchema),
    defaultValues: { code: '' },
  });
  const submit = handleSubmit(async ({ code }) => {
    if (!currentChallengeId) {
      setApiError('No se encontró el desafío de seguridad. Volvé a iniciar sesión.');
      return;
    }
    try {
      setApiError('');
      const session = await authService.verifyLogin2fa(currentChallengeId, code);
      await signIn(session);
      router.replace((returnTo || '/(tabs)') as Href);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Código inválido.');
    }
  });
  async function resend() {
    if (!currentChallengeId) {
      setApiError('No se encontró el desafío de seguridad. Volvé a iniciar sesión.');
      return;
    }
    try {
      setApiError('');
      setIsResending(true);
      const response = await authService.resendLogin2fa(currentChallengeId);
      setCurrentChallengeId(response.challengeId);
      setCurrentEmail(response.email);
      setInfoMessage('Te enviamos un nuevo código. El código anterior ya no es válido.');
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'No fue posible reenviar el código.');
    } finally {
      setIsResending(false);
    }
  }
  return (
    <Screen>
      <Header title="Verificación de acceso" onBack={back} />
      <Card style={styles.formCard}>
        <StatusPanel
          icon="mail-unread-outline"
          title="Revisá tu correo"
          message={`Enviamos un código de seguridad a ${currentEmail || 'tu correo'}. Ingresalo para completar el inicio de sesión.`}
          tone="green"
        />
        <Controller control={control} name="code" render={({ field }) => (
          <Input label="Código de verificación" placeholder="000000" keyboardType="number-pad" value={field.value} onChangeText={field.onChange} error={errors.code?.message} />
        )} />
        {infoMessage ? <Card style={styles.infoCard}><Body>{infoMessage}</Body></Card> : null}
        {apiError ? <ErrorNotice message={apiError} /> : null}
        <Button label={isSubmitting ? 'Verificando...' : 'Verificar código'} disabled={isSubmitting || isResending} onPress={submit} />
        <Button label={isResending ? 'Reenviando...' : 'Reenviar código'} variant="secondary" disabled={isSubmitting || isResending} onPress={resend} />
        <Button label="Volver al login" variant="ghost" onPress={() => router.replace('/login')} />
      </Card>
    </Screen>
  );
}

export function RegisterScreen() {
  const router = useRouter();
  const goBack = useSafeBack();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const { setRegistration } = useSession();
  const [front, setFront] = useState<FileUpload>();
  const [backImage, setBackImage] = useState<FileUpload>();
  const [apiError, setApiError] = useState('');
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', surname: '', email: '', address: '', country: 'Argentina' },
  });
  async function pick(side: 'front' | 'back') {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!result.canceled) {
      const asset = result.assets[0];
      const upload: FileUpload = {
        uri: asset.uri,
        name: asset.fileName ?? `dni-${side}-${Date.now()}.jpg`,
        type: asset.mimeType ?? 'image/jpeg',
        file: asset.file,
      };
      if (side === 'front') setFront(upload);
      else setBackImage(upload);
    }
  }
  const submit = handleSubmit(async (values) => {
    if (!front || !backImage) {
      setApiError('Adjunta frente y dorso del DNI.');
      return;
    }
    try {
      setApiError('');
      await authService.register({ ...values, front, back: backImage });
      setRegistration({ email: values.email, returnTo });
      router.push('/registration-pending' as Href);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'No fue posible enviar tu registro.');
    }
  });
  return (
    <Screen>
      <Header title="Crear cuenta" subtitle="Paso 1 de 4" onBack={goBack} />
      <Card style={styles.formCard}>
        <StepIndicator steps={registrationSteps} current={0} />
        <Title>Datos personales</Title>
        <Body muted>Usamos estos datos para validar tu identidad antes de habilitar pujas y operaciones de venta.</Body>
        <Controller control={control} name="name" render={({ field }) => <Input label="Nombre" value={field.value} onChangeText={field.onChange} error={errors.name?.message} />} />
        <Controller control={control} name="surname" render={({ field }) => <Input label="Apellido" value={field.value} onChangeText={field.onChange} error={errors.surname?.message} />} />
        <Controller control={control} name="email" render={({ field }) => <Input label="Mail" value={field.value} onChangeText={field.onChange} keyboardType="email-address" error={errors.email?.message} />} />
        <Controller control={control} name="address" render={({ field }) => <Input label="Domicilio legal" value={field.value} onChangeText={field.onChange} error={errors.address?.message} />} />
        <Controller control={control} name="country" render={({ field }) => <Input label="País de origen" value={field.value} onChangeText={field.onChange} error={errors.country?.message} />} />
        <SectionLabel>Documento de identidad</SectionLabel>
        <View style={styles.uploadRow}>
          <UploadAction label="Frente" done={!!front} onPress={() => pick('front')} />
          <UploadAction label="Dorso" done={!!backImage} onPress={() => pick('back')} />
        </View>
        {apiError ? <ErrorNotice message={apiError} /> : null}
        <Button label={isSubmitting ? 'Enviando...' : 'Crear cuenta'} disabled={isSubmitting} onPress={submit} />
        <Button label="¿Ya tienes una cuenta? Iniciá sesión" variant="ghost" onPress={() => router.push({ pathname: '/login', params: { returnTo } })} />
      </Card>
    </Screen>
  );
}

function UploadAction({ label, done, onPress }: { label: string; done: boolean; onPress: () => void }) {
  return <UploadBox label={label} description={done ? 'Imagen cargada' : 'Subir foto'} done={done} icon="camera-outline" onPress={onPress} />;
}

export function RegistrationPendingScreen() {
  const router = useRouter();
  const { registration } = useSession();
  return (
    <Screen style={styles.pending}>
      <Card style={styles.formCard}>
        <StatusPanel icon="mail-unread-outline" title="Solicitud enviada" message="Recibimos tus datos y las imágenes del DNI. Cuando tu cuenta sea aprobada, recibirás el código por correo." tone="green" />
        {registration?.email ? <Text style={styles.pendingEmail}>{registration.email}</Text> : null}
        <Button label="Ya recibí mi código" onPress={() => router.push('/verify')} />
        <Button label="Volver al acceso" variant="ghost" onPress={() => router.replace('/welcome')} />
      </Card>
    </Screen>
  );
}

export function VerifyScreen() {
  const router = useRouter();
  const back = useSafeBack();
  const { registration, setRegistration } = useSession();
  const [apiError, setApiError] = useState('');
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof verifySchema>>({
    resolver: zodResolver(verifySchema), defaultValues: { code: '' },
  });
  const submit = handleSubmit(async ({ code }) => {
    if (!registration?.email) {
      setApiError('Volvé a registro para indicar el correo.');
      return;
    }
    try {
      const response = await authService.verify(registration.email, code);
      setRegistration({ ...registration, verificationToken: response.token_verificacion });
      router.push('/password');
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Código inválido.');
    }
  });
  return (
    <Screen>
      <Header title="Verifica el código" subtitle="Paso 2 de 4" onBack={back} />
      <Card style={styles.formCard}>
        <StepIndicator steps={registrationSteps} current={1} />
        <StatusPanel icon="mail-outline" title="Código de verificación" message="Ingresá el código enviado por correo para continuar con la creación de tu cuenta." />
        {registration?.email ? <Text style={styles.pendingEmail}>{registration.email}</Text> : null}
        <Controller control={control} name="code" render={({ field }) => <Input label="Código de verificación" placeholder="0000" keyboardType="number-pad" value={field.value} onChangeText={field.onChange} error={errors.code?.message} />} />
        {apiError ? <ErrorNotice message={apiError} /> : null}
        <Body muted>¿No recibiste el código?</Body>
        <Button label="Reenviar" variant="ghost" onPress={() => setApiError('La opción de reenvío todavía no está disponible.')} />
        <Button label={isSubmitting ? 'Verificando...' : 'Verificar'} disabled={isSubmitting} onPress={submit} />
      </Card>
    </Screen>
  );
}

export function PasswordScreen() {
  const router = useRouter();
  const back = useSafeBack();
  const { registration, signIn, setRegistration } = useSession();
  const [apiError, setApiError] = useState('');
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema), defaultValues: { password: '', confirmation: '' },
  });
  const submit = handleSubmit(async (values) => {
    if (!registration?.verificationToken) {
      setApiError('Primero verificá el código de correo.');
      return;
    }
    try {
      const session = await authService.completeRegistration(registration.verificationToken, values.password, values.confirmation);
      await signIn(session);
      setRegistration(null);
      router.push({ pathname: '/onboarding-payment', params: { returnTo: registration.returnTo } });
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'No fue posible completar el registro.');
    }
  });
  return (
    <Screen>
      <Header title="Seguridad" subtitle="Paso 3 de 4" onBack={back} />
      <Card style={styles.formCard}>
        <StepIndicator steps={registrationSteps} current={2} />
        <Title>Crea tu contraseña</Title>
        <Body muted>Elegí una contraseña segura para proteger tus pujas, compras y documentación.</Body>
        <Controller control={control} name="password" render={({ field }) => <Input label="Contraseña" secureTextEntry value={field.value} onChangeText={field.onChange} error={errors.password?.message} />} />
        <Controller control={control} name="confirmation" render={({ field }) => <Input label="Confirma tu contraseña" secureTextEntry value={field.value} onChangeText={field.onChange} error={errors.confirmation?.message} />} />
        {apiError ? <ErrorNotice message={apiError} /> : null}
        <Button label={isSubmitting ? 'Creando cuenta...' : 'Registrarse'} disabled={isSubmitting} onPress={submit} />
      </Card>
    </Screen>
  );
}

export function OnboardingPaymentScreen() {
  const router = useRouter();
  const back = useSafeBack();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  return (
    <Screen>
      <Header title="Seleccioná un medio de pago" subtitle="Paso 4 de 4" onBack={back} />
      <Card style={styles.formCard}>
        <StepIndicator steps={registrationSteps} current={3} />
        <StatusPanel icon="card-outline" title="Medio de pago requerido para pujar" message="Podés explorar subastas, pero para ofertar necesitás al menos un medio aprobado por la empresa." tone="yellow" />
        <SectionLabel>Agregar medio de pago</SectionLabel>
        {[
          { label: 'Cuenta bancaria', type: 'cuenta_bancaria', description: 'Reservá fondos para operar en subastas.' },
          { label: 'Tarjeta de crédito', type: 'tarjeta_credito', description: 'Usá una tarjeta a nombre del titular.' },
          { label: 'Cheque certificado', type: 'cheque_certificado', description: 'Adjuntá el respaldo del cheque para revisión.' },
        ].map((option, index) => (
          <ActionRow key={option.type} icon={index === 0 ? 'business-outline' : index === 1 ? 'card-outline' : 'wallet-outline'} label={option.label} description={option.description} onPress={() => router.push({ pathname: '/profile/payments/add', params: { type: option.type, onboarding: 'true', returnTo } })} />
        ))}
        <Button label="Omitir por ahora" variant="ghost" onPress={() => router.replace((returnTo || '/(tabs)') as Href)} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  splash: { alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  splashCard: { alignItems: 'center', gap: spacing.sm, width: '100%', maxWidth: 360 },
  welcome: { justifyContent: 'space-between' },
  welcomeHero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg, backgroundColor: colors.surfaceAlt },
  actionsCard: { gap: spacing.md },
  formCard: { gap: spacing.md },
  centerCopy: { alignItems: 'center', gap: spacing.sm },
  centerSeparator: { alignItems: 'center' },
  tileRow: { flexDirection: 'row', gap: spacing.md, alignSelf: 'stretch' },
  errorCard: { backgroundColor: colors.dangerSoft, borderColor: '#F7C9C9', paddingVertical: spacing.sm },
  infoCard: { backgroundColor: colors.successSoft, borderColor: colors.success },
  error: { color: colors.danger, fontSize: typography.small, fontFamily: fonts.bold, textAlign: 'center' },
  uploadRow: { flexDirection: 'row', gap: spacing.md },
  pending: { justifyContent: 'center' },
  pendingEmail: { color: colors.primary, fontSize: typography.body, fontFamily: fonts.medium },
});
