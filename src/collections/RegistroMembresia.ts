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
