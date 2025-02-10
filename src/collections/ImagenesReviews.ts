import type { CollectionConfig, CollectionBeforeChangeHook } from 'payload'

export const ImagenesReviews: CollectionConfig = {
  slug: 'imagenes-reviews',
  access: {
    read: () => true,
    create: () => true,
    update: ({ req: { user } }) => Boolean(user && user.role === 'Admin'),
    delete: ({ req: { user } }) => Boolean(user && user.role === 'Admin'),
  },
  admin: {},
  labels: {
    singular: 'Imagen Reseña',
    plural: 'Imágenes Reseñas',
  },
  fields: [
    {
      name: 'SupaURL',
      type: 'text',
      admin: {
        readOnly: true,
      },
    },
  ],
  upload: true,

  hooks: {
    beforeChange: [
      (async ({ data, operation }) => {
        const supabaseBaseUrl =
          'https://jlnazdkepbbxsfxausin.supabase.co/storage/v1/object/public/KMCS/imagenes-reviews/'
        const filename = data?.filename

        if ((operation === 'create' || operation === 'update') && filename) {
          const generatedUrl = `${supabaseBaseUrl}${filename}`
          console.log(`Generated URL: ${generatedUrl}`)
          data.SupaURL = generatedUrl
        } else {
          console.error('Filename is missing or operation is invalid:', { operation, filename })
        }
      }) as CollectionBeforeChangeHook,
    ],
  },
}
