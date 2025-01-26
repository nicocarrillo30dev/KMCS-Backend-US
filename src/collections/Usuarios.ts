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
            limit: 100,
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
