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
    {
      name: 'imagenesReviews',
      labels: {
        singular: 'Imagen Reseña',
        plural: 'Imágenes Reseñas',
      },
      type: 'array',
      fields: [
        {
          name: 'imagenReview',
          label: 'Imagen Review',
          type: 'upload',
          relationTo: 'imagenes-reviews',
          maxDepth: 1,
        },
      ],
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
    // === Agregamos afterChange para crear/editar reseña ===
    afterChange: [
      ({ doc, req }) => {
        const cursoId = doc.curso

        // Use setImmediate to run the API call after the current event loop
        setImmediate(async () => {
          try {
            const response = await fetch(
              `https://admin.nicolascarrillo.com/api/average-reviews?cursoId=${cursoId}`,
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
        const cursoId = doc.curso

        if (!cursoId) {
          console.error('No cursoId found in deleted document')
          return
        }

        // Use setImmediate like in afterChange to prevent blocking
        setImmediate(async () => {
          try {
            const response = await fetch(
              `https://admin.nicolascarrillo.com/api/average-reviews?cursoId=${cursoId}`,
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

export default ReviewsCursosVirtuales
