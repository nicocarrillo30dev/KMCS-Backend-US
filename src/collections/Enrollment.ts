import type { CollectionConfig } from 'payload'

export const Enrollment: CollectionConfig = {
  slug: 'enrollment',
  access: {
    read: () => true, // Allow public read access
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
  ],
  hooks: {
    afterChange: [
      async ({ doc, req, operation }) => {
        console.log('Hook triggered:', { doc, operation })

        const { usuario, cursos, status, id, processed } = doc

        // Validación inicial
        if (processed) {
          console.log(`Document ${id} already processed. Skipping.`)
          return
        }
        if (operation !== 'create') {
          console.log(`Operation ${operation} is not create. Skipping.`)
          return
        }
        if (!Array.isArray(cursos) || cursos.length <= 1) {
          console.log(`Courses field is invalid or contains only one course:`, cursos)
          return
        }

        try {
          console.log(`Processing document ${id} with multiple courses:`, cursos)

          const expirationDate = new Date()
          expirationDate.setFullYear(expirationDate.getFullYear() + 1)

          // Crear inscripciones individuales para cada curso
          const createPromises = cursos.map(async (cursoId) => {
            return await req.payload.create({
              collection: 'enrollment',
              data: {
                usuario: usuario, // ID del usuario
                cursos: [cursoId],
                status: status || 'activo',
                fechaDeExpiracion: expirationDate.toISOString(), // Formato ISO
              },
              overrideAccess: true,
            })
          })

          // Esperar a que todas las inscripciones individuales se creen
          await Promise.all(createPromises)
          console.log('Successfully created individual enrollments.')

          // Intentar eliminar el documento original con un retardo
          console.log(`Scheduling deletion of original document with ID: ${id}`)
          setTimeout(async () => {
            try {
              await req.payload.delete({
                collection: 'enrollment',
                id: id,
              })
              console.log(`Successfully deleted original document: ${id}`)
            } catch (deleteError) {
              console.error(`Error deleting original document ${id}:`, deleteError)
            }
          }, 500) // Ajusta el tiempo según sea necesario
        } catch (error) {
          console.error(`Error processing enrollments for document ${id}:`, error)
        }
      },
    ],
    beforeChange: [
      async ({ data, req, operation, originalDoc }) => {
        const { usuario, fechaDeExpiracion } = data

        if (!usuario) {
          throw new Error('El usuario es obligatorio para crear o actualizar un enrollment.')
        }

        const today = new Date()
        let expirationDate = fechaDeExpiracion
          ? new Date(fechaDeExpiracion)
          : new Date(today.setFullYear(today.getFullYear() + 1))

        // Si la fecha de expiración es menor a la fecha actual, cambiar el estado a "inactivo"
        if (expirationDate < today) {
          console.log(
            `Course enrollment has expired. Setting status to "inactivo" for user ${usuario}.`,
          )
          data.status = 'inactivo'
        }

        // Buscar si el usuario tiene una membresía activa
        const memberships = await req.payload.find({
          collection: 'registro-de-membresias',
          where: {
            usuario: { equals: usuario },
            estado: { equals: 'activo' },
          },
          limit: 1,
        })

        const hasActiveMembership = memberships.docs.length > 0

        // Verificar si la fecha fue modificada manualmente
        const manualUpdate =
          operation === 'update' && originalDoc?.fechaDeExpiracion !== fechaDeExpiracion

        // Si el usuario tiene una membresía activa y la fecha no fue modificada manualmente
        if (hasActiveMembership && !manualUpdate) {
          if (expirationDate < today) {
            expirationDate = new Date()
            expirationDate.setFullYear(today.getFullYear() + 1)
          } else {
            expirationDate.setFullYear(expirationDate.getFullYear() + 1)
          }
          data.fechaDeExpiracion = expirationDate.toISOString()
        } else if (!hasActiveMembership && !manualUpdate && expirationDate < today) {
          throw new Error(
            'No puedes establecer una fecha de expiración en el pasado sin una membresía activa.',
          )
        }
      },
    ],
  },
}
