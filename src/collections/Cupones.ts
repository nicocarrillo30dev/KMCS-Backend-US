import type { CollectionConfig } from 'payload'

export const Cupones: CollectionConfig = {
  slug: 'cupones',
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user && user.role === 'Admin'),
    update: ({ req: { user } }) => Boolean(user && user.role === 'Admin'),
    delete: ({ req: { user } }) => Boolean(user && user.role === 'Admin'),
  },
  labels: {
    singular: 'Cupón',
    plural: 'Cupones',
  },
  admin: {
    defaultColumns: ['code', 'type', 'amount', 'expirationDate', 'restrictions', 'applyMode'],
    useAsTitle: 'code',
  },
  fields: [
    {
      name: 'code',
      type: 'text',
      label: 'Código del Cupón',
      required: true,
      unique: true,
      admin: {
        placeholder: 'Generado automáticamente si está vacío',
      },
    },
    {
      name: 'type',
      type: 'select',
      label: 'Tipo de Cupón',
      defaultValue: 'percentage',
      options: [
        {
          label: 'Porcentaje',
          value: 'percentage',
        },
        {
          label: 'Monto Fijo',
          value: 'fixed',
        },
      ],
    },
    {
      name: 'amount',
      type: 'number',
      label: 'Importe',
      defaultValue: 0,
      required: true,
      admin: {
        placeholder: 'Ingrese el importe',
      },
    },
    {
      name: 'expirationDate',
      type: 'date',
      label: 'Fecha de Caducidad',
      required: false,
      admin: {
        description: 'Dejar vacío si no expira',
      },
    },
    {
      name: 'restrictions',
      type: 'checkbox',
      label: 'Marque esta casilla si el cupón no se puede utilizar con otros cupones',
      defaultValue: true,
    },
    {
      name: 'applyMode',
      type: 'select',
      label: '¿Cómo se aplica este cupón?',
      required: true,
      defaultValue: 'per-course',
      options: [
        {
          label: 'A cada curso (per-course)',
          value: 'per-course',
        },
        {
          label: 'Al total del carrito (per-cart)',
          value: 'per-cart',
        },
      ],
      admin: {
        description:
          'Si es "per-course", descuenta en cada producto permitido. Si es "per-cart", descuenta del total del carrito.',
      },
    },
    {
      name: 'products',
      type: 'relationship',
      label: 'Productos',
      relationTo: 'cursos',
      hasMany: true,
      admin: {
        description:
          'Elija los cursos a los que aplica el cupón. Vacío por defecto para que no tenga efecto.',
      },
    },
    {
      name: 'excludeProducts',
      type: 'relationship',
      label: 'Excluir Productos',
      relationTo: 'cursos',
      hasMany: true,
      admin: {
        description:
          'Elija los cursos a los que NO aplica el cupón. Vacío por defecto para que no tenga efecto.',
      },
    },
    {
      name: 'categories',
      type: 'relationship',
      label: 'Categorías del Producto',
      relationTo: 'categorias',
      hasMany: true,
      admin: {
        description:
          'Elija las categorías a las que aplica el cupón. Vacío por defecto para que no tenga efecto.',
      },
    },
    {
      name: 'excludeCategories',
      type: 'relationship',
      label: 'Excluir Categorías',
      relationTo: 'categorias',
      hasMany: true,
      admin: {
        description:
          'Elija las categorías a las que NO aplica el cupón. Vacío por defecto para que no tenga efecto.',
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data }) => {
        if (!data.code) {
          // Generate a random 4-digit code if the code field is empty
          data.code = Math.random().toString(36).substr(2, 4).toUpperCase()
        }
      },
    ],
  },
}
