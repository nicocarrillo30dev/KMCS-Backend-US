// storage-adapter-import-placeholder
import { postgresAdapter } from '@payloadcms/db-postgres'
import { s3Storage } from '@payloadcms/storage-s3'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { withCors } from './utils/withCors'
import { addDataAndFileToRequest } from '@payloadcms/next/utilities'

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
  //serverURL: 'http://localhost:3000',
  csrf: ['https://www.nicolascarrillo.com', 'http://localhost:3000'],
  cors: {
    origins: ['https://www.nicolascarrillo.com', 'http://localhost:3000'],
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
              promedioreviews: true,
            },
          })

          const transformedDocs = result.docs.map((course) => {
            if (course.coverImage && typeof course.coverImage === 'object') {
              return {
                ...course,
                coverImage: course.coverImage.SupaURL || null,
              }
            }
            return course
          })

          const filteredDocs = transformedDocs.filter((course) => course.estado !== 'oculto')

          return Response.json(filteredDocs, { status: 200 })
        } catch (error) {
          console.error('Error en /courses:', error)
          return Response.json({ error: 'Error al obtener cursos' }, { status: 500 })
        }
      }),
    },
    {
      path: '/courseshome',
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
              promedioreviews: true,
            },
          })

          // Primero transformamos los objetos coverImage
          const transformedDocs = result.docs.map((course) => {
            if (course.coverImage && typeof course.coverImage === 'object') {
              return {
                ...course,
                coverImage: course.coverImage.SupaURL || null,
              }
            }
            return course
          })

          // Filtramos para omitir los cursos con estado "oculto"
          const filteredDocs = transformedDocs.filter((course) => course.estado !== 'oculto')

          // Tomamos solamente los primeros 3 cursos
          const limitedDocs = filteredDocs.slice(0, 3)

          return Response.json(limitedDocs, { status: 200 })
        } catch (error) {
          console.error('Error en /courses:', error)
          return Response.json({ error: 'Error al obtener cursos' }, { status: 500 })
        }
      }),
    },
    {
      path: '/average-reviews',
      method: 'get',
      handler: withCors(async (req) => {
        try {
          // 1. Obtenemos el cursoId de la query
          const urlString = (req.url ?? 'http://localhost') as string
          const url = new URL(urlString, 'http://localhost')
          const cursoId = url.searchParams.get('cursoId')

          if (!cursoId) {
            return Response.json({ error: 'Falta el parámetro "cursoId"' }, { status: 400 })
          }

          // 2. Obtenemos las reseñas asociadas a ese curso
          const reviewsUrl = `https://kmcs-backend-us-production.up.railway.app/api/reviews-cursos-virtuales?depth=0&where[curso][equals]=${cursoId}`
          const response = await fetch(reviewsUrl)
          if (!response.ok) {
            throw new Error(`Error al obtener reseñas: ${response.statusText}`)
          }
          const data = await response.json()
          const { docs = [] } = data

          // 3. Calculamos el promedio
          if (docs.length === 0) {
            // Sin reseñas => promedio = 0
            return Response.json({ averageRating: 0, totalReviews: 0 }, { status: 200 })
          }

          // Suponemos que la calificación está en "estrellas"
          const sum = docs.reduce((acc: number, review: { estrellas?: number }) => {
            return acc + (review.estrellas || 0)
          }, 0)
          const averageRating = sum / docs.length

          // 4. Hacemos PATCH a /api/cursos/[cursoId] para actualizar "promedioreviews"
          //    Esto llama a la API REST de Payload en la ruta "Update by ID"
          //    (Si tu colección tiene auth, quizá necesites Authorization header)
          const patchResponse = await fetch(
            `https://kmcs-backend-us-production.up.railway.app/api/cursos/${cursoId}`,
            {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                promedioreviews: averageRating, // Campo que queremos actualizar
              }),
            },
          )

          if (!patchResponse.ok) {
            throw new Error(`Error al actualizar curso: ${patchResponse.statusText}`)
          }

          // (Opcional) Puedes leer la respuesta del PATCH si deseas
          // const updatedCurso = await patchResponse.json()

          // 5. Retornamos el promedio y la cantidad de reseñas
          return Response.json(
            {
              averageRating,
              totalReviews: docs.length,
            },
            { status: 200 },
          )
        } catch (error) {
          console.error('Error en /average-reviews:', error)
          return Response.json(
            { error: 'Error al obtener/actualizar promedio de reseñas' },
            { status: 500 },
          )
        }
      }),
    },
    {
      path: '/validate-cart',
      method: 'post',
      handler: async (req) => {
        try {
          await addDataAndFileToRequest(req) // -> req.data
          const { productIds, userIdentifier } = req.data as any

          if (!userIdentifier) {
            return Response.json({ error: 'Falta userIdentifier' }, { status: 400 })
          }
          if (!Array.isArray(productIds) || productIds.length === 0) {
            return Response.json({ error: 'No se enviaron IDs de productos' }, { status: 400 })
          }

          // Ejemplo: fetch a otro endpoint tuyo
          const resCursos = await fetch(`${req.payload.config.serverURL}/api/courses`)
          if (!resCursos.ok) {
            return Response.json({ error: 'Error interno fetch cursos' }, { status: 500 })
          }
          const cursosData = await resCursos.json()
          const courses = cursosData.docs || []

          // Armar validatedCart (similar a tu código)
          const validatedCart = productIds
            .map((id: string) => {
              const course = courses.find((c: any) => c.id === id)
              if (!course) return null
              return {
                id: course.id,
                title: course.title,
                price: course.precioConDescuento || course.precio,
              }
            })
            .filter(Boolean)

          return Response.json({ success: true, validatedCart })
        } catch (error: any) {
          console.error('Error en /validate-cart:', error)
          return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
        }
      },
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
