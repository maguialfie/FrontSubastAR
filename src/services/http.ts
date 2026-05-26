import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type { Session } from '@/types/domain';

const SESSION_KEY = 'subastar.session';
let unauthorizedHandler: undefined | (() => void | Promise<void>);

export function setUnauthorizedHandler(handler?: () => void | Promise<void>) {
  unauthorizedHandler = handler;
}

export const apiConfig = {
  baseUrl: process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:8080/api/v1',
};

export const apiRoutes = {
  login: '/auth/login',
  register: '/auth/registro',
  verifyCode: '/auth/verificar-codigo',
  finishRegistration: '/auth/completar-registro',
  logout: '/auth/logout',
  auctions: '/subastas',
  auction: (id: string) => `/subastas/${id}`,
  catalog: (id: string) => `/subastas/${id}/catalogo`,
  catalogItem: (auctionId: string, itemId: string) => `/subastas/${auctionId}/catalogo/${itemId}`,
  liveAuction: (id: string) => `/subastas/${id}/en-vivo`,
  bids: (id: string) => `/subastas/${id}/pujas`,
  bidHistory: (auctionId: string, itemId: string) => `/subastas/${auctionId}/pujas/${itemId}`,
  bidResult: (auctionId: string, itemId: string) => `/subastas/${auctionId}/resultado/${itemId}`,
  payments: '/usuarios/me/medios-pago',
  assets: '/bienes/mis-bienes',
  asset: (id: string) => `/bienes/mis-bienes/${id}`,
  assetRequest: '/bienes/solicitudes',
  assetRequestData: (code: string) => `/bienes/solicitudes/${code}/datos`,
  assetRequestPhotos: (code: string) => `/bienes/solicitudes/${code}/fotos`,
  assetRequestDocuments: (code: string) => `/bienes/solicitudes/${code}/documentos`,
  assetRequestConfirm: (code: string) => `/bienes/solicitudes/${code}/confirmar`,
  assetConditions: (id: string) => `/bienes/mis-bienes/${id}/aceptar-condiciones`,
  purchases: '/compras',
  purchase: (id: string) => `/compras/${id}`,
  regularizePurchase: (id: string) => `/compras/${id}/regularizar-pago`,
  invoice: (id: string) => `/compras/${id}/factura`,
  invoiceDownload: (id: string) => `/compras/${id}/factura/download`,
  user: '/usuarios/me',
  accountState: '/usuarios/me/estado-cuenta',
  metrics: '/usuarios/me/metricas',
  insurance: (id: string) => `/seguros/${id}`,
  extendInsurance: (id: string) => `/seguros/${id}/ampliar`,
  conversations: '/chat/conversaciones',
  messages: (type: string) => `/chat/conversaciones/${type}`,
  sendMessage: (type: string) => `/chat/conversaciones/${type}/mensajes`,
} as const;

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

async function getToken() {
  const stored = Platform.OS === 'web'
    ? globalThis.localStorage?.getItem(SESSION_KEY)
    : await SecureStore.getItemAsync(SESSION_KEY);
  if (!stored) return undefined;
  return (JSON.parse(stored) as Session).token;
}

export async function request<T>(route: string, options?: RequestInit): Promise<T> {
  const token = await getToken();
  const headers = new Headers(options?.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (options?.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  const response = await fetch(`${apiConfig.baseUrl}${route}`, { ...options, headers });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Error de servidor.' })) as { message?: string };
    if (response.status === 401 && token && unauthorizedHandler) await unauthorizedHandler();
    throw new ApiError(error.message ?? 'Error de servidor.', response.status);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function requestText(route: string, options?: RequestInit): Promise<string> {
  const token = await getToken();
  const headers = new Headers(options?.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`${apiConfig.baseUrl}${route}`, { ...options, headers });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Error de servidor.' })) as { message?: string };
    if (response.status === 401 && token && unauthorizedHandler) await unauthorizedHandler();
    throw new ApiError(error.message ?? 'Error de servidor.', response.status);
  }
  return response.text();
}
