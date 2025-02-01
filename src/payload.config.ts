// storage-adapter-import-placeholder
import { postgresAdapter } from '@payloadcms/db-postgres'
import { s3Storage } from '@payloadcms/storage-s3'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'

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
import ReviewsTalleresPresenciales from './collections/ReseñasTalleresPresenciales'
import { TalleresPresenciales } from './collections/TalleresPresenciales'
import { Usuarios } from './collections/Usuarios'

const ephemeralCartsStore: Record<string, any> = {}

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Usuarios.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  serverURL: 'https://admin.nicolascarrillo.com',
  //serverURL: 'http://localhost:3000',
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
          const reviewsUrl = `https://admin.nicolascarrillo.com/api/reviews-cursos-virtuales?depth=0&where[curso][equals]=${cursoId}`
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
            `https://admin.nicolascarrillo.com/api/cursos/${cursoId}`,
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

          // 1. Fetch each collection
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

          // 2. Build validatedCart
          const validatedCart = productArray
            .map(({ id, type, frontImage }) => {
              let foundDoc: any = null

              if (type === 'curso virtual') {
                // find in "cursos"
                foundDoc = courses.find((c: any) => c.id === id)
              } else if (type === 'taller presencial') {
                // find in "talleres-presenciales"
                foundDoc = talleres.find((t: any) => t.id === id)
              } else if (type === 'membresía') {
                // find in "membresias"
                foundDoc = membresias.find((m: any) => m.id === id)
              } else {
                // Unknown type
                return null
              }

              if (!foundDoc) {
                return null // Not found
              }

              // 2a. Determine pricing
              let originalPrice = 0
              let discountedPrice: number | null = null

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

              // 2b. Determine finalImage
              // For courses/talleres, if doc has an upload with .SupaURL, use that.
              // Otherwise fallback to frontImage.
              let finalImage: string | null = null
              if (foundDoc.coverImage && foundDoc.coverImage.SupaURL) {
                finalImage = foundDoc.coverImage.SupaURL
              } else {
                finalImage = frontImage || null
              }

              // 2c. Return the validated product
              return {
                id: foundDoc.id,
                type, // might want to keep it
                title: foundDoc.title || foundDoc.nombre || 'Sin título',
                coverImage: finalImage,
                originalPrice,
                discountedPrice,
                membershipDiscountPrice,
                finalPrice,
              }
            })
            .filter(Boolean)

          // 3. Store in ephemeral memory
          const cartId = Math.random().toString(36).substring(2, 12)
          ephemeralCartsStore[cartId] = validatedCart

          // 4. Return success + set cartId cookie
          return new Response(JSON.stringify({ success: true }), {
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
    {
      path: '/create-order',
      method: 'post',
      handler: withCors(async (req) => {
        try {
          // Se espera recibir un JSON con:
          // userData, products, total, discountedTotal, coupon y selectedMethod
          const body = await req.json!() // usamos req.json!() para evitar el error de TS
          const { userData, products, total, discountedTotal, coupon, selectedMethod } = body

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
              schedule: null, // Se envía null si no se especifica
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
            capturaPago: null,
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
    {
      path: '/myorders',
      method: 'get',
      handler: withCors(async (req) => {
        try {
          // 1. Parse userId from the query string
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

          // 2. Fetch orders (pedidos) for that userId, depth=0
          const ordersResult = await req.payload.find({
            collection: 'pedidos', // Adjust if your collection is named differently
            where: {
              client: { equals: numericUserId },
            },
            depth: 0,
            pagination: false,
          })

          const orders = ordersResult.docs // array of orders

          // 3. Collect numeric IDs from each array in the orders:
          const allCourseIDs = new Set<number>()
          const allTallerIDs = new Set<number>()
          const allMembresiaIDs = new Set<number>()

          for (const order of orders) {
            // A) cursos
            if (Array.isArray(order.cursos)) {
              for (const course of order.cursos) {
                if (typeof course.cursoRef === 'number') {
                  allCourseIDs.add(course.cursoRef)
                }
              }
            }
            // B) talleresPresenciales
            if (Array.isArray(order.talleresPresenciales)) {
              for (const taller of order.talleresPresenciales) {
                if (typeof taller.tallerRef === 'number') {
                  allTallerIDs.add(taller.tallerRef)
                }
              }
            }
            // C) membresias
            if (Array.isArray(order.membresias)) {
              for (const mem of order.membresias) {
                if (typeof mem.membresiaRef === 'number') {
                  allMembresiaIDs.add(mem.membresiaRef)
                }
              }
            }
          }

          // If no items at all, return orders directly
          if (allCourseIDs.size === 0 && allTallerIDs.size === 0 && allMembresiaIDs.size === 0) {
            return Response.json(orders, { status: 200 })
          }

          // 4. Fetch each collection in parallel
          //    Adjust "where" fields and "select" to match your schema.
          const [coursesResult, talleresResult, membresiasResult] = await Promise.all([
            allCourseIDs.size > 0
              ? req.payload.find({
                  collection: 'cursos',
                  pagination: false,
                  where: {
                    id: {
                      in: Array.from(allCourseIDs),
                    },
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
                    id: {
                      in: Array.from(allTallerIDs),
                    },
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
                    id: {
                      in: Array.from(allMembresiaIDs),
                    },
                  },
                  select: {
                    id: true,
                    nombre: true,
                    Precio: true,
                  },
                })
              : Promise.resolve({ docs: [] }),
          ])

          // 5. Create maps
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

          // 6. Merge the data into each order’s arrays
          const mergedOrders = orders.map((order) => {
            const newOrder = { ...order }

            // A) Merge "cursos"
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

            // B) Merge "talleresPresenciales"
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

            // C) Merge "membresias"
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

          // 7. Return the final orders
          return Response.json(mergedOrders, { status: 200 })
        } catch (error) {
          console.error('Error en /myorders:', error)
          return Response.json({ error: 'Error al obtener pedidos' }, { status: 500 })
        }
      }),
    },
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
    {
      path: '/attendance-courses',
      method: 'get',
      handler: withCors(async (req) => {
        try {
          const result = await req.payload.find({
            collection: 'talleres-presenciales', // Updated collection name
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
          const reviewsUrl = `https://admin.nicolascarrillo.com/api/reviews-talleres-presenciales?depth=0&where[taller][equals]=${tallerId}`
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
            `https://admin.nicolascarrillo.com/api/talleres-presenciales/${tallerId}`,
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
