import type { CollectionConfig } from 'payload'

export const Enrollment: CollectionConfig = {
  slug: 'enrollment',
  access: {
    read: () => true, // Allow public read access
    create: () => true,
    update: () => true,
  },
  auth: {
    cookies: {
      secure: true,
      sameSite: 'None',
      domain: 'admin.nicolascarrillo.com',
    },
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

        // Buscar si el usuario tiene una membresía
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
