// storage-adapter-import-placeholder
import { postgresAdapter } from '@payloadcms/db-postgres'
import { s3Storage } from '@payloadcms/storage-s3'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { withCors } from './utils/withCors'

import { CapturaDePagos } from './collections/CapturasPagos'
import { Categorias } from './collections/Categorias'
import { Cursos } from './collections/Cursos'
import { Cupones } from './collections/Cupones'
import { Enrollment } from './collections/Enrollment'
import { FotosPreguntas } from './collections/FotosPreguntas'
import { FotosUsuarios } from './collections/FotosUsuarios'
import { Imagenes } from './collections/Imagenes'
import { Membresias } from './collections/Membership'
import { pedidos } from './collections/Orders'
import PreguntasRespuestas from './collections/PreguntasAlumnos'
import { RegistroDeMembresias } from './collections/RegistroMembresia'
import ReviewsCursosVirtuales from './collections/ReseñasCursosVirtuales'
import { TalleresPresenciales } from './collections/TalleresPresenciales'
import { Usuarios } from './collections/Usuarios'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Usuarios.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  serverURL: 'https://kmcs-backend-us-production.up.railway.app',
  csrf: ['https://www.nicolascarrillo.com'],
  cors: {
    origins: ['https://www.nicolascarrillo.com'],
    headers: ['Content-Type', 'Authorization'],
  },
  endpoints: [
    {
      path: '/courses',
      method: 'get',
      handler: withCors(async (req) => {
        try {
          const result = await req.payload.find({
            collection: 'cursos',
            pagination: false,
            select: {
              id: true,
              title: true,
              slug: true,
              estado: true,
              categorias: true,
              precio: true,
              precioConDescuento: true,
              coverImage: true,
            },
          })

          const transformedDocs = result.docs.map((course: any) => {
            if (course.coverImage && typeof course.coverImage === 'object') {
              return {
                ...course,
                coverImage: course.coverImage.SupaURL || null,
              }
            }
            return course
          })

          return Response.json(transformedDocs, { status: 200 })
        } catch (error) {
          console.error('Error en /courses:', error)
          return Response.json({ error: 'Error al obtener cursos' }, { status: 500 })
        }
      }),
    },
  ],

  collections: [
    CapturaDePagos,
    Categorias,
    Cursos,
    Cupones,
    Enrollment,
    FotosPreguntas,
    FotosUsuarios,
    Imagenes,
    Membresias,
    pedidos,
    PreguntasRespuestas,
    RegistroDeMembresias,
    ReviewsCursosVirtuales,
    TalleresPresenciales,
    Usuarios,
  ],
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
    s3Storage({
      collections: {
        fotosUsuarios: {
          prefix: 'fotos-usuarios',
        },
        imagenes: {
          prefix: 'imagenes',
        },
        'captura-de-pagos': {
          prefix: 'pagos',
        },
        fotosPreguntas: {
          prefix: 'fotos-preguntas',
        },
      },
      bucket: process.env.S3_BUCKET as string,
      config: {
        forcePathStyle: true,
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID as string,
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY as string,
        },
        region: process.env.S3_REGION,
        endpoint: process.env.S3_ENDPOINT,
      },
    }),
  ],
})
