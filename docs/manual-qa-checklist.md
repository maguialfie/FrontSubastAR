# Checklist Manual QA Frontend

## Configuracion

- [ ] Crear `.env` desde `.env.example`.
- [ ] Configurar `EXPO_PUBLIC_API_URL` para Web, emulador o dispositivo.
- [ ] Configurar `cloudinaryConfig.cloudName` y un `cloudinaryConfig.unsignedUploadPreset` en `src/services/cloudinary.ts`.
- [ ] Confirmar que no exista `CLOUDINARY_API_SECRET` en variables o codigo del frontend.
- [ ] Levantar backend y base no productiva con datos de prueba.
- [ ] Ejecutar `npm install`.
- [ ] Ejecutar `npm run lint`.
- [ ] Ejecutar `npx tsc --noEmit`.
- [ ] Ejecutar `npm run web` y, si esta disponible, `npm run android`.

## Acceso

- [ ] Welcome carga correctamente.
- [ ] Login informa los errores devueltos por la API.
- [ ] Continuar como invitado permite explorar subastas.
- [ ] Registro permite cargar DNI frente y dorso.
- [ ] Verificacion permite ingresar el codigo recibido.
- [ ] Crear contrasena finaliza el registro cuando backend soporte el contrato.

## Subastas

- [ ] Inicio muestra `SubastAR`.
- [ ] Explorar subastas navega al listado.
- [ ] Filtros aplican estado, categoria y moneda.
- [ ] Las tarjetas muestran `Proximas` visualmente como `Proximas` con acento en la UI.
- [ ] Datos de subasta abre catalogo y subasta en vivo cuando corresponde.
- [ ] Catalogo abre detalle de lote con imagen.
- [ ] Puja en vivo muestra falta de medio o restriccion real si corresponde.
- [ ] Confirmar puja refleja respuesta o error real de la API.
- [ ] Resultado se valida solo cuando el endpoint backend este disponible.

## Bienes Y Pagos

- [ ] Alta de tarjeta y cuenta bancaria envia datos reales.
- [ ] Alta de cheque permite subir su foto.
- [ ] Subir bien abre seleccion de categoria.
- [ ] Cantidad de elementos es obligatoria.
- [ ] Fotos permiten cargar de 6 a 8 imagenes en Web y Android.
- [ ] Al continuar, las fotos aparecen en Cloudinary dentro de `subastar/bienes`.
- [ ] El backend recibe metadata JSON de Cloudinary para fotos, sin archivos binarios.
- [ ] Si Cloudinary rechaza una imagen, se muestra el error y no se avanza a documentos.
- [ ] Documentos permiten aceptar declaracion legal y adjuntar archivos.
- [ ] Solicitud confirma y muestra el codigo devuelto por API.
- [ ] Detalle completo del bien muestra galeria con imagen principal y miniaturas seleccionables.
- [ ] Detalle completo muestra documentos adjuntos o un estado vacio sin romper la pantalla.
- [ ] Editar informacion adicional y precio base sugerido refresca el detalle al guardar.
- [ ] Editar precio base sugerido permite seleccionar `ARS` o `USD`.
- [ ] Al guardar cambios del bien, se muestra un overlay bloqueante hasta completar el refetch del detalle.
- [ ] Galeria del detalle completo rota cada 4 segundos y permite navegar con botones, dots y miniaturas.

## Perfil

- [ ] Perfil muestra secciones y estado de cuenta.
- [ ] Historial abre correctamente y aclara que solo expone compras ganadas.
- [ ] Metricas abre correctamente.
- [ ] Datos personales muestra categoria.
- [ ] Mis bienes abre y filtra estados.
- [ ] Mis compras abre correctamente.
- [ ] Multas abre estado de cuenta.
- [ ] Seguros y Polizas aclara que se deriva de compras asociadas.

## Compras, Chat Y Seguros

- [ ] Detalle compra abre entrega y factura.
- [ ] Entrega permite coordinar por chat.
- [ ] Chat abre conversaciones tocando toda la fila.
- [ ] Envio de mensaje solo se prueba si el endpoint fue incorporado.
- [ ] Compra con `poliza_id` abre su poliza.
- [ ] Poliza permite consultar contacto y solicitar ampliacion.

## Fallos Reales

- [ ] Un `401` de sesion autenticada vuelve al acceso sin romper navegacion.
- [ ] Un `403` de puja presenta el estado restringido.
- [ ] Errores JSON con `message`, `error`, `errors` o `errores` se muestran legibles.
- [ ] Errores de texto plano no rompen la pantalla.
- [ ] Backend apagado muestra estado recuperable con reintento.
