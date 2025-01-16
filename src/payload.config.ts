// storage-adapter-import-placeholder
import { postgresAdapter } from '@payloadcms/db-postgres'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { getFromRedis, setToRedis } from './utils/redisClient'
import { withCors } from './utils/withCors'

import { Usuarios } from './collections/Usuarios'
import { Media } from './collections/Media'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Usuarios.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  endpoints: [
    {
      path: '/users',
      method: 'get',
      handler: async (req) => {
        console.time('GET /api/users - TOTAL')

        try {
          const cacheKey = 'usuarios_list'

          console.time('Redis GET (endpoint)')
          const cachedUsuarios = await getFromRedis(cacheKey)
          console.timeEnd('Redis GET (endpoint)')

          if (cachedUsuarios) {
            console.log('📌 Datos obtenidos desde Redis (SDK nativo):', cachedUsuarios)

            // Envía la respuesta
            const response = Response.json(cachedUsuarios, { status: 200 })

            console.timeEnd('GET /api/users - TOTAL')
            return response
          }

          // Sino, va a la DB
          console.time('DB Query')
          const result = await req.payload.find({
            collection: 'usuarios',
          })
          console.timeEnd('DB Query')

          // Guarda en Redis
          console.time('Redis SET (endpoint)')
          await setToRedis(cacheKey, result.docs, { expireSeconds: 60 }) // Ej. 1 minuto de caché
          console.timeEnd('Redis SET (endpoint)')

          console.log('✅ Datos almacenados en Redis')

          const response = Response.json(result.docs, { status: 200 })
          console.timeEnd('GET /api/users - TOTAL')
          return response
        } catch (error) {
          console.error('❌ Error en /usuarios:', error)
          console.timeEnd('GET /api/users - TOTAL')
          return Response.json({ error: 'Error al obtener usuarios' }, { status: 500 })
        }
      },
    },
  ],
  collections: [Usuarios, Media],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
  }),
  sharp,
  plugins: [
    payloadCloudPlugin(),
    // storage-adapter-placeholder
  ],
})
