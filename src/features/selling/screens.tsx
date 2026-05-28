import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useMutation } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge, Body, Button, Card, Header, InfoTile, Input, Screen, SectionLabel, StatusPanel, StepIndicator, Title, UploadBox } from '@/components/ui/primitives';
import { colors, fonts, radius, spacing, typography } from '@/constants/theme';
import { assetService } from '@/services/api';
import type { FileUpload } from '@/types/domain';

const steps = ['Datos', 'Fotos', 'Documentos', 'Confirmar'];

function WizardHeader({ current }: { current: number }) {
  return <StepIndicator steps={steps} current={current} />;
}

export function SellStartScreen() {
  const router = useRouter();
  const [category, setCategory] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('1');
  const [artist, setArtist] = useState('');
  const [date, setDate] = useState('');
  const [period, setPeriod] = useState('');
  const [history, setHistory] = useState('');
  const [additional, setAdditional] = useState('');
  const save = useMutation({
    mutationFn: async () => {
      const request = await assetService.start(category);
      await assetService.saveDetails(request.code, {
        type: category, name, technicalDescription: description, amount: Number(amount), artistDesigner: artist || undefined,
        originPeriod: period || undefined, creationDate: date || undefined, history: history || undefined,
        additionalInformation: additional || undefined,
      });
      return request.code;
    },
    onSuccess: (code) => router.push({ pathname: '/sell/photos', params: { code, name, type: category, amount } }),
  });
  return (
    <Screen>
      <Header title="Subir bien" onBack={() => router.back()} />
      <Title>Categoría del bien</Title>
      <StatusPanel icon="shield-checkmark-outline" title="Carga formal de bien" message="Completá los datos con precisión para que la empresa pueda revisar documentación, fotos y condiciones de subasta." />
      <View style={styles.categories}>
        {[
          { value: 'obra_arte', label: 'Obras de arte', description: 'Pinturas, esculturas y diseños autorales' },
          { value: 'objeto_disenador', label: 'Objetos de diseñador', description: 'Muebles, accesorios y piezas exclusivas' },
          { value: 'otro', label: 'Otros', description: 'Juegos, sets, joyas y más' },
        ].map((item) => (
          <Pressable onPress={() => setCategory(item.value)} key={item.value} style={[styles.category, item.value === category && styles.categoryActive]}>
            <Ionicons name={item.value === 'obra_arte' ? 'color-palette-outline' : item.value === 'objeto_disenador' ? 'diamond-outline' : 'cube-outline'} size={23} color={colors.primary} />
            <View style={styles.categoryCopy}>
              <Text style={styles.categoryText}>{item.label}</Text>
              <Text style={styles.categoryDescription}>{item.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.primary} />
          </Pressable>
        ))}
      </View>
      {category ? <>
        <WizardHeader current={0} />
        <SectionLabel>Información operativa</SectionLabel>
        <Title>Datos del bien</Title>
        <Input label="Nombre del bien" placeholder="Ej. Retrato en óleo" value={name} onChangeText={setName} />
        <Input label="Descripción técnica" placeholder="Materiales, medidas y estado" multiline value={description} onChangeText={setDescription} />
        <Input label="Cantidad de elementos *" keyboardType="number-pad" value={amount} onChangeText={setAmount} />
        {category === 'obra_arte' ? <>
          <Input label="Artista" value={artist} onChangeText={setArtist} />
          <Input label="Fecha de creación (AAAA-MM-DD)" value={date} onChangeText={setDate} />
          <Input label="Época u origen" value={period} onChangeText={setPeriod} />
          <Input label="Historia y procedencia" multiline value={history} onChangeText={setHistory} />
        </> : null}
        {category === 'objeto_disenador' ? <>
          <Input label="Diseñador" value={artist} onChangeText={setArtist} />
          <Input label="Fecha de creación (AAAA-MM-DD)" value={date} onChangeText={setDate} />
        </> : null}
        {category === 'otro' ? <Input label="Información adicional" value={additional} onChangeText={setAdditional} /> : null}
        <Button label={save.isPending ? 'Guardando...' : 'Continuar con fotografías'} disabled={!name || !description || Number(amount) <= 0 || save.isPending} onPress={() => save.mutate()} />
        {save.isError ? <Body muted>{save.error instanceof Error ? save.error.message : 'No fue posible iniciar la solicitud.'}</Body> : null}
      </> : null}
    </Screen>
  );
}

export function SellPhotosScreen() {
  const router = useRouter();
  const { amount, code, name, type } = useLocalSearchParams<{ amount: string; code: string; name: string; type: string }>();
  const [photos, setPhotos] = useState<FileUpload[]>([]);
  const upload = useMutation({
    mutationFn: () => assetService.uploadPhotos(code ?? '', photos),
    onSuccess: () => router.push({ pathname: '/sell/documents', params: { amount, code, name, type, photos: String(photos.length) } }),
  });
  async function addPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, quality: 0.7 });
    if (!result.canceled) setPhotos((current) => [...current, ...result.assets.map((asset, index) => ({
      uri: asset.uri, name: asset.fileName ?? `bien-${Date.now()}-${index}.jpg`, type: asset.mimeType ?? 'image/jpeg', file: asset.file,
    }))].slice(0, 8));
  }
  return (
    <Screen>
      <Header title="Fotografías" onBack={() => router.back()} />
      <WizardHeader current={1} />
      <Title>Cargá imágenes</Title>
      <Body muted>Mínimo 6 fotos y máximo 8 fotos requeridas.</Body>
      <View style={styles.tileRow}>
        <InfoTile icon="camera-outline" label="Mínimo" value="6 fotos" tone={photos.length >= 6 ? 'green' : 'yellow'} />
        <InfoTile icon="images-outline" label="Máximo" value="8 fotos" />
      </View>
      <View style={styles.gallery}>
        {photos.map((file) => (
          <View key={file.uri} style={styles.previewWrap}>
            <Image source={{ uri: file.uri }} style={styles.preview} />
            <Pressable style={styles.removePhoto} onPress={() => setPhotos((current) => current.filter((photo) => photo.uri !== file.uri))}>
              <Ionicons name="close" size={16} color="#FFF" />
            </Pressable>
          </View>
        ))}
        <UploadBox label="Agregar fotos" description="JPG o PNG" icon="camera-outline" onPress={addPhoto} />
      </View>
      <Badge label={`${photos.length} de 8 fotos cargadas`} tone={photos.length >= 6 ? 'green' : 'yellow'} />
      <Button label={upload.isPending ? 'Subiendo...' : 'Continuar'} disabled={photos.length < 6 || upload.isPending} onPress={() => upload.mutate()} />
      {upload.isError ? <Body muted>{upload.error instanceof Error ? upload.error.message : 'No fue posible subir las fotos.'}</Body> : null}
    </Screen>
  );
}

export function SellDocumentsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ amount: string; code: string; name: string; type: string; photos: string }>();
  const [documents, setDocuments] = useState<FileUpload[]>([]);
  const [declaration, setDeclaration] = useState(false);
  const upload = useMutation({
    mutationFn: () => assetService.uploadDocuments(params.code ?? '', declaration, documents),
    onSuccess: () => router.push({ pathname: '/sell/review', params: { ...params, documents: String(documents.length) } }),
  });
  async function addDocument() {
    const result = await DocumentPicker.getDocumentAsync({ multiple: true, copyToCacheDirectory: true });
    if (!result.canceled) setDocuments(result.assets.map((asset, index) => ({
      uri: asset.uri,
      name: asset.name || `documento-${Date.now()}-${index}.pdf`,
      type: asset.mimeType ?? 'application/pdf',
      file: asset.file,
    })));
  }
  return (
    <Screen>
      <Header title="Documentación" onBack={() => router.back()} />
      <WizardHeader current={2} />
      <Title>Declaración de propiedad *</Title>
      <Pressable onPress={() => setDeclaration((current) => !current)}>
      <Card style={styles.declaration}>
        <Ionicons name={declaration ? 'checkmark-circle' : 'ellipse-outline'} color={colors.primary} size={22} />
        <Body>Declaro que el bien ofrecido para subasta es de mi exclusiva propiedad y que no se encuentra sujeto a ningún impedimento legal que restrinja su disposición.</Body>
      </Card>
      </Pressable>
      <SectionLabel>Documentación preventiva opcional</SectionLabel>
      <UploadBox label="Adjuntar comprobantes" description="PDF o imagen, hasta 10 MB" icon="document-attach-outline" done={documents.length > 0} onPress={addDocument} />
      {documents.map((document) => (
        <Card key={document.uri} style={styles.documentRow}>
          <Body>{document.name}</Body>
          <Pressable onPress={() => setDocuments((current) => current.filter((file) => file.uri !== document.uri))}>
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
          </Pressable>
        </Card>
      ))}
      <Button label={upload.isPending ? 'Guardando...' : 'Siguiente'} disabled={!declaration || upload.isPending} onPress={() => upload.mutate()} />
      {upload.isError ? <Body muted>{upload.error instanceof Error ? upload.error.message : 'No fue posible cargar documentación.'}</Body> : null}
    </Screen>
  );
}

export function SellReviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ amount: string; code: string; name: string; type: string; photos: string; documents: string }>();
  const confirm = useMutation({
    mutationFn: () => assetService.confirm(params.code ?? ''),
    onSuccess: (response) => router.replace({ pathname: '/sell/success', params: { code: response.codigo_solicitud, status: response.estado } }),
  });
  return (
    <Screen>
      <Header title="Confirmar" onBack={() => router.back()} />
      <WizardHeader current={3} />
      <Title>Datos del bien</Title>
      <Card>
        <Badge label={params.type === 'obra_arte' ? 'Obra de arte' : params.type === 'objeto_disenador' ? 'Objeto de diseñador' : 'Otro'} />
        <Title>{params.name}</Title>
        <Summary label="Cantidad de elementos" value={params.amount ?? '-'} />
        <Summary label="Fotos cargadas" value={`${params.photos} archivos`} />
        <Summary label="Documentación" value={`${params.documents} adjuntos`} />
        <Summary label="Declaración de propiedad" value="Aceptada" />
      </Card>
      <StatusPanel icon="document-text-outline" title="Revisión final" message="Al confirmar, la solicitud pasa a revisión de la empresa y queda pendiente de inspección." tone="yellow" />
      <Button label={confirm.isPending ? 'Enviando...' : 'Confirmar'} disabled={confirm.isPending} onPress={() => confirm.mutate()} />
      {confirm.isError ? <Body muted>{confirm.error instanceof Error ? confirm.error.message : 'No fue posible enviar la solicitud.'}</Body> : null}
      <Button label="Editar bien" variant="secondary" onPress={() => router.back()} />
      <Button label="Cancelar" variant="ghost" onPress={() => router.replace('/(tabs)')} />
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
      <StatusPanel icon="checkmark-circle-outline" title="Solicitud enviada exitosamente" message="Tu bien fue enviado para revisión. Te notificaremos cuando la empresa complete la inspección e informe fecha, valor base y comisiones." tone="green" />
      <Card style={styles.fullWidth}>
        <Summary label="Código de solicitud" value={code ?? '-'} />
        <Summary label="Estado" value={status ?? 'Pendiente de revisión'} />
      </Card>
      <Button label="Agregar otro bien" onPress={() => router.replace('/sell')} />
      <Button label="Ver mis bienes" variant="secondary" onPress={() => router.replace('/profile/assets')} />
      <Button label="Volver al inicio" variant="ghost" onPress={() => router.replace('/(tabs)')} />
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
  categories: { gap: spacing.sm },
  category: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: spacing.md },
  categoryActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  categoryCopy: { flex: 1, gap: spacing.xs },
  categoryText: { color: colors.text, fontSize: typography.body, fontFamily: fonts.bold },
  categoryDescription: { color: colors.textMuted, fontSize: typography.small, fontFamily: fonts.regular },
  tileRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
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
