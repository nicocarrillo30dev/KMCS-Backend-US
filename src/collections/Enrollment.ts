import type { CollectionConfig } from 'payload'
import { isBefore, addYears } from 'date-fns'

export const Enrollment: CollectionConfig = {
  slug: 'enrollment',
  access: {
    read: () => true, // Allow public rea
    create: () => true,
    update: () => true,
  },

  fields: [
    {
      name: 'usuario', // Relación con la colección "usuarios"
      type: 'relationship',
      relationTo: 'usuarios',
      required: true,
    },
    {
      name: 'cursos', // Relación con la colección "cursos"
      type: 'relationship',
      relationTo: 'cursos',
      hasMany: true,
      required: true,
    },
    {
      name: 'status', // Estado del curso
      type: 'select',
      options: [
        { label: 'Activo', value: 'activo' },
        { label: 'Inactivo', value: 'inactivo' },
      ],
      defaultValue: 'activo',
      required: true,
    },
    {
      name: 'fechaDeExpiracion',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'dd/MM/yyyy',
        },
      },
      required: true,
      defaultValue: () => {
        const date = new Date()
        date.setFullYear(date.getFullYear() + 1)
        return date.toISOString()
      },
    },
    {
      name: 'completedLessons',
      type: 'array',
      label: 'Lecciones Completadas',
      fields: [
        {
          name: 'lessonSlug',
          label: 'Slug de la Lección',
          type: 'text',
          required: false,
        },
        {
          name: 'completedAt',
          label: 'Fecha',
          type: 'date',
          required: false,
          admin: {
            date: {
              displayFormat: 'dd/MM/yyyy',
            },
          },
        },
        {
          name: 'toggleLesson',
          type: 'checkbox',
          label: 'Lección Completada',
          defaultValue: false,
        },
      ],
    },
  ],
  /*
  hooks: {
    beforeChange: [
      async ({ data, req, operation, originalDoc }) => {
        const { usuario, fechaDeExpiracion } = data

        if (!usuario) {
          throw new Error('El usuario es obligatorio para crear o actualizar un enrollment.')
        }

        const now = new Date()
        // Tomamos la fecha enviada o, si no viene, 1 año desde hoy
        let expirationDate = fechaDeExpiracion
          ? new Date(fechaDeExpiracion)
          : new Date(now.setFullYear(now.getFullYear() + 1))

        // Si la fecha de expiración ya pasó, poner status "inactivo"
        if (isBefore(expirationDate, now)) {
          console.log(`Este enrollment ha expirado. Se marca como "inactivo".`)
          data.status = 'inactivo'
        }

        // 1. Buscar si el usuario tiene al menos UNA membresía activa
        //    (asumes que la última es la que vale o con la fecha de expiración más lejana)
        const membershipsRes = await req.payload.find({
          collection: 'registro-de-membresias',
          where: {
            usuario: { equals: usuario },
            estado: { equals: 'activo' },
          },
          // Podrías ordenar por fechaDeExpiracion desc si manejas varias
          sort: '-fechaDeExpiracion',
          limit: 1,
          depth: 0, // así viene sólo la relación ID
        })
        const hasActiveMembership = membershipsRes.docs.length > 0

        // 2. Verificar si la fecha fue modificada manualmente (durante un "update")
        const manualUpdate =
          operation === 'update' && originalDoc?.fechaDeExpiracion !== fechaDeExpiracion

        // 3. Si el usuario tiene membresía activa y NO se cambió la fecha manualmente:
        if (hasActiveMembership && !manualUpdate) {
          // Tomamos la membresía activa (la primera de la búsqueda)
          const activeMembership = membershipsRes.docs[0]

          // 3.1 Obtenemos la 'Cantidad' desde la colección 'membresias'
          //     (activeMembership.tipoDeMembresia es un ID o un obj, dependiendo de tu config)
          const membershipTypeId =
            typeof activeMembership.tipoDeMembresia === 'object'
              ? activeMembership.tipoDeMembresia.id
              : activeMembership.tipoDeMembresia

          // Vamos a buscar el documento real en la colección "membresias"
          const membershipType = await req.payload.findByID({
            collection: 'membresias',
            id: membershipTypeId,
            depth: 0,
          })

          const maxCourses = membershipType?.Cantidad ?? 0

          // 3.2. Contar cuántos enrollments activos tiene el usuario AHORA
          const enrollmentsActive = await req.payload.find({
            collection: 'enrollment',
            where: {
              usuario: { equals: usuario },
              status: { equals: 'activo' },
            },
            limit: 0, // para contar todos, sin límite
            depth: 0,
          })
          const totalActiveCourses = enrollmentsActive.totalDocs // O docs.length

          // 3.3. Si NO ha superado el límite, entonces se extiende la fecha
          if (totalActiveCourses < maxCourses) {
            console.log(
              `Usuario todavía bajo el límite de cursos (${totalActiveCourses}/${maxCourses}). Se extiende +1 año`,
            )
            // Si la fecha que traía ya caducó, la ponemos a 1 año desde HOY
            if (isBefore(expirationDate, now)) {
              expirationDate = new Date()
              expirationDate.setFullYear(now.getFullYear() + 1)
            } else {
              // Sumar un año a la fecha actual del enrollment
              expirationDate.setFullYear(expirationDate.getFullYear() + 1)
            }
            data.fechaDeExpiracion = expirationDate.toISOString()
          } else {
            // 3.4. El usuario YA alcanzó (o superó) el número de cursos permitidos
            console.log(
              `Usuario ha alcanzado o superado el límite de cursos (${totalActiveCourses}/${maxCourses}). NO se extiende.`,
            )
            // Aquí simplemente dejas la fecha que venía.
            // O podrías poner una fecha corta, o un error, etc.
          }
        } else if (!hasActiveMembership && !manualUpdate && isBefore(expirationDate, now)) {
          // No tiene membresía activa, y está intentando poner
          // una fecha de expiración en el pasado
          throw new Error(
            'No puedes establecer una fecha de expiración en el pasado sin una membresía activa.',
          )
        }
      },
    ],
  },
  */
}
