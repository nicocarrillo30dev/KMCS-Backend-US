// utils/withCors.ts
import { headersWithCors } from '@payloadcms/next/utilities'
import type { PayloadHandler, PayloadRequest } from 'payload'

export function withCors(handler: PayloadHandler): PayloadHandler {
  return async (req: PayloadRequest) => {
    // 1) Manejo de preflight (OPTIONS)
    if (req.method === 'OPTIONS') {
      // Devuelve un 204 con headers CORS
      return new Response('', {
        status: 204,
        headers: headersWithCors({ headers: new Headers(), req }),
      })
    }

    // 2) Llamar al handler real
    const response = await handler(req)

    // 3) Combinar HEADERS de la respuesta con los de CORS
    const mergedHeaders = headersWithCors({
      headers: response.headers,
      req,
    })

    // 4) Retornar nueva Response con las cabeceras unidas
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: mergedHeaders,
    })
  }
}
