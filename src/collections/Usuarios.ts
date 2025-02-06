import type { CollectionConfig } from 'payload'
import { withCors } from '../utils/withCors'
import type { CollectionAfterChangeHook } from 'payload'

const enrollNewUser: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  if (operation === 'create') {
    const defaultCourses = [41330, 39826] // IDs de cursos

    setTimeout(async () => {
      try {
        for (const cursoId of defaultCourses) {
          await req.payload.create({
            collection: 'enrollment',
            data: {
              usuario: doc.id, // ID del usuario ya creado
              cursos: [cursoId], // Un curso a la vez
              status: 'activo',
              fechaDeExpiracion: new Date(
                new Date().setFullYear(new Date().getFullYear() + 1),
              ).toISOString(),
            },
            overrideAccess: true,
          })

          console.log(`Usuario ${doc.id} inscrito en curso ${cursoId}`)
        }
      } catch (error) {
        console.error(`Error inscribiendo usuario ${doc.id}:`, error)
      }
    }, 100) // Pequeña espera para asegurar que el usuario se haya guardado en la DB
  }

  return doc
}
export const Usuarios: CollectionConfig = {
  slug: 'usuarios',
  endpoints: [
    {
      path: '/mis-cursos',
      method: 'get',
      handler: withCors(async (req) => {
        try {
          // 1) Check if user is logged in
          const userId = req.user?.id
          if (!userId) {
            return Response.json({ error: 'No autorizado' }, { status: 401 })
          }

          // 2) Find enrollment docs for this user
          //    minimal data => depth: 0
          const enrollmentResult = await req.payload.find({
            collection: 'enrollment',
            where: {
              usuario: { equals: userId },
              // If you only want 'activo', include here:
              // status: { equals: 'activo' },
            },
            depth: 0,
            limit: 120,
            overrideAccess: true, // skip access if internal usage
          })

          const enrollmentDocs = enrollmentResult.docs
          if (!enrollmentDocs || enrollmentDocs.length === 0) {
            // No enrollment => Return empty arrays
            return Response.json({
              cursosInscritos: [],
              expiredCourses: [],
            })
          }

          // 3) Gather all course IDs
          const courseIDs = new Set<number>()
          for (const enr of enrollmentDocs) {
            if (Array.isArray(enr.cursos)) {
              // cast to number[] if needed
              ;(enr.cursos as number[]).forEach((cId) => courseIDs.add(cId))
            }
          }

          // If no courseIDs at all:
          if (courseIDs.size === 0) {
            return Response.json({
              cursosInscritos: [],
              expiredCourses: [],
            })
          }

          // 4) fetch those courses from 'cursos' with depth: 1
          //    so we get populated coverImage
          const coursesResult = await req.payload.find({
            collection: 'cursos',
            pagination: false,
            overrideAccess: true,
            depth: 1,
            where: {
              id: { in: Array.from(courseIDs) },
            },
            select: {
              id: true,
              title: true,
              slug: true,
              estado: true,
              promedioreviews: true,
              precio: true,
              precioConDescuento: true,
              coverImage: true,
              Modulos: true,
            },
          })

          const foundCourses = coursesResult.docs || []
          // Build a map of id -> minimal course data with a URL for coverImage
          const coursesMap = new Map<number, any>()

          foundCourses.forEach((course: any) => {
            // Transform the coverImage => we only want coverImage.SupaURL
            let finalCover = null
            if (
              course.coverImage &&
              typeof course.coverImage === 'object' &&
              course.coverImage.SupaURL
            ) {
              finalCover = course.coverImage.SupaURL
            }

            coursesMap.set(course.id, {
              ...course,
              coverImage: finalCover,
            })
          })

          // 5) Merge data from enrollment + course
          const now = new Date()
          const finalCourses: any[] = []

          for (const enr of enrollmentDocs) {
            const expDate = new Date(enr.fechaDeExpiracion)
            // e.g. "activo" vs "inactivo"
            const enrStatus = enr.status

            if (Array.isArray(enr.cursos)) {
              ;(enr.cursos as number[]).forEach((courseId) => {
                const found = coursesMap.get(courseId)
                if (found) {
                  finalCourses.push({
                    // from the course
                    id: found.id,
                    title: found.title,
                    slug: found.slug,
                    coverImage: found.coverImage, // now a URL
                    estado: found.estado,
                    rating: found.promedioreviews ?? null,
                    Modulos: found.Modulos,
                    // from the enrollment doc
                    status: enrStatus,
                    accessUntil: expDate.toISOString(),
                  })
                }
              })
            }
          }

          // 6) Separate active vs expired
          const cursosInscritos = finalCourses.filter((c) => {
            const d = new Date(c.accessUntil)
            // active if not expired & status is 'activo'
            return d >= now && c.status === 'activo'
          })
          const expiredCourses = finalCourses.filter((c) => {
            const d = new Date(c.accessUntil)
            return d < now || c.status !== 'activo'
          })

          // 7) Return shape
          return Response.json({
            cursosInscritos,
            expiredCourses,
          })
        } catch (err: any) {
          console.error('Error en /mis-cursos:', err)
          return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
        }
      }),
    },

    {
      path: '/mi-membresia',
      method: 'get',
      handler: withCors(async (req) => {
        try {
          // 1) Verificar que el usuario esté logueado
          const userId = req.user?.id
          if (!userId) {
            return Response.json({ error: 'No autorizado' }, { status: 401 })
          }

          // 2) Obtener todas las membresías de este usuario
          const membershipsResult = await req.payload.find({
            collection: 'registro-de-membresias',
            where: {
              usuario: { equals: userId },
            },
            depth: 1,
            limit: 50,
            overrideAccess: true,
          })

          const memDocs = membershipsResult.docs || []
          const now = new Date()
          const activeMembership = memDocs.find(
            (m) => m.estado === 'activo' && new Date(m.fechaDeExpiracion) > now,
          )

          // 4) Responder con la lista de membresías y la activa
          return Response.json({
            memberships: memDocs,
            activeMembership: activeMembership || null,
          })
        } catch (err: any) {
          console.error('Error en /mi-membresia:', err)
          return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
        }
      }),
    },
    {
      path: '/tiene-acceso-leccion',
      method: 'get',
      handler: withCors(async (req) => {
        try {
          // (1) Verificar que el usuario esté logueado
          const userId = req.user?.id
          if (!userId) {
            return Response.json(
              { canAccess: false, reason: 'No autorizado (no hay sesión).' },
              { status: 401 },
            )
          }

          // (2) Leer el parámetro "courseId" de la query (GET /tiene-acceso-leccion?courseId=xxxx)
          // En vez de usar directamente new URL(req.url),
          // proveemos una cadena de respaldo.
          const urlString = req.url ?? 'http://localhost'

          // Si req.url a veces viene como "/ruta?foo=bar",
          // entonces conviene usar 'http://localhost' como segundo parámetro:
          const url = new URL(urlString, 'http://localhost')

          // Ahora sí podemos hacer:
          const cursoId = url.searchParams.get('cursoId')
          const courseIdParam = url.searchParams.get('courseId')
          if (!courseIdParam) {
            return Response.json(
              { canAccess: false, reason: 'Falta el parámetro courseId.' },
              { status: 400 },
            )
          }

          const courseId = Number(courseIdParam)
          if (isNaN(courseId)) {
            return Response.json(
              { canAccess: false, reason: 'courseId no es un número válido.' },
              { status: 400 },
            )
          }

          // (3) Revisar si el usuario tiene una membresía activa
          const now = new Date()
          const membershipsResult = await req.payload.find({
            collection: 'registro-de-membresias', // Ajusta tu colección
            where: {
              usuario: { equals: userId },
            },
            depth: 0,
            overrideAccess: true,
          })
          const memDocs = membershipsResult.docs || []
          const activeMembership = memDocs.find(
            (m) => m.estado === 'activo' && new Date(m.fechaDeExpiracion) > now,
          )
          // Si tu membresía da acceso universal a todos los cursos:
          if (activeMembership) {
            return Response.json({ canAccess: true, reason: 'Membresía activa' })
          }

          // (4) Si no hay membresía activa, chequear enrollment
          //     Colección "enrollment" con campos: { usuario, cursos: number[], status, fechaDeExpiracion }
          const enrollmentResult = await req.payload.find({
            collection: 'enrollment',
            where: {
              usuario: { equals: userId },
              status: { equals: 'activo' }, // status activo
              cursos: { contains: courseId }, // que "cursos" contenga courseId
            },
            depth: 0,
            overrideAccess: true,
          })

          const enrollmentDocs = enrollmentResult.docs || []
          // Revisamos si alguno no ha expirado
          const hasValidEnrollment = enrollmentDocs.some((enr) => {
            const expDate = new Date(enr.fechaDeExpiracion)
            return expDate > now // no expirado
          })

          if (hasValidEnrollment) {
            return Response.json({ canAccess: true, reason: 'Curso enrolado activo' })
          }

          // (5) Si no hay membresía activa ni enrolamiento activo => no hay acceso
          return Response.json({ canAccess: false, reason: 'Sin acceso' })
        } catch (err) {
          console.error('Error en /tiene-acceso-leccion:', err)
          return Response.json(
            { canAccess: false, reason: 'Error interno del servidor' },
            { status: 500 },
          )
        }
      }),
    },
  ],
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
  },
  admin: {
    useAsTitle: 'email',
  },
  hooks: {
    afterChange: [enrollNewUser],
  },
  auth: {},

  fields: [
    {
      name: 'nombre',
      type: 'text',
      label: 'Nombre',
      required: true,
    },
    {
      name: 'apellidos',
      type: 'text',
      label: 'Apellidos',
      required: false,
    },
    {
      name: 'pais',
      type: 'select',
      label: 'País',
      required: false,
      options: [
        { value: 'andorra', label: 'Andorra' },
        { value: 'argentina', label: 'Argentina' },
        { value: 'australia', label: 'Australia' },
        { value: 'austria', label: 'Austria' },
        { value: 'bahamas', label: 'Bahamas' },
        { value: 'belgica', label: 'Bélgica' },
        { value: 'bolivia', label: 'Bolivia' },
        { value: 'brasil', label: 'Brasil' },
        { value: 'canada', label: 'Canadá' },
        { value: 'chile', label: 'Chile' },
        { value: 'china', label: 'China' },
        { value: 'colombia', label: 'Colombia' },
        { value: 'costa_rica', label: 'Costa Rica' },
        { value: 'croacia', label: 'Croacia' },
        { value: 'cuba', label: 'Cuba' },
        { value: 'chipre', label: 'Chipre' },
        { value: 'republica_checa', label: 'República Checa' },
        { value: 'dinamarca', label: 'Dinamarca' },
        { value: 'dominica', label: 'Dominica' },
        { value: 'republica_dominicana', label: 'República Dominicana' },
        { value: 'ecuador', label: 'Ecuador' },
        { value: 'egipto', label: 'Egipto' },
        { value: 'el_salvador', label: 'El Salvador' },
        { value: 'espana', label: 'España' },
        { value: 'estados_unidos', label: 'Estados Unidos' },
        { value: 'estonia', label: 'Estonia' },
        { value: 'finlandia', label: 'Finlandia' },
        { value: 'francia', label: 'Francia' },
        { value: 'georgia', label: 'Georgia' },
        { value: 'alemania', label: 'Alemania' },
        { value: 'grecia', label: 'Grecia' },
        { value: 'granada', label: 'Granada' },
        { value: 'guatemala', label: 'Guatemala' },
        { value: 'honduras', label: 'Honduras' },
        { value: 'islandia', label: 'Islandia' },
        { value: 'irlanda', label: 'Irlanda' },
        { value: 'italia', label: 'Italia' },
        { value: 'jamaica', label: 'Jamaica' },
        { value: 'japon', label: 'Japón' },
        { value: 'corea_del_sur', label: 'Corea del Sur' },
        { value: 'mexico', label: 'México' },
        { value: 'monaco', label: 'Mónaco' },
        { value: 'paises_bajos', label: 'Países Bajos' },
        { value: 'nueva_zelanda', label: 'Nueva Zelanda' },
        { value: 'nicaragua', label: 'Nicaragua' },
        { value: 'noruega', label: 'Noruega' },
        { value: 'panama', label: 'Panamá' },
        { value: 'paraguay', label: 'Paraguay' },
        { value: 'peru', label: 'Perú' },
        { value: 'polonia', label: 'Polonia' },
        { value: 'portugal', label: 'Portugal' },
        { value: 'rusia', label: 'Rusia' },
        { value: 'san_marino', label: 'San Marino' },
        { value: 'serbia', label: 'Serbia' },
        { value: 'singapur', label: 'Singapur' },
        { value: 'eslovaquia', label: 'Eslovaquia' },
        { value: 'eslovenia', label: 'Eslovenia' },
        { value: 'suecia', label: 'Suecia' },
        { value: 'suiza', label: 'Suiza' },
        { value: 'trinidad_y_tobago', label: 'Trinidad y Tobago' },
        { value: 'turquia', label: 'Turquía' },
        { value: 'ucrania', label: 'Ucrania' },
        { value: 'reino_unido', label: 'Reino Unido' },
        { value: 'uruguay', label: 'Uruguay' },
        { value: 'ciudad_del_vaticano', label: 'Ciudad del Vaticano' },
        { value: 'venezuela', label: 'Venezuela' },
      ],
    },
    {
      name: 'numero',
      type: 'number',
      label: 'Número',
      required: false,
    },
    {
      name: 'role',
      label: 'Rol',
      type: 'select',
      required: true,
      options: [
        { label: 'Admin', value: 'Admin' },
        { label: 'User', value: 'User' },
      ],
      defaultValue: 'User',
    },
    {
      name: 'fotoUsuario',
      label: 'Foto Usuario',
      type: 'upload',
      relationTo: 'fotosUsuarios',
      required: false,
    },
  ],
}
