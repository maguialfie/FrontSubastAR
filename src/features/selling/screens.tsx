import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useMutation } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge, Body, Button, Card, Header, Input, Screen, Title } from '@/components/ui/primitives';
import { colors, fonts, radius, spacing, typography } from '@/constants/theme';
import { assetService } from '@/services/api';
import type { FileUpload } from '@/types/domain';

const steps = ['Datos', 'Fotos', 'Documentos', 'Confirmar'];

function WizardHeader({ current }: { current: number }) {
  return (
    <View style={styles.steps}>
      {steps.map((step, index) => (
        <View style={styles.stepItem} key={step}>
          <View style={[styles.stepDot, index <= current && styles.stepDotActive]}>
            <Text style={[styles.stepNumber, index <= current && styles.stepNumberActive]}>{index + 1}</Text>
          </View>
          <Text style={styles.stepLabel}>{step}</Text>
        </View>
      ))}
    </View>
  );
}

export function SellStartScreen() {
  const router = useRouter();
  const [category, setCategory] = useState('obra_arte');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [artist, setArtist] = useState('');
  const [date, setDate] = useState('');
  const [period, setPeriod] = useState('');
  const [history, setHistory] = useState('');
  const [additional, setAdditional] = useState('');
  const save = useMutation({
    mutationFn: async () => {
      const request = await assetService.start(category);
      await assetService.saveDetails(request.code, {
        type: category, name, technicalDescription: description, amount: 1, artistDesigner: artist || undefined,
        originPeriod: period || undefined, creationDate: date || undefined, history: history || undefined,
        additionalInformation: additional || undefined,
      });
      return request.code;
    },
    onSuccess: (code) => router.push({ pathname: '/sell/photos', params: { code, name, type: category } }),
  });
  return (
    <Screen>
      <Header title="Subir producto" onBack={() => router.back()} />
      <WizardHeader current={0} />
      <Title>Datos del bien</Title>
      <Body muted>Selecciona una categoria y completa la informacion necesaria para tasarlo.</Body>
      <View style={styles.categories}>
        {[{ value: 'obra_arte', label: 'Obra de arte' }, { value: 'objeto_disenador', label: 'Disenador' }, { value: 'otro', label: 'Otros' }].map((item) => (
          <Pressable onPress={() => setCategory(item.value)} key={item.value} style={[styles.category, item.value === category && styles.categoryActive]}>
            <Ionicons name={item.value === 'obra_arte' ? 'color-palette-outline' : item.value === 'objeto_disenador' ? 'diamond-outline' : 'cube-outline'} size={23} color={colors.primary} />
            <Text style={styles.categoryText}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
      <Input label="Nombre del bien" placeholder="Ej. Retrato en oleo" value={name} onChangeText={setName} />
      <Input label="Descripcion tecnica" placeholder="Materiales, medidas y estado" multiline value={description} onChangeText={setDescription} />
      {category === 'obra_arte' ? <>
        <Input label="Artista" value={artist} onChangeText={setArtist} />
        <Input label="Fecha de creacion (AAAA-MM-DD)" value={date} onChangeText={setDate} />
        <Input label="Epoca u origen" value={period} onChangeText={setPeriod} />
        <Input label="Historia y procedencia" multiline value={history} onChangeText={setHistory} />
      </> : null}
      {category === 'objeto_disenador' ? <>
        <Input label="Disenador" value={artist} onChangeText={setArtist} />
        <Input label="Fecha de creacion (AAAA-MM-DD)" value={date} onChangeText={setDate} />
      </> : null}
      {category === 'otro' ? <Input label="Informacion adicional" value={additional} onChangeText={setAdditional} /> : null}
      <Button label={save.isPending ? 'Guardando...' : 'Continuar con fotografias'} disabled={!name || !description || save.isPending} onPress={() => save.mutate()} />
      {save.isError ? <Body muted>{save.error instanceof Error ? save.error.message : 'No fue posible iniciar la solicitud.'}</Body> : null}
    </Screen>
  );
}

export function SellPhotosScreen() {
  const router = useRouter();
  const { code, name, type } = useLocalSearchParams<{ code: string; name: string; type: string }>();
  const [photos, setPhotos] = useState<FileUpload[]>([]);
  const upload = useMutation({
    mutationFn: () => assetService.uploadPhotos(code ?? '', photos),
    onSuccess: () => router.push({ pathname: '/sell/documents', params: { code, name, type, photos: String(photos.length) } }),
  });
  async function addPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, quality: 0.7 });
    if (!result.canceled) setPhotos((current) => [...current, ...result.assets.map((asset, index) => ({
      uri: asset.uri, name: asset.fileName ?? `bien-${index}.jpg`, type: asset.mimeType ?? 'image/jpeg', file: asset.file,
    }))].slice(0, 6));
  }
  return (
    <Screen>
      <Header title="Fotografias" onBack={() => router.back()} />
      <WizardHeader current={1} />
      <Title>Carga imagenes</Title>
      <Body muted>Agrega 6 fotos nitidas del bien y sus detalles.</Body>
      <View style={styles.gallery}>
        {photos.map((file) => (
          <View key={file.uri} style={styles.previewWrap}>
            <Image source={{ uri: file.uri }} style={styles.preview} />
            <Pressable style={styles.removePhoto} onPress={() => setPhotos((current) => current.filter((photo) => photo.uri !== file.uri))}>
              <Ionicons name="close" size={16} color="#FFF" />
            </Pressable>
          </View>
        ))}
        <Pressable style={styles.addPhoto} onPress={addPhoto}>
          <Ionicons name="camera-outline" size={28} color={colors.primary} />
          <Text style={styles.addText}>Agregar</Text>
        </Pressable>
      </View>
      <Badge label={`${photos.length} de 6 fotos cargadas`} tone={photos.length >= 6 ? 'green' : 'yellow'} />
      <Button label={upload.isPending ? 'Subiendo...' : 'Continuar'} disabled={photos.length < 6 || upload.isPending} onPress={() => upload.mutate()} />
      {upload.isError ? <Body muted>{upload.error instanceof Error ? upload.error.message : 'No fue posible subir las fotos.'}</Body> : null}
    </Screen>
  );
}

export function SellDocumentsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ code: string; name: string; type: string; photos: string }>();
  const [documents, setDocuments] = useState<FileUpload[]>([]);
  const [declaration, setDeclaration] = useState(true);
  const upload = useMutation({
    mutationFn: () => assetService.uploadDocuments(params.code ?? '', declaration, documents),
    onSuccess: () => router.push({ pathname: '/sell/review', params: { ...params, documents: String(documents.length) } }),
  });
  async function addDocument() {
    const result = await DocumentPicker.getDocumentAsync({ multiple: true, copyToCacheDirectory: true });
    if (!result.canceled) setDocuments(result.assets.map((asset) => ({ uri: asset.uri, name: asset.name, type: asset.mimeType ?? 'application/pdf', file: asset.file })));
  }
  return (
    <Screen>
      <Header title="Documentacion" onBack={() => router.back()} />
      <WizardHeader current={2} />
      <Title>Declara propiedad</Title>
      <Pressable onPress={() => setDeclaration((current) => !current)}>
      <Card style={styles.declaration}>
        <Ionicons name={declaration ? 'checkmark-circle' : 'ellipse-outline'} color={colors.primary} size={22} />
        <Body>Declaro ser propietario legitimo del bien presentado.</Body>
      </Card>
      </Pressable>
      <Pressable style={styles.documentPicker} onPress={addDocument}>
        <Ionicons name="document-attach-outline" size={28} color={colors.primary} />
        <Text style={styles.documentTitle}>Adjuntar comprobantes</Text>
        <Body muted>PDF o imagen, hasta 10 MB</Body>
      </Pressable>
      {documents.map((document) => (
        <Card key={document.uri} style={styles.documentRow}>
          <Body>{document.name}</Body>
          <Pressable onPress={() => setDocuments((current) => current.filter((file) => file.uri !== document.uri))}>
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
          </Pressable>
        </Card>
      ))}
      <Button label={upload.isPending ? 'Guardando...' : 'Revisar solicitud'} disabled={!declaration || upload.isPending} onPress={() => upload.mutate()} />
      {upload.isError ? <Body muted>{upload.error instanceof Error ? upload.error.message : 'No fue posible cargar documentacion.'}</Body> : null}
    </Screen>
  );
}

export function SellReviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ code: string; name: string; type: string; photos: string; documents: string }>();
  const confirm = useMutation({
    mutationFn: () => assetService.confirm(params.code ?? ''),
    onSuccess: (response) => router.replace({ pathname: '/sell/success', params: { code: response.codigo_solicitud, status: response.estado } }),
  });
  return (
    <Screen>
      <Header title="Confirmacion" onBack={() => router.back()} />
      <WizardHeader current={3} />
      <Title>Revisa tus datos</Title>
      <Card>
        <Badge label={params.type === 'obra_arte' ? 'Obra de arte' : params.type === 'objeto_disenador' ? 'Objeto de disenador' : 'Otro'} />
        <Title>{params.name}</Title>
        <Body muted>Descripcion tecnica y documentos preparados para evaluacion.</Body>
        <Summary label="Fotografias" value={`${params.photos} archivos`} />
        <Summary label="Propiedad" value="Declarada" />
        <Summary label="Documentos" value={`${params.documents} adjuntos`} />
      </Card>
      <Button label={confirm.isPending ? 'Enviando...' : 'Enviar solicitud'} disabled={confirm.isPending} onPress={() => confirm.mutate()} />
      {confirm.isError ? <Body muted>{confirm.error instanceof Error ? confirm.error.message : 'No fue posible enviar la solicitud.'}</Body> : null}
      <Button label="Volver a editar" variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return <View style={styles.summary}><Body muted>{label}</Body><Text style={styles.summaryValue}>{value}</Text></View>;
}

export function SellSuccessScreen() {
  const router = useRouter();
  const { code, status } = useLocalSearchParams<{ code: string; status: string }>();
  return (
    <Screen style={styles.success}>
      <Ionicons name="checkmark-circle-outline" size={58} color={colors.success} />
      <Title>Solicitud enviada</Title>
      <Body muted>Tu bien fue recibido y sera evaluado por nuestro equipo.</Body>
      <Card style={styles.fullWidth}>
        <Summary label="Codigo de solicitud" value={code ?? '-'} />
        <Summary label="Estado" value={status ?? 'Pendiente de revision'} />
      </Card>
      <Button label="Ver mis bienes" onPress={() => router.replace('/profile/assets')} />
      <Button label="Volver al inicio" variant="secondary" onPress={() => router.replace('/(tabs)')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  steps: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.xs },
  stepItem: { alignItems: 'center', gap: spacing.xs, flex: 1 },
  stepDot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceAlt },
  stepDotActive: { backgroundColor: colors.primary },
  stepNumber: { color: colors.textMuted, fontFamily: fonts.bold },
  stepNumberActive: { color: '#FFF' },
  stepLabel: { color: colors.textMuted, fontSize: typography.caption, fontFamily: fonts.regular },
  categories: { flexDirection: 'row', gap: spacing.sm },
  category: { flex: 1, alignItems: 'center', borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingVertical: spacing.md, gap: spacing.sm },
  categoryActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  categoryText: { color: colors.text, fontSize: typography.small, fontFamily: fonts.medium, textAlign: 'center' },
  gallery: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  previewWrap: { position: 'relative' },
  preview: { height: 94, width: 94, borderRadius: radius.md },
  removePhoto: { position: 'absolute', right: -5, top: -5, height: 23, width: 23, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.danger },
  addPhoto: { height: 94, width: 94, borderRadius: radius.md, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.primary, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  addText: { color: colors.primary, fontSize: typography.small, fontFamily: fonts.medium },
  declaration: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primarySoft },
  documentPicker: { minHeight: 150, borderRadius: radius.lg, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.primary, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  documentTitle: { color: colors.primary, fontSize: typography.body, fontFamily: fonts.bold },
  documentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryValue: { color: colors.text, fontFamily: fonts.bold, fontSize: typography.body },
  success: { paddingTop: 75, alignItems: 'center' },
  fullWidth: { width: '100%' },
});
