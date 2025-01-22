// utils/withCors.ts
import { headersWithCors } from '@payloadcms/next/utilities'
import type { PayloadHandler, PayloadRequest } from 'payload'

export function withCors(handler: PayloadHandler): PayloadHandler {
  return async (req: PayloadRequest) => {
    if (req.method === 'OPTIONS') {
      return new Response('', {
        status: 204,
        headers: headersWithCors({ headers: new Headers(), req }),
      })
    }

    const response = await handler(req)

    const mergedHeaders = headersWithCors({
      headers: response.headers,
      req,
    })

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: mergedHeaders,
    })
  }
}
