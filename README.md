# SubastAR Frontend

Aplicacion movil de subastas construida con React Native, Expo SDK 55, Expo Router y TypeScript. El diseno visual se basa en el prototipo de alta fidelidad de Figma.

## Requisitos

- Node.js compatible con Expo SDK 55 (`20.19.x` o superior compatible).
- Backend SubastAR disponible para validar los flujos reales.
- Android Emulator, dispositivo Android con Expo Go o navegador web para revision.

## Configuracion De API

El frontend consume la URL definida en `EXPO_PUBLIC_API_URL`. Si no se configura, conserva el valor por defecto `http://localhost:8080/api/v1`, util para Expo Web ejecutado en la misma PC que el backend.

1. Crear un archivo `.env` tomando como referencia `.env.example`.
2. Elegir la URL segun el entorno:

| Entorno | URL de ejemplo |
|---|---|
| Web local | `http://localhost:8080/api/v1` |
| Android Emulator | `http://10.0.2.2:8080/api/v1` |
| Celular fisico en la misma red | `http://IP_LOCAL_NOTEBOOK:8080/api/v1` |

No se debe guardar una IP personal fija en el codigo fuente.

## Comandos

```bash
npm install
npm run lint
npm run web
npm run android
```

Para iniciar web con una URL especifica desde macOS o Linux:

```bash
EXPO_PUBLIC_API_URL=http://localhost:8080/api/v1 npm run web
```

En Windows PowerShell:

```powershell
$env:EXPO_PUBLIC_API_URL="http://localhost:8080/api/v1"
npm run web
```

## Integracion Y QA

- El contrato que actualmente consume el frontend esta documentado en [`docs/api-contract-front-back.md`](docs/api-contract-front-back.md).
- La cobertura de pantallas y sus dependencias de API se registra en [`docs/figma-screen-matrix.md`](docs/figma-screen-matrix.md).
- La revision manual previa a una entrega se realiza con [`docs/manual-qa-checklist.md`](docs/manual-qa-checklist.md).

Los flujos de historial de participaciones y listado de polizas permanecen parciales hasta contar con endpoints dedicados del backend.
