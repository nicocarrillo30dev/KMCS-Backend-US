import type { CollectionConfig } from 'payload'

const ReviewsCursosVirtuales: CollectionConfig = {
  slug: 'reviews-cursos-virtuales',
  labels: {
    singular: 'Review Curso Virtual',
    plural: 'Reviews Cursos Virtuales',
  },
  admin: {
    useAsTitle: 'reseña',
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
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
      name: 'curso',
      type: 'relationship',
      relationTo: 'cursos',
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
      defaultValue: () => new Date().toISOString().split('T')[0], // Default: hoy
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
  },
}

export default ReviewsCursosVirtuales
