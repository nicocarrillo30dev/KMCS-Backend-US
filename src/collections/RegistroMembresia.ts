import { CollectionConfig } from 'payload'
import { addYears, isBefore } from 'date-fns'

export const RegistroDeMembresias: CollectionConfig = {
  slug: 'registro-de-membresias',
  admin: {
    useAsTitle: 'tipoDeMembresia',
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
  },
  fields: [
    {
      name: 'usuario',
      type: 'relationship',
      relationTo: 'usuarios',
      required: true,
    },
    {
      name: 'tipoDeMembresia',
      type: 'relationship',
      relationTo: 'membresias',
      required: true,
    },
    {
      name: 'estado',
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
    beforeChange: [
      async ({ data, req, operation }) => {
        if (operation === 'create') {
          const { usuario } = data

          // Buscar la membresía activa de ese usuario
          const activeMembership = await req.payload.find({
            collection: 'registro-de-membresias',
            where: {
              usuario: { equals: usuario },
              estado: { equals: 'activo' },
            },
            sort: '-fechaDeExpiracion',
            limit: 1,
          })

          let newExpirationDate

          if (activeMembership.docs.length > 0) {
            // Extiende un año desde la expiración de la membresía activa
            const currentExpirationDate = new Date(activeMembership.docs[0].fechaDeExpiracion)
            newExpirationDate = addYears(currentExpirationDate, 1)
          } else {
            // Si no hay membresía activa, un año desde hoy
            newExpirationDate = addYears(new Date(), 1)
          }

          // Actualiza el campo fechaDeExpiracion
          data.fechaDeExpiracion = newExpirationDate.toISOString()
        }

        return data
      },
    ],
    afterChange: [
      async ({ doc, req, operation }) => {
        // 1. Extraer el ID de usuario (si llega como objeto)
        const userId = typeof doc.usuario === 'object' ? doc.usuario?.id : doc.usuario

        // 2. Extraer el ID de la membresía (si llega como objeto)
        const membershipId =
          typeof doc.tipoDeMembresia === 'object' // <-- Cambio
            ? doc.tipoDeMembresia?.id
            : doc.tipoDeMembresia

        // Tomamos lo demás de doc, aunque ya no usemos doc.tipoDeMembresia directamente
        const { estado, fechaDeExpiracion, id } = doc

        const now = new Date()

        try {
          // Verificar si la fecha de expiración ya venció
          if (isBefore(new Date(fechaDeExpiracion), now)) {
            if (estado === 'inactivo') {
              console.log(`Membership ${id} is already inactive. Skipping update.`)
              return
            }

            console.log(`Membership ${id} has expired. Setting state to "inactivo".`)

            setTimeout(async () => {
              await req.payload.update({
                collection: 'registro-de-membresias',
                id,
                data: { estado: 'inactivo' },
                overrideAccess: true,
              })
            }, 0)

            return
          }

          // Solo procesar si la membresía es NUEVA y está activa
          if (estado !== 'activo' || operation !== 'create') {
            console.log(`Skipping update. Operation: ${operation}, Estado: ${estado}`)
            return
          }

          // Inactivar las demás membresías activas de este usuario
          console.log(`Deactivating previous memberships for user ${userId}.`)
          await req.payload.update({
            collection: 'registro-de-membresias',
            where: {
              usuario: { equals: userId },
              estado: { equals: 'activo' },
              id: { not_equals: id },
            },
            data: { estado: 'inactivo' },
            overrideAccess: true,
          })

          // Obtener la membresía para saber cuántos cursos permite
          const membership = await req.payload.findByID({
            collection: 'membresias',
            id: membershipId, // <-- usamos membershipId
          })

          const cantidadDeCursos = membership.Cantidad || 0
          console.log(`Membership allows updating ${cantidadDeCursos} courses.`)

          if (cantidadDeCursos === 0) {
            console.log('No courses to update for this membership.')
            return
          }

          // Buscar las inscripciones del usuario
          const enrollments = await req.payload.find({
            collection: 'enrollment',
            where: {
              usuario: { equals: userId },
            },
            sort: 'createdAt',
            limit: cantidadDeCursos,
          })

          if (enrollments.docs.length === 0) {
            console.log(`No enrollments found for user ${userId}.`)
            return
          }

          console.log(`Found ${enrollments.docs.length} enrollments to update for user ${userId}.`)

          // Extender la fecha de expiración de los cursos seleccionados
          const membershipStartDate = new Date()
          await Promise.all(
            enrollments.docs.map(async (enrollment) => {
              let newExpirationDate

              if (enrollment.status === 'activo') {
                // Si el curso está activo, se extiende su expiración un año más
                const currentExpirationDate = new Date(enrollment.fechaDeExpiracion || now)
                newExpirationDate = addYears(currentExpirationDate, 1)
              } else {
                // Si está inactivo, un año desde "ahora" (inicio de la nueva membresía)
                newExpirationDate = addYears(membershipStartDate, 1)
              }

              console.log(
                `Updating enrollment ${enrollment.id} to status "activo" and expiration date ${newExpirationDate}`,
              )

              return req.payload.update({
                collection: 'enrollment',
                id: enrollment.id,
                data: {
                  fechaDeExpiracion: newExpirationDate.toISOString(),
                  status: 'activo',
                },
                overrideAccess: true,
              })
            }),
          )

          console.log(
            `Successfully updated ${enrollments.docs.length} enrollments for user ${userId}.`,
          )
        } catch (error) {
          console.error(`Error processing membership for user ${userId}:`, error)
        }
      },
    ],
  },
}
