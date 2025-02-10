import type { CollectionConfig } from 'payload'

const ReviewsTalleresPresenciales: CollectionConfig = {
  slug: 'reviews-talleres-presenciales',
  labels: {
    singular: 'Review Taller Presencial',
    plural: 'Reviews Talleres Presenciales',
  },
  admin: {
    useAsTitle: 'reseña',
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
      hasMany: false,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'taller',
      type: 'relationship',
      relationTo: 'talleres-presenciales',
      required: true,
      hasMany: false,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'nombreUsuario',
      type: 'text',
      required: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'paisUsuario',
      type: 'text',
      required: false,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'estrellas',
      type: 'number',
      required: true,
      min: 1,
      max: 5,
    },
    {
      name: 'reseña',
      type: 'textarea',
      required: true,
    },
    {
      name: 'fecha',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString().split('T')[0],
      admin: {
        position: 'sidebar',
        date: {
          displayFormat: 'dd/MM/yyyy',
        },
      },
    },
    {
      name: 'estado',
      type: 'select',
      options: [
        {
          label: 'Aceptada',
          value: 'aceptada',
        },
        {
          label: 'Denegada',
          value: 'denegada',
        },
      ],
      required: true,
      defaultValue: 'denegada',
      admin: {
        position: 'sidebar',
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        if (operation === 'create' && data.usuario) {
          const usuario = await req.payload.findByID({
            collection: 'usuarios',
            id: data.usuario,
          })

          if (usuario) {
            data.nombreUsuario = `${usuario.nombre} ${usuario.apellidos}`
            data.paisUsuario = usuario.pais
          }
        }
      },
    ],

    afterChange: [
      ({ doc, req }) => {
        const tallerId = doc.taller

        // Use setImmediate to run the API call after the current event loop
        setImmediate(async () => {
          try {
            const response = await fetch(
              `https://admin.nicolascarrillo.com/api/average-reviews-talleres?tallerId=${tallerId}`,
            )
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`)
            }
            const result = await response.json()
            console.log('API response after change:', result)
          } catch (error) {
            console.error('Error fetching average-reviews API:', error)
          }
        })

        // Return immediately to prevent blocking
        return doc
      },
    ],
    afterDelete: [
      ({ doc }) => {
        const tallerId = doc.taller

        if (!tallerId) {
          console.error('No tallerId found in deleted document')
          return
        }

        // Use setImmediate like in afterChange to prevent blocking
        setImmediate(async () => {
          try {
            const response = await fetch(
              `https://admin.nicolascarrillo.com/api/average-reviews-talleres?tallerId=${tallerId}`,
            )
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`)
            }
            const result = await response.json()
            console.log('API response after delete:', result)
          } catch (error) {
            console.error('Error fetching average-reviews API:', error)
          }
        })
      },
    ],
  },
}

export default ReviewsTalleresPresenciales
