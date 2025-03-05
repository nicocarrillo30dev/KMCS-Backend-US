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
    delete: ({ req: { user } }) => Boolean(user && user.role === 'Admin'),
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

          // Buscar la membresía activa de ese usuari0
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
        try {
          await fetch('https://server-production-021a.up.railway.app/process-membresia', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ doc, operation }),
          })
        } catch (err) {
          console.error('Error llamando a /process-membresia:', err)
        }
      },
    ],
  },
}
