import type { CollectionConfig, CollectionBeforeChangeHook } from 'payload'

export const FotosPreguntas: CollectionConfig = {
  slug: 'fotosPreguntas',
  access: {
    read: () => true,
    create: () => true,
  },
  admin: {},
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
          'https://jlnazdkepbbxsfxausin.supabase.co/storage/v1/object/public/KMCS/fotos-preguntas/'
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

export default FotosPreguntas
