import type { CollectionConfig, CollectionBeforeChangeHook } from 'payload'

export const Imagenes: CollectionConfig = {
  slug: 'imagenes',
  access: {
    read: () => true,
    create: () => true,
  },
  admin: {},
  labels: {
    singular: 'Imagen',
    plural: 'Imágenes',
  },
  fields: [
    {
      name: 'Alt',
      type: 'text',
      admin: {
        description: `
          Describe la imagen de manera clara y precisa para mejorar el SEO, la accesibilidad y destacar la marca Kathy Monzón Cake Studio. 
          Por ejemplo, si la imagen es de una torta de chocolate, escribe: 
          "Curso Virtual "Torta de Chocolate"- Torta de chocolate decorada con fresas - Kathy Monzón Cake Studio".
        `,
      },
    },
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
          'https://jlnazdkepbbxsfxausin.supabase.co/storage/v1/object/public/KMCS/imagenes/'
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
