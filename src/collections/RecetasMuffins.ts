import type { CollectionConfig } from 'payload'

export const RecetasMuffins: CollectionConfig = {
  slug: 'recetasmuffins',
  labels: {
    singular: 'Receta',
    plural: 'Recetas',
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'nombre',
      type: 'text',
      required: true,
    },
    {
      name: 'usuario',
      type: 'relationship',
      relationTo: 'usuarios',
      required: true,
    },
    {
      name: 'ingredientesUsados',
      type: 'array',
      label: 'Ingredientes en esta Receta',
      fields: [
        {
          name: 'ingrediente',
          type: 'relationship',
          relationTo: 'ingredientesmuffins',
          required: true,
          filterOptions: ({ data, user }) => {
            const usuarioValue = data?.usuario
            let usuarioId: number | string | undefined

            if (typeof usuarioValue === 'object' && usuarioValue !== null) {
              usuarioId = usuarioValue.id
            } else {
              usuarioId = usuarioValue
            }

            if (!usuarioId) {
              usuarioId = user?.id
            }

            console.log('FilterOptions usuarioId:', usuarioId)

            return {
              usuario: { equals: usuarioId },
            }
          },
        },
        {
          name: 'cantidadNecesaria',
          type: 'number',
          label: 'Cantidad necesaria (g o ml)',
          required: true,
        },
        {
          name: 'costoCalculado',
          type: 'number',
          label: 'Costo Calculado',
          admin: {
            readOnly: true,
          },
        },
      ],
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        if (Array.isArray(data.ingredientesUsados)) {
          for (const item of data.ingredientesUsados) {
            if (item?.ingrediente && item?.cantidadNecesaria) {
              const ingredienteDoc = await req.payload.findByID({
                collection: 'ingredientesmuffins',
                id: item.ingrediente,
              })

              const costoUnitario = ingredienteDoc?.costoPorGramo || 0
              const costoCalculado = costoUnitario * item.cantidadNecesaria

              item.costoCalculado = Number(costoCalculado.toFixed(2))
            }
          }
        }
        return data
      },
    ],
  },
}
