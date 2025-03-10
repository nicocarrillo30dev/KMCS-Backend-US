// storage-adapter-import-placehold
import { postgresAdapter } from '@payloadcms/db-postgres'
import { s3Storage } from '@payloadcms/storage-s3'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'
import { resendAdapter } from '@payloadcms/email-resend'

import { withCors } from './utils/withCors'
import { addDataAndFileToRequest } from '@payloadcms/next/utilities'

import crypto from 'crypto'

import { es } from '@payloadcms/translations/languages/es'

import { CapturaDePagos } from './collections/CapturasPagos'
import { Categorias } from './collections/Categorias'
import { Cursos } from './collections/Cursos'
import { Cupones } from './collections/Cupones'
import { Enrollment } from './collections/Enrollment'
import { FotosPreguntas } from './collections/FotosPreguntas'
import { FotosUsuarios } from './collections/FotosUsuarios'
import { IngredientesMuffins } from './collections/IngredientesMuffins'
import { Imagenes } from './collections/Imagenes'
import { ImagenesReviews } from './collections/ImagenesReviews'
import { Membresias } from './collections/Membership'
import { pedidos } from './collections/Orders'
import PreguntasRespuestas from './collections/PreguntasAlumnos'
import { RegistroDeMembresias } from './collections/RegistroMembresia'
import { RecetasMuffins } from './collections/RecetasMuffins'
import ReviewsCursosVirtuales from './collections/ReseñasCursosVirtuales'
import ReviewsTalleresPresenciales from './collections/ReseñasTalleresPresenciales'
import { TalleresPresenciales } from './collections/TalleresPresenciales'
import { Usuarios } from './collections/Usuarios'

const ephemeralCartsStore: Record<string, any> = {}

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const IZIPAY_USER = process.env.IZIPAY_USER || '27059081'
const IZIPAY_PASSWORD =
  process.env.IZIPAY_PASSWORD || 'testpassword_Ha0g86Dd5BWsmAfYLKNztGz208husq08sqhFCI3CYOzBD'

type UploadFile = {
  data: Buffer
  mimetype: string
  name: string
  size: number
  tempFilePath?: string
}

type PaymentSuccessFormData = {
  'kr-answer'?: string
  'kr-hash'?: string
}

type IpnBody = {
  'kr-answer'?: string
  'kr-hash'?: string
}

export default buildConfig({
  email: resendAdapter({
    defaultFromAddress: 'informes@kathymonzon.com',
    defaultFromName: 'Kathy Monzón Cake Studio',
    apiKey: process.env.RESEND_API_KEY || '',
  }),

  admin: {
    user: Usuarios.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  i18n: {
    supportedLanguages: { es },
    fallbackLanguage: 'es',
  },

  // 👁️J👁️ cuando quieras probar en local, desactiva todos los dominios

  serverURL: 'https://admin.kathymonzon.com',
  //serverURL: 'http://localhost:3000',
  csrf: [
    'https://www.kathymonzon.com',
    //'http://localhost:3000',
    'https://server-production-021a.up.railway.app',
  ],

  cors: {
    origins: [
      'https://www.kathymonzon.com',
      //'http://localhost:3000',
      'https://server-production-021a.up.railway.app',
    ],
    headers: ['Content-Type', 'Authorization'],
  },
  endpoints: [
    //lemonsqueez
    {
      path: '/create-lemon-checkout',
      method: 'post',
      handler: withCors(async (req) => {
        try {
          // 1) Cargar data que viene del front
          await addDataAndFileToRequest(req)
          const { total, productName, userEmail, cartToken } = req.data as any

          if (!total || total < 1) {
            return Response.json({ error: 'Total inválido' }, { status: 400 })
          }

          // 2) Configurar la API Key y store_id de Lemon Squeezy
          const LEMON_API_KEY = process.env.LEMON_API_KEY
          if (!LEMON_API_KEY) {
            return Response.json({ error: 'No hay API Key para Lemon Squeezy' }, { status: 500 })
          }
          const LEMON_STORE_ID = process.env.LEMON_STORE_ID
          if (!LEMON_STORE_ID) {
            return Response.json({ error: 'No hay store_id configurado' }, { status: 500 })
          }

          // 3) Construir el payload (bodyData) de acuerdo a la especificación JSON:API
          const bodyData = {
            data: {
              type: 'checkouts',
              attributes: {
                store_id: LEMON_STORE_ID,
                prices: [
                  {
                    amount: total * 100, // total en centavos
                    currency: 'USD',
                    name: productName || 'Cursos Pastelería',
                  },
                ],
                success_url: 'https://www.kathymonzon.com/thank-you-lemon',
                cancel_url: 'https://www.kathymonzon.com/checkout',
                checkout_data: {
                  customer_email: userEmail,
                },
                custom: {
                  cartToken, // Debe estar definido (recibido desde el front o generado en el backend)
                },
              },
            },
          }

          // Opcional: loguea bodyData para depuración
          console.log('bodyData enviado a Lemon Squeezy:', bodyData)

          // 4) Llamar a la API de Lemon Squeezy
          const apiResp = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/vnd.api+json',
              Accept: 'application/vnd.api+json',
              Authorization: `Bearer ${LEMON_API_KEY}`,
            },
            body: JSON.stringify(bodyData),
          })

          if (!apiResp.ok) {
            console.error('Lemon Squeezy API error:', apiResp.status, apiResp.statusText)
            const errorResponse = await apiResp.text()
            console.error('Detalles del error:', errorResponse)
            return Response.json(
              { error: 'Error creando checkout en Lemon Squeezy' },
              { status: 500 },
            )
          }

          const json = await apiResp.json()
          const checkoutUrl = json?.data?.attributes?.url
          if (!checkoutUrl) {
            console.error('No se obtuvo checkoutUrl de Lemon Squeezy:', json)
            return Response.json(
              { error: 'No se pudo obtener el URL de checkout' },
              { status: 500 },
            )
          }

          // 5) Retornar la URL al frontend
          return Response.json({ checkoutUrl }, { status: 200 })
        } catch (error) {
          console.error('/create-lemon-checkout error:', error)
          return Response.json({ error: 'Error interno al crear checkout' }, { status: 500 })
        }
      }),
    },
    // ✅ DONE ✅
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
    // ✅ DONE ✅
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
          const reviewsUrl = `https://admin.kathymonzon.com/api/reviews-cursos-virtuales?depth=0&where[curso][equals]=${cursoId}`
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
          const patchResponse = await fetch(`https://admin.kathymonzon.com/api/cursos/${cursoId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              promedioreviews: averageRating, // Campo que queremos actualizar
            }),
          })

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
    // magic
    {
      path: '/validate-cart',
      method: 'post',
      handler: withCors(async (req) => {
        try {
          await addDataAndFileToRequest(req)
          const { productArray, userIdentifier } = req.data as any

          if (!userIdentifier) {
            return Response.json({ error: 'Falta userIdentifier' }, { status: 400 })
          }
          if (!Array.isArray(productArray) || productArray.length === 0) {
            return Response.json({ error: 'No se enviaron productos' }, { status: 400 })
          }

          // 1. Fetch colecciones
          const resCursos = await fetch(`${req.payload.config.serverURL}/api/cursos?limit=150`)
          if (!resCursos.ok) {
            return Response.json({ error: 'Error interno al obtener cursos' }, { status: 500 })
          }
          const dataCursos = await resCursos.json()
          const courses = dataCursos.docs || dataCursos

          const resTalleres = await fetch(
            `${req.payload.config.serverURL}/api/talleres-presenciales`,
          )
          if (!resTalleres.ok) {
            return Response.json(
              { error: 'Error interno al obtener talleres presenciales' },
              { status: 500 },
            )
          }
          const dataTalleres = await resTalleres.json()
          const talleres = dataTalleres.docs || dataTalleres

          const resMembresias = await fetch(`${req.payload.config.serverURL}/api/membresias`)
          if (!resMembresias.ok) {
            return Response.json({ error: 'Error interno al obtener membresías' }, { status: 500 })
          }
          const dataMembresias = await resMembresias.json()
          const membresias = dataMembresias.docs || dataMembresias

          // 2. Recorremos el "productArray" para validar
          const validatedCart = productArray
            .map((clientItem) => {
              // Desestructuramos con "let" y renombramos para poder reasignar
              const {
                payloadId,
                type,
                frontImage,
                selectedGroupId: localSelectedGroupId,
              } = clientItem

              let {
                selectedGroupHorario: localSelectedGroupHorario,
                selectedGroupFechas: localSelectedGroupFechas,
              } = clientItem

              let foundDoc = null

              // 2a. Identificamos cuál colección buscar
              if (type === 'curso virtual') {
                foundDoc = courses.find((c: any) => c.id === payloadId)
              } else if (type === 'taller presencial') {
                foundDoc = talleres.find((t: any) => t.id === payloadId)
              } else if (type === 'membresía') {
                foundDoc = membresias.find((m: any) => m.id === payloadId)
              } else {
                // Tipo desconocido
                return null
              }

              if (!foundDoc) {
                console.log(`Producto no encontrado: payloadId=${payloadId}, tipo=${type}`)
                return null
              }

              // 2b. Precios
              let originalPrice = 0
              let discountedPrice = null

              if (type === 'curso virtual') {
                originalPrice = foundDoc.precio || 0
                discountedPrice = foundDoc.precioConDescuento || null
              } else if (type === 'taller presencial') {
                originalPrice = foundDoc.precio || 0
              } else if (type === 'membresía') {
                originalPrice = foundDoc.Precio || 0
              }

              const membershipDiscountPrice = null
              const finalPrice = discountedPrice ?? originalPrice

              // 2c. Imagen final
              let finalImage = null
              if (foundDoc.coverImage && foundDoc.coverImage.SupaURL) {
                finalImage = foundDoc.coverImage.SupaURL
              } else {
                finalImage = frontImage || null
              }

              // 2d. Validamos taller presencial con el grupo seleccionado
              if (type === 'taller presencial' && localSelectedGroupId) {
                const foundGroup = foundDoc.gruposDeFechas?.find(
                  (g: any) => g.id === localSelectedGroupId,
                )

                if (!foundGroup) {
                  console.log(
                    `No existe el grupo con id=${localSelectedGroupId} para el taller=${payloadId}`,
                  )
                  return null
                }

                // Sobrescribimos con la data real del backend
                localSelectedGroupHorario = foundGroup.horario
                localSelectedGroupFechas = foundGroup.fechas
              }

              // 2e. Construimos objeto final validado
              return {
                id: foundDoc.id,
                type,
                title: foundDoc.title || foundDoc.nombre || 'Sin título',
                coverImage: finalImage,
                // Precios
                originalPrice,
                discountedPrice,
                membershipDiscountPrice,
                finalPrice,
                // Info extra (taller presencial, etc.)
                selectedGroupId: localSelectedGroupId,
                selectedGroupHorario: localSelectedGroupHorario,
                selectedGroupFechas: localSelectedGroupFechas,
              }
            })
            .filter(Boolean) // Quitar nulos

          /*
          // === Lógica de promoción para curso "Galletas para Emprender" gratis ===
          // Si el total del carrito, sin contar el curso promocional (payloadId 111),
          // es mayor o igual a 98 soles, se pone el precio del curso "Galletas para Emprender" a 0.
          const PROMO_THRESHOLD = 98
          const freeCourseDocId = 111

          // Filtramos nulos/undefined, validamos que sea un objeto con la propiedad "id"
          // y excluimos el curso promo (id=111)
          const totalWithoutPromo = validatedCart
            .filter(
              (item: any) =>
                item && typeof item === 'object' && 'id' in item && item.id !== freeCourseDocId,
            )
            .reduce((acc: number, item: any) => acc + Number(item.finalPrice ?? 0), 0)

          if (totalWithoutPromo >= PROMO_THRESHOLD) {
            validatedCart.forEach((item: any) => {
              // Verificamos que item sea un objeto con la propiedad "id"
              if (item && typeof item === 'object' && 'id' in item && item.id === freeCourseDocId) {
                item.originalPrice = 0
                item.discountedPrice = 0 // Se fuerza el discount price a 0 también
                item.finalPrice = 0
              }
            })
          }
          // === Fin de la lógica de promoción para curso gratis ===
          */

          /* 
          // ================================================
          // AÑADIMOS LA LÓGICA PARA LA PROMO 2x1 (Buttercream)
          // ================================================
          const BUTTERCREAM_IDS = [14893, 43378, 14915, 39885]
    
          // 1) Filtramos los cursos que apliquen a la promo (BUTTERCREAM_IDS)
          const buttercreamItems = validatedCart.filter((item: any) =>
            BUTTERCREAM_IDS.includes(item.id),
          )
    
          // 2) Ordenamos por finalPrice de menor a mayor
          buttercreamItems.sort((a: any, b: any) => a.finalPrice - b.finalPrice)
    
          // 3) Por cada par, uno es gratis (el más barato)
          const pairsCount = Math.floor(buttercreamItems.length / 2)
          const discountedItems = buttercreamItems.slice(0, pairsCount)
    
          // 4) Asignamos originalPrice y finalPrice = 0 a los que salen gratis
          discountedItems.forEach((discountedItem: any) => {
            const idx = validatedCart.findIndex((ic: any) => ic.id === discountedItem.id)
            if (idx !== -1) {
              validatedCart[idx]!.originalPrice = 0
              validatedCart[idx]!.finalPrice = 0
            }
          })
          // ================================================
          // FIN DE LA LÓGICA PROMO 2x1
          // ================================================
          */

          // 3. Guardar en memoria efímera
          const cartId = Math.random().toString(36).substring(2, 12)
          ephemeralCartsStore[cartId] = validatedCart

          // 4. Responder
          return new Response(JSON.stringify({ success: true, validatedCart }), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Set-Cookie': `cartId=${cartId}; Path=/; HttpOnly; Secure; SameSite=None;`,
            },
          })
        } catch (error) {
          console.error('Error en /validate-cart:', error)
          return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
        }
      }),
    },
    {
      path: '/checkout-data',
      method: 'get',
      handler: withCors(async (req) => {
        try {
          const cookieHeader = req.headers.get('cookie') || ''
          const match = cookieHeader.match(/cartId=([^;]+)/)
          if (!match) {
            return Response.json({ validatedCart: [] }, { status: 200 })
          }
          const cartId = match[1]

          const validatedCart = ephemeralCartsStore[cartId] || []
          return Response.json({ validatedCart }, { status: 200 })
        } catch (error) {
          console.error('Error en /checkout-data:', error)
          return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
        }
      }),
    },

    //izipay
    {
      path: '/izipay-token',
      method: 'post',
      handler: withCors(async (req) => {
        try {
          // (Opcional) Si necesitas parsear form-data:
          // await addDataAndFileToRequest(req);

          // Pero si el front te envía JSON en el body, puedes parsearlo así:
          const body = await req.json!()
          const { total, orderId, email } = body

          if (!total || !orderId || !email) {
            return Response.json(
              { error: 'Faltan parámetros obligatorios: total, orderId, email' },
              { status: 400 },
            )
          }

          // Llamamos a la API de Izipay
          const response = await fetch(
            'https://api.micuentaweb.pe/api-payment/V4/Charge/CreatePayment',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                // Autenticación Basic (usuario:contraseña en base64)
                Authorization:
                  'Basic ' + Buffer.from(`${IZIPAY_USER}:${IZIPAY_PASSWORD}`).toString('base64'),
              },
              body: JSON.stringify({
                amount: total, // Izipay maneja este valor en centavos. Ej: 180 => S/1.80
                currency: 'PEN',
                orderId,
                customer: {
                  email,
                },
              }),
            },
          )

          if (!response.ok) {
            const errorText = await response.text()
            console.error('Error de Izipay:', errorText)
            return Response.json({ error: 'Error al generar formToken en Izipay' }, { status: 500 })
          }

          const data = await response.json()
          // data.answer.formToken es lo que nos interesa
          const formToken = data?.answer?.formToken

          if (!formToken) {
            console.error('No se encontró formToken en la respuesta de Izipay:', data)
            return Response.json({ error: 'No se pudo obtener el formToken' }, { status: 500 })
          }

          // Devolvemos el token
          return Response.json({ formToken }, { status: 200 })
        } catch (error) {
          console.error('Error en /izipay-token:', error)
          return Response.json(
            { error: 'Error interno del servidor al generar formToken' },
            { status: 500 },
          )
        }
      }),
    },
    {
      path: '/payment-success',
      method: 'post',
      handler: withCors(async (req) => {
        try {
          // 1) Leer los datos del body
          //    Dependiendo de tu configuración, Payload CMS parsea x-www-form-urlencoded
          //    o form-data. Asegúrate de tener la configuración de parseo adecuada.
          // Aseguramos que req.body sea un PaymentSuccessFormData
          const body = req.body as PaymentSuccessFormData | undefined

          if (!body || !body['kr-answer']) {
            return Response.json({ error: 'No llegó kr-answer' }, { status: 400 })
          }

          const krAnswerString = body['kr-answer']
          const krHash = body['kr-hash']

          if (!krAnswerString) {
            return Response.json({ error: 'No llegó kr-answer' }, { status: 400 })
          }

          // 2) Convertir kr-answer a objeto JSON
          let answer
          try {
            answer = JSON.parse(krAnswerString)
          } catch (err) {
            return Response.json({ error: 'kr-answer es inválido' }, { status: 400 })
          }

          // 3) Verificar la firma con la 4ª clave HMAC-SHA-256 (del panel Izipay)
          //    Ej: "testsha256key_5e3htNb..."
          const hmacKey =
            process.env.IZIPAY_HMAC_KEY || 'k7UUT3ar8kC06yeXZk6KYyxp6GVD3Uw6yHffaJO7d2qZp'

          const computedHash = crypto
            .createHmac('sha256', hmacKey)
            .update(krAnswerString) // la cadena "json" en sí
            .digest('hex')

          if (!krHash || computedHash.toLowerCase() !== krHash.toLowerCase()) {
            console.error('Hash no coincide. Respuesta no auténtica.')
            return Response.json({ error: 'Hash mismatch' }, { status: 400 })
          }

          // 4) Revisar el estado del pago
          if (answer.orderStatus === 'PAID') {
            console.log('Pago exitoso. Detalles:', answer)
            // Aquí actualiza tu base de datos, envía correos, etc.
            return Response.json({ message: '¡Pago exitoso!', data: answer }, { status: 200 })
          } else {
            console.log('Pago NO completado. orderStatus:', answer.orderStatus)
            return Response.json({ message: 'Pago no completado', data: answer }, { status: 200 })
          }
        } catch (err) {
          console.error('Error en /payment-success:', err)
          return Response.json({ error: 'Error interno al procesar el pago' }, { status: 500 })
        }
      }),
    },
    {
      path: '/izipay-ipn',
      method: 'post',
      handler: withCors(async (req) => {
        try {
          // 1) Castear el body a nuestro tipo
          const body = req.body as IpnBody | undefined

          // 2) Asegurarnos de que existe y tiene "kr-answer"
          if (!body || !body['kr-answer']) {
            return Response.json({ error: 'No llegó kr-answer' }, { status: 400 })
          }

          // 3) Extraer las propiedades
          const krAnswerString = body['kr-answer']
          const krHash = body['kr-hash']

          if (!krAnswerString) {
            return Response.json({ error: 'No llegó kr-answer' }, { status: 400 })
          }

          let answer
          try {
            answer = JSON.parse(krAnswerString)
          } catch (err) {
            return Response.json({ error: 'kr-answer inválido' }, { status: 400 })
          }

          // La "2ª clave" se llama “Contraseña” en el panel Izipay
          // (key #2 en la sección "Claves de la API REST").
          const passwordKey =
            process.env.IZIPAY_PASSWORD_KEY ||
            'testpassword_Ha0g86Dd5BWsmAfYLKNztGz208husq08sqhFCI3CYOzBD'

          // Verificar la firma
          const computedHash = crypto
            .createHmac('sha256', passwordKey)
            .update(krAnswerString)
            .digest('hex')

          if (!krHash || computedHash.toLowerCase() !== krHash.toLowerCase()) {
            console.error('Hash no coincide en IPN. Respuesta no auténtica.')
            return Response.json({ error: 'Hash mismatch' }, { status: 400 })
          }

          // Revisar answer.orderStatus, etc.
          if (answer.orderStatus === 'PAID') {
            console.log('IPN: Pago completado con éxito. Detalles:', answer)
            // Actualiza BD, etc.
          } else {
            console.log('IPN: Pago con estado =', answer.orderStatus)
          }

          // Izipay requiere que devuelvas 200 OK
          return Response.json({ success: true }, { status: 200 })
        } catch (err) {
          console.error('Error en /izipay-ipn:', err)
          return Response.json({ error: 'Error interno en IPN' }, { status: 500 })
        }
      }),
    },
    {
      path: '/create-order',
      method: 'post',
      handler: withCors(async (req) => {
        try {
          // Se espera recibir un JSON con:
          // userData, products, total, discountedTotal, coupon y selectedMethod
          const body = await req.json!() // usamos req.json!() para evitar el error de TS
          const {
            userData,
            products,
            total,
            discountedTotal,
            coupon,
            selectedMethod,
            capturaPago,
          } = body

          // Genera el pedidoID usando uuidv4
          const pedidoID = uuidv4()

          // Función auxiliar para extraer el número del id, en caso de venir en formato "taller-4", "curso-xxx" o "membresia-xxx"
          const extractNumericId = (id: string, prefix: string): number => {
            return Number(id.replace(prefix, ''))
          }

          // Para cada producto, nos aseguramos de obtener la referencia numérica
          const cursos = products
            .filter((p: any) => p.type === 'curso virtual')
            .map((p: any) => ({
              cursoRef:
                typeof p.payloadId !== 'undefined'
                  ? Number(p.payloadId)
                  : extractNumericId(String(p.id), 'curso-'),
              price: p.originalPrice,
              pricewithDiscount: p.discountedPrice,
              customTotalPrice: null,
              discountApplied:
                p.originalPrice !== p.finalPrice ? p.originalPrice - p.finalPrice : null,
              finalPrice: p.finalPrice,
            }))

          const talleresPresenciales = products
            .filter((p: any) => p.type === 'taller presencial')
            .map((p: any) => ({
              // Usamos "tallerRef" y nos aseguramos que sea un número
              tallerRef:
                typeof p.payloadId !== 'undefined'
                  ? Number(p.payloadId)
                  : extractNumericId(String(p.id), 'taller-'),
              price: p.originalPrice,
              pricewithDiscount: p.discountedPrice,
              customTotalPrice: null,
              discountApplied:
                p.originalPrice !== p.finalPrice ? p.originalPrice - p.finalPrice : null,
              finalPrice: p.finalPrice,
              schedule: p.schedule || null,
            }))

          const membresias = products
            .filter((p: any) => p.type === 'membresía')
            .map((p: any) => ({
              membresiaRef:
                typeof p.payloadId !== 'undefined'
                  ? Number(p.payloadId)
                  : extractNumericId(String(p.id), 'membresia-'),
              price: p.originalPrice,
              customTotalPrice: null,
              discountApplied: null,
              finalPrice: p.finalPrice,
            }))

          const activeCouponToSend = discountedTotal ? coupon : null
          const finalTotal = discountedTotal ?? total
          const metodoDePago =
            selectedMethod === 'bankTransfer' ? 'Transferencia Bancaria' : 'Tarjeta de Crédito'

          // Construir el objeto del pedido (asegúrate de que coincida con el schema de la colección "pedidos")
          const orderData = {
            pedidoID,
            date: new Date().toISOString(),
            state: 'pendiente',
            client: userData.id,
            nombre: userData.nombre,
            apellidos: userData.apellidos,
            country: userData.country,
            phone: userData.phone,
            payment: metodoDePago,
            capturaPago,
            activeCoupon: activeCouponToSend,
            cursos,
            talleresPresenciales,
            membresias,
            totalPrice: finalTotal,
          }

          // Usamos req.payload! para forzar que no sea undefined y hacemos un cast a any
          const createdOrder = await req.payload!.create({
            collection: 'pedidos',
            data: orderData as any,
          })

          return Response.json(createdOrder, { status: 200 })
        } catch (error) {
          console.error('Error creating order:', error)
          return Response.json(
            { error: 'Error interno del servidor al crear el pedido' },
            { status: 500 },
          )
        }
      }),
    },
    {
      path: '/get-user-by-email',
      method: 'get',
      handler: withCors(async (req) => {
        const urlString = req.url || 'http://localhost'
        const url = new URL(urlString, 'http://localhost')
        const email = url.searchParams.get('email')

        if (!email) {
          return Response.json({ error: 'Falta email' }, { status: 400 })
        }

        const result = await req.payload.find({
          collection: 'usuarios',
          where: {
            email: {
              equals: email,
            },
          },
          limit: 1,
        })

        if (result.docs.length > 0) {
          return Response.json({ user: result.docs[0] }, { status: 200 })
        }

        return Response.json({ user: null }, { status: 200 })
      }),
    },
    {
      path: '/create-user',
      method: 'post',
      handler: withCors(async (req) => {
        try {
          await addDataAndFileToRequest(req)

          const data: any = req.data

          const created = await req.payload.create({
            collection: 'usuarios',
            data,
          })

          console.log('Usuario creado con éxito (forzando any):', created)
          return Response.json({ success: true, user: created }, { status: 201 })
        } catch (error) {
          console.error('Error al crear usuario:', error)
          return Response.json({ error: 'Error interno' }, { status: 500 })
        }
      }),
    },
    {
      path: '/apply-coupon',
      method: 'post',
      handler: withCors(async (req) => {
        try {
          await addDataAndFileToRequest(req)
          const { couponCode, cartProducts } = req.data as any
          if (!couponCode || !Array.isArray(cartProducts)) {
            return Response.json({ error: 'Datos inválidos' }, { status: 400 })
          }

          // Buscar cupón
          const couponRes = await req.payload.find({
            collection: 'cupones',
            where: { code: { equals: couponCode } },
            depth: 1,
          })
          const coupon = couponRes.docs?.[0]
          if (!coupon) {
            return Response.json(
              { isValid: false, message: 'Cupón no encontrado' },
              { status: 404 },
            )
          }

          // 2) Verificar expiración (si existe)
          const expirationDate = coupon.expirationDate
            ? new Date(String(coupon.expirationDate))
            : null
          const now = new Date()
          if (expirationDate && now > expirationDate) {
            return Response.json({ isValid: false, message: 'Cupón expirado' }, { status: 400 })
          }

          // 3) Calcular total del carrito
          //    (aquí asumo que en cartProducts cada item trae "price")
          const total = cartProducts.reduce((acc: number, p: any) => acc + (p.finalPrice || 0), 0)

          // 4) Lógica de descuento según 'type' y 'amount'
          let discountAmount = 0

          if (coupon.type === 'percentage') {
            // e.g. 50 => 50% del total
            discountAmount = total * (coupon.amount / 100)
          } else {
            // 'fixed' => resta un monto fijo
            discountAmount = coupon.amount
          }

          // Evitar que descuento exceda el total
          if (discountAmount > total) {
            discountAmount = total
          }

          // 5) Aplica o no restricciones con "products", "excludeProducts", "categories", etc.
          //    ... Lógica adicional (opcional) ...

          // 6) Si "applyMode" === 'per-cart', basta con lo anterior
          //    Si 'per-course', deberíamos hacer un cálculo distinto para cada item
          //    y luego sumarlos.

          // 7) Cálculo final
          const discountedTotal = total - discountAmount

          // Respuesta
          return Response.json(
            {
              isValid: true,
              discountAmount,
              discountedTotal,
              message: 'Cupón aplicado con éxito',
            },
            { status: 200 },
          )
        } catch (error) {
          console.error('Error en /apply-coupon:', error)
          return Response.json({ error: 'Error interno' }, { status: 500 })
        }
      }),
    },
    // ✅ DONE ✅
    {
      path: '/myorders',
      method: 'get',
      handler: withCors(async (req) => {
        try {
          // 1. Extraer userId desde la query string
          const urlString = req.url ?? 'http://localhost'
          const url = new URL(urlString, 'http://localhost')
          const userId = url.searchParams.get('userId')

          if (!userId) {
            return Response.json(
              { error: 'Falta el parámetro "userId" en la query.' },
              { status: 400 },
            )
          }

          const numericUserId = Number(userId)

          // 2. Verificar que el usuario esté autenticado
          const user = req.user
          if (!user) {
            return Response.json({ error: 'No autenticado' }, { status: 401 })
          }

          // 3. Si el usuario no es admin, asegurarse de que su ID coincida con el userId proporcionado
          if (user.role !== 'Admin' && Number(user.id) !== numericUserId) {
            return Response.json({ error: 'No autorizado para ver estos pedidos' }, { status: 403 })
          }

          // 4. Consultar los pedidos de ese usuario
          const ordersResult = await req.payload.find({
            collection: 'pedidos',
            where: {
              client: { equals: numericUserId },
            },
            depth: 0,
            pagination: false,
          })

          const orders = ordersResult.docs

          // 5. Recolectar los IDs numéricos de las referencias en cada pedido
          const allCourseIDs = new Set<number>()
          const allTallerIDs = new Set<number>()
          const allMembresiaIDs = new Set<number>()

          for (const order of orders) {
            // A) Cursos
            if (Array.isArray(order.cursos)) {
              for (const course of order.cursos) {
                if (typeof course.cursoRef === 'number') {
                  allCourseIDs.add(course.cursoRef)
                }
              }
            }
            // B) Talleres Presenciales
            if (Array.isArray(order.talleresPresenciales)) {
              for (const taller of order.talleresPresenciales) {
                if (typeof taller.tallerRef === 'number') {
                  allTallerIDs.add(taller.tallerRef)
                }
              }
            }
            // C) Membresías
            if (Array.isArray(order.membresias)) {
              for (const mem of order.membresias) {
                if (typeof mem.membresiaRef === 'number') {
                  allMembresiaIDs.add(mem.membresiaRef)
                }
              }
            }
          }

          // Si no hay referencias en ninguna colección, retorna los pedidos directamente
          if (allCourseIDs.size === 0 && allTallerIDs.size === 0 && allMembresiaIDs.size === 0) {
            return Response.json(orders, { status: 200 })
          }

          // 6. Consultar las colecciones referenciadas en paralelo
          const [coursesResult, talleresResult, membresiasResult] = await Promise.all([
            allCourseIDs.size > 0
              ? req.payload.find({
                  collection: 'cursos',
                  pagination: false,
                  where: {
                    id: { in: Array.from(allCourseIDs) },
                  },
                  select: {
                    id: true,
                    title: true,
                    coverImage: true,
                  },
                })
              : Promise.resolve({ docs: [] }),
            allTallerIDs.size > 0
              ? req.payload.find({
                  collection: 'talleres-presenciales',
                  pagination: false,
                  where: {
                    id: { in: Array.from(allTallerIDs) },
                  },
                  select: {
                    id: true,
                    title: true,
                    coverImage: true,
                    precio: true,
                  },
                })
              : Promise.resolve({ docs: [] }),
            allMembresiaIDs.size > 0
              ? req.payload.find({
                  collection: 'membresias',
                  pagination: false,
                  where: {
                    id: { in: Array.from(allMembresiaIDs) },
                  },
                  select: {
                    id: true,
                    nombre: true,
                    Precio: true,
                  },
                })
              : Promise.resolve({ docs: [] }),
          ])

          // 7. Crear mapas para búsquedas rápidas
          const courseMap = new Map<number, any>()
          for (const c of coursesResult.docs) {
            courseMap.set(c.id, c)
          }

          const tallerMap = new Map<number, any>()
          for (const t of talleresResult.docs) {
            tallerMap.set(t.id, t)
          }

          const membresiaMap = new Map<number, any>()
          for (const m of membresiasResult.docs) {
            membresiaMap.set(m.id, m)
          }

          // 8. Fusionar la información adicional en cada pedido
          const mergedOrders = orders.map((order) => {
            const newOrder = { ...order }

            // A) Fusionar "cursos"
            if (Array.isArray(newOrder.cursos)) {
              newOrder.cursos = newOrder.cursos.map((courseItem) => {
                if (typeof courseItem.cursoRef === 'number') {
                  const matchingCourse = courseMap.get(courseItem.cursoRef)
                  if (matchingCourse) {
                    return {
                      ...courseItem,
                      title: matchingCourse.title,
                      coverImage:
                        matchingCourse.coverImage && typeof matchingCourse.coverImage === 'object'
                          ? (matchingCourse.coverImage.SupaURL ?? null)
                          : (matchingCourse.coverImage ?? null),
                    }
                  }
                }
                return courseItem
              })
            }

            // B) Fusionar "talleresPresenciales"
            if (Array.isArray(newOrder.talleresPresenciales)) {
              newOrder.talleresPresenciales = newOrder.talleresPresenciales.map((tallerItem) => {
                if (typeof tallerItem.tallerRef === 'number') {
                  const matchingTaller = tallerMap.get(tallerItem.tallerRef)
                  if (matchingTaller) {
                    return {
                      ...tallerItem,
                      title: matchingTaller.title,
                      precio: matchingTaller.precio,
                      coverImage:
                        matchingTaller.coverImage && typeof matchingTaller.coverImage === 'object'
                          ? (matchingTaller.coverImage.SupaURL ?? null)
                          : (matchingTaller.coverImage ?? null),
                    }
                  }
                }
                return tallerItem
              })
            }

            // C) Fusionar "membresias"
            if (Array.isArray(newOrder.membresias)) {
              newOrder.membresias = newOrder.membresias.map((memItem) => {
                if (typeof memItem.membresiaRef === 'number') {
                  const matchingMembresia = membresiaMap.get(memItem.membresiaRef)
                  if (matchingMembresia) {
                    return {
                      ...memItem,
                      nombre: matchingMembresia.nombre,
                      precioDefinidoEnColeccion: matchingMembresia.Precio,
                    }
                  }
                }
                return memItem
              })
            }

            return newOrder
          })

          // 9. Retornar los pedidos fusionados
          return Response.json(mergedOrders, { status: 200 })
        } catch (error) {
          console.error('Error en /myorders:', error)
          return Response.json({ error: 'Error al obtener pedidos' }, { status: 500 })
        }
      }),
    },
    // ✅ DONE ✅
    {
      path: '/myorder-by-pedidoid',
      method: 'get',
      handler: withCors(async (req) => {
        try {
          // 1) Get the 'pedidoID' from the query string
          const urlString = req.url ?? 'http://localhost'
          const url = new URL(urlString, 'http://localhost')
          const pedidoID = url.searchParams.get('pedidoID')

          if (!pedidoID) {
            return Response.json({ error: 'Falta el parámetro "pedidoID"' }, { status: 400 })
          }

          // 2) Fetch the single "pedidos" doc with that pedidoID, depth=0
          const orderResult = await req.payload.find({
            collection: 'pedidos',
            where: {
              pedidoID: { equals: pedidoID },
            },
            depth: 0,
            pagination: false,
          })

          if (!orderResult.docs || orderResult.docs.length === 0) {
            return Response.json({ error: 'Pedido no encontrado' }, { status: 404 })
          }

          // We'll assume the first (and only) doc is our order
          const order = orderResult.docs[0]

          // 3) Gather references from cursos, talleresPresenciales, membresias
          const allCourseIDs = new Set<number>()
          const allTallerIDs = new Set<number>()
          const allMembresiaIDs = new Set<number>()

          if (Array.isArray(order.cursos)) {
            for (const c of order.cursos) {
              if (typeof c.cursoRef === 'number') {
                allCourseIDs.add(c.cursoRef)
              }
            }
          }
          if (Array.isArray(order.talleresPresenciales)) {
            for (const t of order.talleresPresenciales) {
              if (typeof t.tallerRef === 'number') {
                allTallerIDs.add(t.tallerRef)
              }
            }
          }
          if (Array.isArray(order.membresias)) {
            for (const m of order.membresias) {
              if (typeof m.membresiaRef === 'number') {
                allMembresiaIDs.add(m.membresiaRef)
              }
            }
          }

          // If no refs at all, just return the order
          if (allCourseIDs.size === 0 && allTallerIDs.size === 0 && allMembresiaIDs.size === 0) {
            return Response.json(order, { status: 200 })
          }

          // 4) Fetch referenced docs from each collection
          const [coursesResult, talleresResult, membresiasResult] = await Promise.all([
            allCourseIDs.size > 0
              ? req.payload.find({
                  collection: 'cursos',
                  pagination: false,
                  where: {
                    id: { in: Array.from(allCourseIDs) },
                  },
                  select: {
                    id: true,
                    title: true,
                    coverImage: true,
                  },
                })
              : Promise.resolve({ docs: [] }),

            allTallerIDs.size > 0
              ? req.payload.find({
                  collection: 'talleres-presenciales',
                  pagination: false,
                  where: {
                    id: { in: Array.from(allTallerIDs) },
                  },
                  select: {
                    id: true,
                    title: true,
                    coverImage: true,
                    precio: true,
                  },
                })
              : Promise.resolve({ docs: [] }),

            allMembresiaIDs.size > 0
              ? req.payload.find({
                  collection: 'membresias',
                  pagination: false,
                  where: {
                    id: { in: Array.from(allMembresiaIDs) },
                  },
                  select: {
                    id: true,
                    nombre: true,
                    Precio: true,
                  },
                })
              : Promise.resolve({ docs: [] }),
          ])

          // 5) Create Maps for quick lookup
          const courseMap = new Map<number, any>()
          for (const c of coursesResult.docs) {
            courseMap.set(c.id, c)
          }

          const tallerMap = new Map<number, any>()
          for (const t of talleresResult.docs) {
            tallerMap.set(t.id, t)
          }

          const membresiaMap = new Map<number, any>()
          for (const mem of membresiasResult.docs) {
            membresiaMap.set(mem.id, mem)
          }

          // 6) Merge the data back into the single order
          const finalOrder = JSON.parse(JSON.stringify(order)) // clone

          // Merge cursos
          if (Array.isArray(finalOrder.cursos)) {
            finalOrder.cursos = finalOrder.cursos.map((c: any) => {
              if (typeof c.cursoRef === 'number') {
                const found = courseMap.get(c.cursoRef)
                if (found) {
                  return {
                    ...c,
                    title: found.title,
                    coverImage:
                      found.coverImage && typeof found.coverImage === 'object'
                        ? (found.coverImage.SupaURL ?? null)
                        : (found.coverImage ?? null),
                  }
                }
              }
              return c
            })
          }

          // Merge talleresPresenciales
          if (Array.isArray(finalOrder.talleresPresenciales)) {
            finalOrder.talleresPresenciales = finalOrder.talleresPresenciales.map((t: any) => {
              if (typeof t.tallerRef === 'number') {
                const found = tallerMap.get(t.tallerRef)
                if (found) {
                  return {
                    ...t,
                    title: found.title,
                    precio: found.precio,
                    coverImage:
                      found.coverImage && typeof found.coverImage === 'object'
                        ? (found.coverImage.SupaURL ?? null)
                        : (found.coverImage ?? null),
                  }
                }
              }
              return t
            })
          }

          // Merge membresias
          if (Array.isArray(finalOrder.membresias)) {
            finalOrder.membresias = finalOrder.membresias.map((m: any) => {
              if (typeof m.membresiaRef === 'number') {
                const found = membresiaMap.get(m.membresiaRef)
                if (found) {
                  return {
                    ...m,
                    nombre: found.nombre,
                    precioDefinidoEnColeccion: found.Precio,
                  }
                }
              }
              return m
            })
          }

          // 7) Return the final merged order
          return Response.json(finalOrder, { status: 200 })
        } catch (error) {
          console.error('Error en /myorder-by-pedidoid:', error)
          return Response.json({ error: 'Error al obtener pedido' }, { status: 500 })
        }
      }),
    },
    // ✅ DONE ✅
    {
      path: '/attendance-courses',
      method: 'get',
      handler: withCors(async (req) => {
        try {
          const result = await req.payload.find({
            collection: 'talleres-presenciales',
            pagination: false,
            select: {
              id: true,
              title: true,
              slug: true,
              estado: true,
              precio: true,
              coverImage: true,
              promedioreviews: true,
              gruposDeFechas: true,
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
          console.error('Error en /attendance-courses:', error)
          return Response.json({ error: 'Error al obtener cursos presenciales' }, { status: 500 })
        }
      }),
    },
    {
      path: '/average-reviews-talleres',
      method: 'get',
      handler: withCors(async (req) => {
        try {
          // 1. Obtener el `tallerId` de la query
          const urlString = (req.url ?? 'http://localhost') as string
          const url = new URL(urlString, 'http://localhost')
          const tallerId = url.searchParams.get('tallerId')

          if (!tallerId) {
            return new Response(JSON.stringify({ error: 'Falta el parámetro "tallerId"' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            })
          }

          // 2. Obtener las reseñas asociadas a ese taller
          const reviewsUrl = `https://admin.kathymonzon.com/api/reviews-talleres-presenciales?depth=0&where[taller][equals]=${tallerId}`
          const response = await fetch(reviewsUrl)
          if (!response.ok) {
            throw new Error(`Error al obtener reseñas: ${response.statusText}`)
          }
          const data = await response.json()
          const { docs = [] } = data

          // 3. Calcular el promedio de estrellas
          if (docs.length === 0) {
            // Sin reseñas => promedio = 0
            return new Response(JSON.stringify({ averageRating: 0, totalReviews: 0 }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            })
          }

          // Suponemos que la calificación está en "estrellas"
          const sum = docs.reduce((acc: number, review: { estrellas?: number }) => {
            return acc + (review.estrellas || 0)
          }, 0)
          const averageRating = sum / docs.length

          // 4. Hacer PATCH a /api/talleres-presenciales/[tallerId] para actualizar "promedioreviews"
          const patchResponse = await fetch(
            `https://admin.kathymonzon.com/api/talleres-presenciales/${tallerId}`,
            {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                // Si tu colección tiene autenticación, agrega el header de autorización aquí
                // 'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({
                promedioreviews: averageRating, // Campo que queremos actualizar
              }),
            },
          )

          if (!patchResponse.ok) {
            throw new Error(`Error al actualizar taller: ${patchResponse.statusText}`)
          }

          // (Opcional) Puedes leer la respuesta del PATCH si deseas
          // const updatedTaller = await patchResponse.json()

          // 5. Retornar el promedio y la cantidad de reseñas
          return new Response(
            JSON.stringify({
              averageRating,
              totalReviews: docs.length,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          )
        } catch (error) {
          console.error('Error en /average-reviews-talleres:', error)
          return new Response(
            JSON.stringify({ error: 'Error al obtener/actualizar promedio de reseñas' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
          )
        }
      }),
    },
    {
      path: '/preguntas-usuario',
      method: 'get',
      handler: withCors(async (req) => {
        try {
          // 1. Obtener el usuarioId de la query.
          const urlString = (req.url ?? 'http://localhost') as string
          const url = new URL(urlString, 'http://localhost')
          const usuarioId = url.searchParams.get('usuarioId')

          if (!usuarioId) {
            return Response.json({ error: 'Falta el parámetro "usuarioId"' }, { status: 400 })
          }

          // 2. Buscar en "preguntasRespuestas" (depth=0)
          const preguntasResult = await req.payload.find({
            collection: 'preguntasRespuestas',
            depth: 0,
            where: {
              usuario: {
                equals: usuarioId,
              },
            },
          })

          const { docs } = preguntasResult

          // 3. Reunir IDs de imágenes y IDs de cursos
          const imageIds: number[] = []
          const courseIds: number[] = []

          docs.forEach((doc) => {
            // Recolectar imágenes
            doc.mensajes?.forEach((msg: any) => {
              if (msg.tipo === 'imagen' && msg.imagen) {
                const numericID = Number(msg.imagen)
                if (!Number.isNaN(numericID)) {
                  imageIds.push(numericID)
                }
              }
            })

            // Recolectar ID del curso
            if (typeof doc.curso === 'number') {
              courseIds.push(doc.curso)
            } else if (typeof doc.curso === 'string') {
              const numID = Number(doc.curso)
              if (!Number.isNaN(numID)) {
                courseIds.push(numID)
              }
            }
          })

          // 4. Mapa de fotos: { idFoto: docFotoCompleto }
          let imagesMap: Record<number, any> = {}
          if (imageIds.length > 0) {
            const fotosResult = await req.payload.find({
              collection: 'fotosPreguntas',
              depth: 0,
              where: {
                id: {
                  in: imageIds,
                },
              },
            })

            if (fotosResult?.docs?.length > 0) {
              imagesMap = fotosResult.docs.reduce((acc: Record<number, any>, foto: any) => {
                acc[foto.id] = foto
                return acc
              }, {})
            }
          }

          // 5. Mapa de cursos: { idCurso: titleCurso }
          let coursesMap: Record<string, string> = {}
          const uniqueCourseIds = Array.from(new Set(courseIds))

          if (uniqueCourseIds.length > 0) {
            const cursosResult = await req.payload.find({
              collection: 'cursos',
              depth: 0,
              pagination: false,
              where: {
                id: {
                  in: uniqueCourseIds,
                },
              },
              select: {
                id: true,
                title: true,
              },
            })

            if (cursosResult?.docs?.length > 0) {
              coursesMap = cursosResult.docs.reduce((acc: Record<string, string>, course: any) => {
                acc[String(course.id)] = course.title
                return acc
              }, {})
            }
          }

          // 6. Transformar docs => "msg.imagen" = objeto de la colección fotosPreguntas
          const transformedDocs = docs.map((doc) => {
            const newMensajes =
              doc.mensajes?.map((msg: any) => {
                if (msg.tipo === 'imagen' && msg.imagen) {
                  const numID = Number(msg.imagen)
                  if (!Number.isNaN(numID) && imagesMap[numID]) {
                    // Asignamos el documento completo de la foto
                    return {
                      ...msg,
                      imagen: imagesMap[numID],
                    }
                  }
                  return {
                    ...msg,
                    imagen: null,
                  }
                }
                return msg
              }) ?? []

            const cursoIDStr = String(doc.curso)
            const cursoTitulo = coursesMap[cursoIDStr] || null

            return {
              ...doc,
              mensajes: newMensajes,
              cursoTitulo,
            }
          })

          return Response.json(transformedDocs, { status: 200 })
        } catch (error) {
          console.error('Error en /preguntas-usuario:', error)
          return Response.json({ error: 'Error al obtener las preguntas' }, { status: 500 })
        }
      }),
    },
    {
      path: '/registro',
      method: 'post',
      handler: withCors(async (req) => {
        try {
          // 👇 Asegura que `req.data` contenga el JSON correctamente parseado
          await addDataAndFileToRequest(req)

          // ✅ Define manualmente el tipo esperado en `req.data`
          const data = req.data as {
            nombre: string
            apellidos: string
            email: string
            password: string
          }

          const { nombre, apellidos, email, password } = data

          // 1. Validaciones mínimas
          if (!nombre || !apellidos || !email || !password) {
            return Response.json({ error: 'Todos los campos son obligatorios' }, { status: 400 })
          }

          // 2. Crear el usuario en Payload CMS
          const createdUser = await req.payload.create({
            collection: 'usuarios',
            data: {
              nombre,
              apellidos,
              email,
              password,
              role: 'User',
            },
            overrideAccess: true,
          })

          console.log('Usuario creado en Payload:', createdUser)

          return Response.json(
            {
              message: 'Usuario creado con éxito',
              user: createdUser,
            },
            { status: 201 },
          )
        } catch (error) {
          console.error('Error en el endpoint /api/registro:', error)
          return Response.json(
            { error: 'Error interno en el servidor', detalles: String(error) },
            { status: 500 },
          )
        }
      }),
    },
    // ✅ DONE ✅
    {
      path: '/validate-lesson',
      method: 'get',
      handler: withCors(async (req) => {
        try {
          // 1) Parsear el cursoId desde la query string
          const urlString = req.url || 'http://localhost'
          const url = new URL(urlString, 'http://localhost')
          const cursoId = url.searchParams.get('cursoId')

          if (!cursoId) {
            return Response.json({ error: 'Falta el parámetro "cursoId"' }, { status: 400 })
          }

          // 2) Llamar a /usuarios/me para verificar la sesión y obtener userId
          //    Pasamos la cookie entrante para que Payload reconozca la sesión
          const cookie = req.headers.get('cookie') || ''
          const meRes = await fetch('https://admin.kathymonzon.com/api/usuarios/me', {
            method: 'GET',
            headers: { Cookie: cookie },
          })

          if (!meRes.ok) {
            // No hay sesión válida
            return Response.json(
              { error: 'No estás autorizado o la sesión expiró' },
              { status: 401 },
            )
          }

          const meData = await meRes.json()
          const userId = meData?.user?.id
          if (!userId) {
            // Respuesta de /me no contenía usuario
            return Response.json({ error: 'No estás autorizado' }, { status: 401 })
          }

          // 3) Buscar en "enrollment" con depth=0:
          //    - usuario = userId
          //    - cursos contiene cursoId
          const enrollmentUrl = `https://admin.kathymonzon.com/api/enrollment?depth=0&where[usuario][equals]=${userId}&where[cursos][in]=${cursoId}`
          const enrollmentRes = await fetch(enrollmentUrl, {
            method: 'GET',
            headers: { Cookie: cookie },
          })

          if (!enrollmentRes.ok) {
            return Response.json(
              { error: 'Error interno al consultar enrollment' },
              { status: 500 },
            )
          }

          const enrollmentData = await enrollmentRes.json()
          const docs = Array.isArray(enrollmentData.docs) ? enrollmentData.docs : []

          // 4) Validar si hay un doc con status = "activo" y fechaDeExpiracion futura
          const now = new Date()
          const hasAccess = docs.some((doc: any) => {
            if (doc.status !== 'activo') return false
            if (!doc.fechaDeExpiracion) return false
            return new Date(doc.fechaDeExpiracion) > now
          })

          if (!hasAccess) {
            // No se encontró un enrollment activo/no vencido para este curso
            return Response.json(
              { error: 'No tienes acceso a este curso', hasAccess: false },
              { status: 403 },
            )
          }

          // 5) Todo OK => devolver hasAccess = true
          return Response.json({ hasAccess: true }, { status: 200 })
        } catch (error: any) {
          console.error('Error en /validate-lesson:', error)
          return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
        }
      }),
    },
    {
      path: '/modificarcuenta',
      method: 'post',
      handler: withCors(async (req) => {
        try {
          // Declaramos data como objeto indexable
          let data: Record<string, any> = {}
          const contentType = req.headers.get('content-type') || ''

          if (contentType.includes('multipart/form-data')) {
            // Usamos el método nativo para extraer el formData
            const form = await req.formData!()
            // Recorremos las entradas del formData
            for (const [key, value] of form.entries()) {
              if (value instanceof File) {
                // Convertir el File (del navegador) a un objeto que cumpla con UploadFile
                const fileValue = value as File
                const arrayBuffer = await fileValue.arrayBuffer()
                // Creamos un objeto con las propiedades que requiere Payload
                const uploadFile: UploadFile = {
                  data: Buffer.from(arrayBuffer),
                  mimetype: fileValue.type,
                  name: fileValue.name,
                  size: fileValue.size,
                }
                // Forzamos que req.file sea de tipo UploadFile
                req.file = uploadFile as unknown as UploadFile
              } else {
                data[key] = value
              }
            }
          } else {
            data = await req.json!()
          }

          console.log('Datos parseados:', data)

          // Forzamos a que data tenga las propiedades esperadas
          const { userId, currentPassword, password, ...otherFields } = data as {
            userId: string
            currentPassword?: string
            password?: string
            [key: string]: any
          }

          if (!userId) {
            console.error('No se encontró userId en los datos:', data)
            return Response.json({ error: 'Falta el campo userId' }, { status: 400 })
          }

          // Declaramos updatedFields como objeto indexable para evitar errores de TS
          const updatedFields: Record<string, any> = { ...otherFields }

          // Si se envía cambio de contraseña, incluir ambos campos
          if (currentPassword && password) {
            updatedFields.currentPassword = currentPassword
            updatedFields.password = password
          }

          // Procesar la imagen, si existe
          if (req.file) {
            // Ya tenemos req.file convertido a UploadFile
            const uploadFile = req.file as UploadFile
            const fotoDoc = await req.payload.create({
              collection: 'fotosUsuarios',
              data: {}, // data vacía para cumplir con el tipado
              file: uploadFile,
            })
            if (!fotoDoc || !fotoDoc.id) {
              return Response.json({ error: 'Error al subir la imagen' }, { status: 500 })
            }
            updatedFields.fotoUsuario = fotoDoc.id
          }

          // Actualizar el usuario en la colección "usuarios"
          const updatedUser = await req.payload.update({
            collection: 'usuarios',
            id: userId,
            data: updatedFields,
          })

          return Response.json(updatedUser, { status: 200 })
        } catch (error) {
          console.error('Error en /modificarcuenta:', error)
          return Response.json(
            { error: 'Error interno del servidor al modificar la cuenta' },
            { status: 500 },
          )
        }
      }),
    },

    {
      path: '/my-recipes',
      method: 'get',
      handler: withCors(async (req) => {
        try {
          const userId = req.user?.id
          if (!userId) {
            return new Response('No autorizado (no hay sesión).', { status: 401 })
          }

          // Filtramos recetas con `usuario: userId`
          const result = await req.payload.find({
            collection: 'recetasmuffins',
            where: {
              usuario: { equals: userId },
            },
            pagination: false,
            depth: 1, // ajusta según necesites
          })

          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (error) {
          console.error('Error en GET /my-recipes:', error)
          return new Response(JSON.stringify({ error: 'Error interno al obtener recetas.' }), {
            status: 500,
          })
        }
      }),
    },

    // -------------------------------------------------------------------------
    // 2) GET /my-recipes/:id => Obtener 1 receta (solo si es de este usuario)
    // -------------------------------------------------------------------------
    {
      path: '/my-recipes/:id',
      method: 'get',
      handler: withCors(async (req) => {
        try {
          const userId = req.user?.id
          if (!userId) {
            return new Response('No autorizado.', { status: 401 })
          }

          // Tomamos el :id con cast a `any` para evitar error TS (req.params)
          const recetaId = (req as any).params?.id
          if (!recetaId) {
            return new Response('Falta el param :id en la URL.', { status: 400 })
          }

          const recipeDoc = await req.payload.findByID({
            collection: 'recetasmuffins',
            id: recetaId,
            depth: 1,
          })

          if (!recipeDoc) {
            return new Response('Receta no encontrada.', { status: 404 })
          }

          // Verificar que la receta pertenezca al user logueado
          if (recipeDoc.usuario !== userId) {
            return new Response('No autorizado (receta no tuya).', { status: 403 })
          }

          return new Response(JSON.stringify(recipeDoc), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (error) {
          console.error('Error en GET /my-recipes/:id:', error)
          return new Response(JSON.stringify({ error: 'Error interno.' }), { status: 500 })
        }
      }),
    },

    // -------------------------------------------------------------------------
    // 3) POST /my-recipes => Crear nueva receta (usuario logueado)
    // -------------------------------------------------------------------------
    {
      path: '/my-recipes',
      method: 'post',
      handler: withCors(async (req) => {
        try {
          // parsear el body (solo si esperas multipart, etc.)
          await addDataAndFileToRequest(req)

          const userId = req.user?.id
          if (!userId) {
            return new Response('No autorizado.', { status: 401 })
          }

          const { nombre, ingredientesUsados } = req.data as any
          if (!nombre || typeof nombre !== 'string') {
            return new Response('Falta "nombre" o es inválido.', { status: 400 })
          }

          // Crear doc
          const created = await req.payload.create({
            collection: 'recetasmuffins',
            data: {
              nombre,
              usuario: userId,
              ingredientesUsados: ingredientesUsados ?? [],
            },
          })

          return new Response(JSON.stringify(created), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (error) {
          console.error('Error en POST /my-recipes:', error)
          return new Response(JSON.stringify({ error: 'Error interno al crear receta.' }), {
            status: 500,
          })
        }
      }),
    },

    // -------------------------------------------------------------------------
    // 4) PATCH /my-recipes/:id => Actualizar receta (solo si user es dueño)
    // -------------------------------------------------------------------------
    {
      path: '/my-recipes/:id',
      method: 'patch',
      handler: withCors(async (req) => {
        try {
          await addDataAndFileToRequest(req)

          const userId = req.user?.id
          if (!userId) {
            return new Response('No autorizado.', { status: 401 })
          }

          const recetaId = (req as any).params?.id
          if (!recetaId) {
            return new Response('Falta :id en la URL.', { status: 400 })
          }

          // Primero, buscar la receta para chequear que sea del user
          const recipeDoc = await req.payload.findByID({
            collection: 'recetasmuffins',
            id: recetaId,
            depth: 0,
          })
          if (!recipeDoc) {
            return new Response('Receta no encontrada.', { status: 404 })
          }
          if (recipeDoc.usuario !== userId) {
            return new Response('No autorizado (receta no tuya).', { status: 403 })
          }

          // Campos a actualizar
          const { nombre, ingredientesUsados } = req.data as any

          const updated = await req.payload.update({
            collection: 'recetasmuffins',
            id: recetaId,
            data: {
              ...(typeof nombre === 'string' && { nombre }),
              ...(typeof ingredientesUsados !== 'undefined' && { ingredientesUsados }),
            },
          })

          return new Response(JSON.stringify(updated), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (error) {
          console.error('Error en PATCH /my-recipes/:id:', error)
          return new Response(JSON.stringify({ error: 'Error interno al actualizar receta.' }), {
            status: 500,
          })
        }
      }),
    },

    // -------------------------------------------------------------------------
    // 5) DELETE /my-recipes/:id => Borrar una receta (solo si user es dueño)
    // -------------------------------------------------------------------------
    {
      path: '/my-recipes/:id',
      method: 'delete',
      handler: withCors(async (req) => {
        try {
          const userId = req.user?.id
          if (!userId) {
            return new Response('No autorizado (no hay sesión).', { status: 401 })
          }

          const recipeId = (req as any).params?.id
          if (!recipeId) {
            return new Response('Falta el param :id en la URL.', { status: 400 })
          }

          // Buscamos la receta para confirmar que exista y sea de este user
          const recipeDoc = await req.payload.findByID({
            collection: 'recetasmuffins',
            id: recipeId,
            depth: 0,
          })
          if (!recipeDoc) {
            return new Response('Receta no encontrada.', { status: 404 })
          }
          if (recipeDoc.usuario !== userId) {
            return new Response('No autorizado (receta no te pertenece).', { status: 403 })
          }

          // Eliminar
          await req.payload.delete({
            collection: 'recetasmuffins',
            id: recipeId,
          })

          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (error) {
          console.error('Error en DELETE /my-recipes/:id:', error)
          return new Response(JSON.stringify({ error: 'Error interno al eliminar receta' }), {
            status: 500,
          })
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
    IngredientesMuffins,
    Imagenes,
    RecetasMuffins,
    ImagenesReviews,
    Membresias,
    pedidos,
    PreguntasRespuestas,
    RegistroDeMembresias,
    ReviewsCursosVirtuales,
    ReviewsTalleresPresenciales,
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
        'imagenes-reviews': {
          prefix: 'imagenes-reviews',
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
