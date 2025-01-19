// storage-adapter-import-placeholder
import { postgresAdapter } from '@payloadcms/db-postgres'
import { s3Storage } from '@payloadcms/storage-s3'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Usuarios } from './collections/Usuarios'
import { FotosUsuarios } from './collections/FotosUsuarios'
import { CapturaDePagos } from './collections/CapturasPagos'
import { Imagenes } from './collections/Imagenes'
import { FotosPreguntas } from './collections/FotosPreguntas'
import { Categorias } from './collections/Categorias'
import { Cursos } from './collections/Cursos'
import { Cupones } from './collections/Cupones'
import { Enrollment } from './collections/Enrollment'
import { Membresias } from './collections/Membership'
import { RegistroDeMembresias } from './collections/RegistroMembresia'
import { TalleresPresenciales } from './collections/TalleresPresenciales'
import ReviewsCursosVirtuales from './collections/ReseñasCursosVirtuales'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Usuarios.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },

  collections: [
    Usuarios,
    FotosUsuarios,
    CapturaDePagos,
    Imagenes,
    FotosPreguntas,
    Categorias,
    Cursos,
    Cupones,
    Enrollment,
    Membresias,
    RegistroDeMembresias,
    TalleresPresenciales,
    ReviewsCursosVirtuales,
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
