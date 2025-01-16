// storage-adapter-import-placeholder
import { postgresAdapter } from '@payloadcms/db-postgres'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import redis from './utils/redisClient'
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
      handler: withCors(async (req) => {
        try {
          const cacheKey = 'usuarios_list'

          // 1. Intentamos obtener la respuesta de Redis
          const cachedUsuarios = await redis.get(cacheKey)

          if (cachedUsuarios) {
            console.log('Datos obtenidos desde Redis')
            let parsedUsuarios
            if (typeof cachedUsuarios === 'string') {
              try {
                parsedUsuarios = JSON.parse(cachedUsuarios)
              } catch (err) {
                console.error('Error al parsear cachedUsuarios:', err)
                parsedUsuarios = cachedUsuarios
              }
            } else {
              parsedUsuarios = cachedUsuarios
            }
            return Response.json(parsedUsuarios, { status: 200 })
          }

          // 2. Consulta la colección "usuarios" usando la Local API sin paginación
          const result = await req.payload.find({
            collection: 'usuarios',
            select: {
              id: true,
              nombre: true,
              apellidos: true,
              pais: true,
              numero: true,
              role: true,
              fotoUsuario: true,
              updatedAt: true,
              createdAt: true,
              email: true,
              loginAttempts: true,
            },
          })

          // 3. Almacenamos la respuesta en Redis sin TTL
          await redis.set(cacheKey, JSON.stringify(result.docs))
          console.log('Datos almacenados en Redis')

          return Response.json(result.docs, { status: 200 })
        } catch (error) {
          console.error('Error en /usuarios:', error)
          return Response.json({ error: 'Error al obtener usuarios' }, { status: 500 })
        }
      }),
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
