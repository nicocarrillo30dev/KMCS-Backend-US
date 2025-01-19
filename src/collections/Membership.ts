import type { CollectionConfig } from 'payload'

export const Membresias: CollectionConfig = {
  slug: 'membresias',
  admin: {
    useAsTitle: 'nombre', // Utiliza el campo "nombre" como título
  },
  access: {
    read: () => true, // Allow public read access
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'nombre',
      type: 'text',
      required: true,
      label: 'Nombre de la Membresía',
    },
    {
      name: 'Precio',
      type: 'number',
      required: true,
      label: 'Precio',
    },
    {
      name: 'Cantidad',
      type: 'number',
      required: true,
      label: 'Cantidad de Cursos a Actualizar',
    },
    {
      name: 'Descuento',
      type: 'number',
      required: true,
      label: 'Cantidad de Descuento',
    },
    {
      name: 'duracion',
      type: 'number',
      defaultValue: '365',
      required: true,
      admin: {
        readOnly: true,
      },
    },
  ],
}
