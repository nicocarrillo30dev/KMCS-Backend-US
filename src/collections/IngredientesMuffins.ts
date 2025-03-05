import type { CollectionConfig } from 'payload'

export const IngredientesMuffins: CollectionConfig = {
  slug: 'ingredientesmuffins',
  labels: {
    singular: 'Ingrediente',
    plural: 'Ingredientes',
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
  },
  admin: {
    useAsTitle: 'nombre',
  },
  fields: [
    {
      name: 'nombre',
      type: 'text',
      required: true,
    },
    {
      name: 'precio',
      type: 'number',
      required: true,
    },
    {
      name: 'cantidadBase',
      type: 'number',
      required: true,
    },
    {
      name: 'unidad',
      type: 'select',
      label: 'Unidad de Medida',
      required: true,
      options: [
        { value: 'gramos', label: 'Gramos' },
        { value: 'mililitros', label: 'Mililitros' },
      ],
    },
    {
      name: 'usuario',
      type: 'relationship',
      relationTo: 'usuarios',
      required: true,
    },
    {
      name: 'costoPorGramo',
      label: 'Costo por gr. o ml.',
      type: 'number',
      admin: {
        readOnly: true,
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data }) => {
        if (typeof data?.precio === 'number' && typeof data?.cantidadBase === 'number') {
          data.costoPorGramo = data.precio / data.cantidadBase
        }
        return data
      },
    ],
  },
}
