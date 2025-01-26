import type { CollectionConfig } from 'payload'
import { withCors } from '../utils/withCors'

export const Usuarios: CollectionConfig = {
  slug: 'usuarios',
  endpoints: [
    {
      path: '/mis-cursos',
      method: 'get',
      handler: withCors(async (req) => {
        try {
          // 1) Ensure the user is logged in. Typically you do:
          //    const userId = req.user?.id
          //    If your auth strategy is different, adjust as needed.
          const userId = req.user?.id
          if (!userId) {
            return Response.json({ error: 'No autorizado' }, { status: 401 })
          }

          // 2) Find all enrollment docs for this user (depth=0 for minimal data)
          const enrollmentResult = await req.payload.find({
            collection: 'enrollment',
            where: {
              usuario: { equals: userId },
              // optionally also filter status if you only want 'activo' or
              // if you want to show all, remove or adjust:
              // status: { equals: 'activo' },
            },
            depth: 0, // minimal data in the enrollment docs
            limit: 100, // just an example, adjust as needed
            overrideAccess: true, // Typically you might skip access if internal
          })

          const enrollmentDocs = enrollmentResult.docs
          if (!enrollmentDocs || enrollmentDocs.length === 0) {
            // No enrollment => Return empty arrays
            return Response.json({
              cursosInscritos: [],
              expiredCourses: [],
            })
          }

          // 3) Collect all course IDs from these enrollment docs
          //    Each doc: { usuario, cursos: [IDs], status, fechaDeExpiracion }
          const courseIDs = new Set<number>()
          enrollmentDocs.forEach((enr: any) => {
            // enr.cursos is presumably an array of numbers (IDs)
            if (Array.isArray(enr.cursos)) {
              enr.cursos.forEach((c: number) => courseIDs.add(c))
            }
          })

          // If no courses at all, just return empty
          if (courseIDs.size === 0) {
            return Response.json({
              cursosInscritos: [],
              expiredCourses: [],
            })
          }

          // 4) Use Local API to find minimal info from collection "cursos"
          //    This is your "Courses" collection slug.
          //    We'll do pagination: false to get them all in one shot.
          //    We'll pass "select" to pick only minimal fields (like your /api/courses).
          const coursesResult = await req.payload.find({
            collection: 'cursos', // or whatever your slug is
            pagination: false, // get all
            overrideAccess: true, // skip access control internally
            depth: 0, // minimal depth
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
            },
          })

          // Build a map of courseID -> course object
          const foundCourses = coursesResult.docs || []
          const coursesMap = new Map<number, any>()
          foundCourses.forEach((course: any) => {
            coursesMap.set(course.id, course)
          })

          // 5) Combine data from enrollment + course
          //    We'll build an array of "enrolled courses"
          //    that includes { id, title, coverImage, accessUntil, status, etc. }
          //    Then we separate by date => "cursosInscritos" vs "expiredCourses"
          const now = new Date()
          const finalCourses: any[] = []

          for (const enr of enrollmentDocs) {
            const expiration = new Date(enr.fechaDeExpiracion)
            const courseStatus = enr.status // or 'activo' / 'inactivo' etc.
            const userHasAccess = expiration >= now && courseStatus === 'activo'

            // For each course ID in enr.cursos:
            if (Array.isArray(enr.cursos)) {
              ;(enr.cursos as number[]).forEach((courseId) => {
                const found = coursesMap.get(courseId)
                if (found) {
                  // Merge them
                  finalCourses.push({
                    // from the course object
                    id: found.id,
                    title: found.title,
                    slug: found.slug,
                    coverImage: found.coverImage,
                    estado: found.estado, // optional
                    rating: found.promedioreviews ?? null,
                    // from the enrollment doc
                    status: courseStatus,
                    accessUntil: expiration.toISOString(),
                  })
                }
              })
            }
          }

          // 6) Separate them into active vs expired based on accessUntil and status
          const cursosInscritos = finalCourses.filter((c: any) => {
            const expDate = new Date(c.accessUntil)
            return expDate >= now && c.status === 'activo'
          })
          const expiredCourses = finalCourses.filter((c: any) => {
            const expDate = new Date(c.accessUntil)
            return expDate < now || c.status !== 'activo'
          })

          // 7) Return the final shape
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
  ],
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
  },
  admin: {
    useAsTitle: 'email',
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
  ],
}
