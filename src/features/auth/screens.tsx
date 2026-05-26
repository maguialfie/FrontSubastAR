import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';

import { BrandLogo } from '@/components/brand/logo';
import { Body, Button, Card, Header, Input, Screen, Title } from '@/components/ui/primitives';
import { colors, fonts, radius, spacing, typography } from '@/constants/theme';
import { useSession } from '@/providers/app-provider';
import { authService } from '@/services/api';
import type { FileUpload } from '@/types/domain';

const loginSchema = z.object({
  email: z.email('Ingresa un correo valido.'),
  password: z.string().min(6, 'Minimo 6 caracteres.'),
});

const registerSchema = z.object({
  name: z.string().min(2, 'Ingresa tu nombre.'),
  surname: z.string().min(2, 'Ingresa tu apellido.'),
  email: z.email('Correo invalido.'),
  address: z.string().min(5, 'Ingresa tu domicilio.'),
  country: z.string().min(2, 'Ingresa tu pais.'),
});

const verifySchema = z.object({ code: z.string().min(4, 'Ingresa el codigo recibido.') });
const passwordSchema = z.object({
  password: z.string().min(8, 'Minimo 8 caracteres.'),
  confirmation: z.string().min(8, 'Confirma tu contrasena.'),
}).refine((values) => values.password === values.confirmation, { path: ['confirmation'], message: 'Las contrasenas no coinciden.' });

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
      <BrandLogo iconSize={112} />
    </Screen>
  );
}

export function WelcomeScreen() {
  const router = useRouter();
  const { enterAsGuest } = useSession();
  return (
    <Screen style={styles.welcome}>
      <View style={styles.welcomeHero}>
        <BrandLogo iconSize={88} />
        <Title>Descubri objetos unicos</Title>
        <Body muted>Explora subastas seleccionadas y participa desde cualquier lugar.</Body>
      </View>
      <View style={styles.actions}>
        <Button label="Iniciar sesion" onPress={() => router.push('/login')} />
        <Button label="Crear cuenta" variant="secondary" onPress={() => router.push('/register')} />
        <Button label="Continuar como invitado" variant="ghost" onPress={() => { enterAsGuest(); router.replace('/(tabs)'); }} />
      </View>
    </Screen>
  );
}

export function LoginScreen() {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const { signIn } = useSession();
  const [apiError, setApiError] = useState('');
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });
  const submit = handleSubmit(async (values) => {
    try {
      setApiError('');
      await signIn(await authService.login(values.email, values.password));
      router.replace((returnTo || '/(tabs)') as Href);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'No fue posible ingresar.');
    }
  });
  return (
    <Screen>
      <Header title="Iniciar sesion" onBack={() => router.back()} />
      <Title>Bienvenido nuevamente</Title>
      <Body muted>Ingresa para ofertar y gestionar tus operaciones.</Body>
      <Controller control={control} name="email" render={({ field: { onChange, value } }) => (
        <Input label="Correo electronico" keyboardType="email-address" autoCapitalize="none" value={value} onChangeText={onChange} error={errors.email?.message} />
      )} />
      <Controller control={control} name="password" render={({ field: { onChange, value } }) => (
        <Input label="Contrasena" secureTextEntry value={value} onChangeText={onChange} error={errors.password?.message} />
      )} />
      {apiError ? <Text style={styles.error}>{apiError}</Text> : null}
      <Button label={isSubmitting ? 'Ingresando...' : 'Iniciar sesion'} disabled={isSubmitting} onPress={submit} />
      <Button label="Crear una cuenta" variant="ghost" onPress={() => router.push({ pathname: '/register', params: { returnTo } })} />
    </Screen>
  );
}

export function RegisterScreen() {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const { setRegistration } = useSession();
  const [front, setFront] = useState<FileUpload>();
  const [back, setBack] = useState<FileUpload>();
  const [apiError, setApiError] = useState('');
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', surname: '', email: '', address: '', country: 'Argentina' },
  });
  async function pick(side: 'front' | 'back') {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!result.canceled) {
      const asset = result.assets[0];
      const upload = { uri: asset.uri, name: asset.fileName ?? `dni-${side}.jpg`, type: asset.mimeType ?? 'image/jpeg', file: asset.file };
      if (side === 'front') setFront(upload);
      else setBack(upload);
    }
  }
  const submit = handleSubmit(async (values) => {
    if (!front || !back) {
      setApiError('Adjunta frente y dorso del DNI.');
      return;
    }
    try {
      setApiError('');
      await authService.register({ ...values, front, back });
      setRegistration({ email: values.email, returnTo });
      router.push('/registration-pending' as Href);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'No fue posible enviar tu registro.');
    }
  });
  return (
    <Screen>
      <Header title="Crear cuenta" subtitle="Paso 1 de 4" onBack={() => router.back()} />
      <Title>Datos personales</Title>
      <Controller control={control} name="name" render={({ field }) => <Input label="Nombre" value={field.value} onChangeText={field.onChange} error={errors.name?.message} />} />
      <Controller control={control} name="surname" render={({ field }) => <Input label="Apellido" value={field.value} onChangeText={field.onChange} error={errors.surname?.message} />} />
      <Controller control={control} name="email" render={({ field }) => <Input label="Correo" value={field.value} onChangeText={field.onChange} keyboardType="email-address" error={errors.email?.message} />} />
      <Controller control={control} name="address" render={({ field }) => <Input label="Domicilio" value={field.value} onChangeText={field.onChange} error={errors.address?.message} />} />
      <Controller control={control} name="country" render={({ field }) => <Input label="Pais de origen" value={field.value} onChangeText={field.onChange} error={errors.country?.message} />} />
      <Text style={styles.label}>Documento de identidad</Text>
      <View style={styles.uploadRow}>
        <UploadAction label="DNI frente" done={!!front} onPress={() => pick('front')} />
        <UploadAction label="DNI dorso" done={!!back} onPress={() => pick('back')} />
      </View>
      {apiError ? <Text style={styles.error}>{apiError}</Text> : null}
      <Button label={isSubmitting ? 'Enviando...' : 'Enviar solicitud'} disabled={isSubmitting} onPress={submit} />
    </Screen>
  );
}

function UploadAction({ label, done, onPress }: { label: string; done: boolean; onPress: () => void }) {
  return (
    <Pressable style={styles.upload} onPress={onPress}>
      <Ionicons name={done ? 'checkmark-circle' : 'camera-outline'} size={22} color={done ? colors.success : colors.primary} />
      <Text style={styles.uploadText}>{label}</Text>
    </Pressable>
  );
}

export function RegistrationPendingScreen() {
  const router = useRouter();
  const { registration } = useSession();
  return (
    <Screen style={styles.pending}>
      <Card style={styles.centerCard}>
        <Ionicons name="mail-unread-outline" size={44} color={colors.primary} />
        <Title>Solicitud enviada</Title>
        <Body muted>Recibimos tus datos y las imagenes del DNI. Cuando tu cuenta sea aprobada, recibiras el codigo por correo.</Body>
        {registration?.email ? <Text style={styles.pendingEmail}>{registration.email}</Text> : null}
      </Card>
      <Button label="Ya recibi mi codigo" onPress={() => router.push('/verify')} />
      <Button label="Volver al acceso" variant="ghost" onPress={() => router.replace('/welcome')} />
    </Screen>
  );
}

export function VerifyScreen() {
  const router = useRouter();
  const { registration, setRegistration } = useSession();
  const [apiError, setApiError] = useState('');
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof verifySchema>>({
    resolver: zodResolver(verifySchema), defaultValues: { code: '' },
  });
  const submit = handleSubmit(async ({ code }) => {
    if (!registration?.email) {
      setApiError('Volver a registro para indicar el correo.');
      return;
    }
    try {
      const response = await authService.verify(registration.email, code);
      setRegistration({ ...registration, verificationToken: response.token_verificacion });
      router.push('/password');
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Codigo invalido.');
    }
  });
  return (
    <Screen>
      <Header title="Verificacion" subtitle="Paso 2 de 4" onBack={() => router.back()} />
      <Card style={styles.centerCard}>
        <Ionicons name="mail-outline" size={35} color={colors.primary} />
        <Title>Revisa tu correo</Title>
        <Body muted>Enviamos un codigo de verificacion para continuar con el registro.</Body>
      </Card>
      <Controller control={control} name="code" render={({ field }) => <Input label="Codigo de verificacion" placeholder="0000" keyboardType="number-pad" value={field.value} onChangeText={field.onChange} error={errors.code?.message} />} />
      {apiError ? <Text style={styles.error}>{apiError}</Text> : null}
      <Button label={isSubmitting ? 'Verificando...' : 'Verificar codigo'} disabled={isSubmitting} onPress={submit} />
    </Screen>
  );
}

export function PasswordScreen() {
  const router = useRouter();
  const { registration, signIn, setRegistration } = useSession();
  const [apiError, setApiError] = useState('');
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema), defaultValues: { password: '', confirmation: '' },
  });
  const submit = handleSubmit(async (values) => {
    if (!registration?.verificationToken) {
      setApiError('Primero verifica el codigo de correo.');
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
      <Header title="Seguridad" subtitle="Paso 3 de 4" onBack={() => router.back()} />
      <Title>Crea tu contrasena</Title>
      <Controller control={control} name="password" render={({ field }) => <Input label="Contrasena" secureTextEntry value={field.value} onChangeText={field.onChange} error={errors.password?.message} />} />
      <Controller control={control} name="confirmation" render={({ field }) => <Input label="Confirmar contrasena" secureTextEntry value={field.value} onChangeText={field.onChange} error={errors.confirmation?.message} />} />
      {apiError ? <Text style={styles.error}>{apiError}</Text> : null}
      <Button label={isSubmitting ? 'Creando cuenta...' : 'Continuar'} disabled={isSubmitting} onPress={submit} />
    </Screen>
  );
}

export function OnboardingPaymentScreen() {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  return (
    <Screen>
      <Header title="Medio de pago" subtitle="Paso 4 de 4" onBack={() => router.back()} />
      <Title>Agrega un metodo de pago</Title>
      <Body muted>Lo necesitaras para ofertar en una subasta en vivo. Tambien podes hacerlo mas tarde.</Body>
      {[
        { label: 'Tarjeta de credito', type: 'tarjeta_credito' },
        { label: 'Cuenta bancaria', type: 'cuenta_bancaria' },
        { label: 'Cheque certificado', type: 'cheque_certificado' },
      ].map((option, index) => (
        <Pressable key={option.type} onPress={() => router.push({ pathname: '/profile/payments/add', params: { type: option.type, onboarding: 'true', returnTo } })}>
        <Card style={styles.paymentOption}>
          <Ionicons name={index === 0 ? 'card-outline' : 'wallet-outline'} size={24} color={colors.primary} />
          <Text style={styles.optionText}>{option.label}</Text>
          <Ionicons name="chevron-forward" color={colors.textMuted} size={18} />
        </Card>
        </Pressable>
      ))}
      <Button label="Omitir por ahora" variant="ghost" onPress={() => router.replace((returnTo || '/(tabs)') as Href)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  splash: { alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  welcome: { justifyContent: 'space-between' },
  welcomeHero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  actions: { gap: spacing.md },
  error: { color: colors.danger, fontSize: typography.small, fontFamily: fonts.regular },
  label: { color: colors.textMuted, fontSize: typography.small, fontFamily: fonts.medium },
  uploadRow: { flexDirection: 'row', gap: spacing.md },
  upload: { flex: 1, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.primaryBorder, borderRadius: radius.md, backgroundColor: colors.primarySoft, minHeight: 82, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  uploadText: { color: colors.primary, fontFamily: fonts.medium, fontSize: typography.small },
  centerCard: { alignItems: 'center' },
  pending: { justifyContent: 'center' },
  pendingEmail: { color: colors.primary, fontSize: typography.body, fontFamily: fonts.medium },
  paymentOption: { flexDirection: 'row', alignItems: 'center' },
  optionText: { flex: 1, fontSize: typography.body, color: colors.text, fontFamily: fonts.medium },
});
