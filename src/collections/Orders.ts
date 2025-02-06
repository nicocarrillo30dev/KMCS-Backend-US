import type { CollectionConfig } from 'payload'

export const pedidos: CollectionConfig = {
  slug: 'pedidos',

  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },

  fields: [
    {
      name: 'pedidoID',
      type: 'text',
      label: 'ID de Pedido',
      required: true,
      admin: {
        description: 'Un ID o código interno para identificar este pedido.',
      },
    },
    {
      name: 'date',
      type: 'date',
      label: 'Fecha del Pedido',
      required: true,
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
        },
      },
    },
    {
      name: 'state',
      type: 'select',
      label: 'Estado del Pedido',
      options: [
        { label: 'Pendiente', value: 'pendiente' },
        { label: 'Completado', value: 'completado' },
        { label: 'Cancelado', value: 'cancelado' },
      ],
      defaultValue: 'pendiente',
      required: true,
    },
    {
      name: 'client',
      type: 'relationship',
      label: 'Cliente (Usuario)',
      relationTo: 'usuarios',
      required: false,
    },
    {
      name: 'nombre',
      type: 'text',
      label: 'Nombre Facturación',
    },
    {
      name: 'apellidos',
      type: 'text',
      label: 'Apellidos Facturación',
    },
    {
      name: 'country',
      type: 'text',
      label: 'País',
    },
    {
      name: 'phone',
      type: 'text',
      label: 'Teléfono',
    },
    {
      name: 'payment',
      type: 'text',
      label: 'Método de Pago',
      required: false,
      admin: {
        description: 'Ej: "Yape", "Plin", "Transferencia", "Tarjeta", etc.',
      },
    },
    {
      name: 'capturaPago',
      label: 'Captura Pago',
      type: 'upload',
      relationTo: 'captura-de-pagos',
      required: false,
    },
    {
      name: 'activeCoupon',
      type: 'relationship',
      label: 'Cupón Aplicado',
      relationTo: 'cupones',
      required: false,
    },

    // ----------- Cursos Comprado -----------
    {
      name: 'cursos',
      type: 'array',
      label: 'Cursos Comprados',
      minRows: 0,
      fields: [
        {
          name: 'cursoRef',
          type: 'relationship',
          label: 'Referencia del Curso',
          relationTo: 'cursos',
          required: true,
        },
        {
          name: 'price',
          type: 'number',
          label: 'Precio Original',
        },
        {
          name: 'pricewithDiscount',
          type: 'number',
          label: 'Precio con Descuento',
          required: false,
        },
        {
          name: 'customTotalPrice',
          type: 'number',
          label: 'Precio Editado Manualmente',
        },
        {
          name: 'discountApplied',
          type: 'number',
          label: 'Descuento Aplicado (Por Cupón o Membresía)',
        },
        {
          name: 'finalPrice',
          type: 'number',
          label: 'Precio Final',
          admin: {
            description: 'Precio final después de aplicar descuentos y/o edición manual',
          },
        },
      ],
    },

    // ----------- Talleres Presenciales -----------
    {
      name: 'talleresPresenciales',
      type: 'array',
      label: 'Talleres Presenciales Comprados',
      minRows: 0,
      fields: [
        {
          name: 'tallerRef',
          type: 'relationship',
          label: 'Referencia del Taller Presencial',
          relationTo: 'talleres-presenciales',
          required: true,
        },
        {
          name: 'price',
          type: 'number',
          label: 'Precio Original',
        },
        {
          name: 'customTotalPrice',
          type: 'number',
          label: 'Precio Editado Manualmente',
        },
        {
          name: 'discountApplied',
          type: 'number',
          label: 'Descuento Aplicado (Por Cupón o Membresía)',
        },
        {
          name: 'finalPrice',
          type: 'number',
          label: 'Precio Final',
          admin: {
            description: 'Precio final después de aplicar descuentos y/o edición manual',
          },
        },
        {
          name: 'schedule',
          type: 'text',
          label: 'Horario',
        },
      ],
    },

    // ----------- Membresías Compradas -----------
    {
      name: 'membresias',
      type: 'array',
      label: 'Membresías Compradas',
      minRows: 0,
      fields: [
        {
          name: 'membresiaRef',
          type: 'relationship',
          label: 'Referencia de la Membresía',
          relationTo: 'membresias',
          required: true,
        },
        {
          name: 'price',
          type: 'number',
          label: 'Precio Original',
        },
        {
          name: 'customTotalPrice',
          type: 'number',
          label: 'Precio Editado Manualmente',
        },
        {
          name: 'discountApplied',
          type: 'number',
          label: 'Descuento Aplicado (Por Cupón o Membresía)',
        },
        {
          name: 'finalPrice',
          type: 'number',
          label: 'Precio Final',
          admin: {
            description: 'Precio final después de aplicar descuentos y/o edición manual',
          },
        },
      ],
    },

    // ----------- Total del Pedido -----------
    {
      name: 'totalPrice',
      type: 'number',
      label: 'Total del Pedido',
      admin: {
        description: 'Suma de todos los productos finales, con descuentos aplicados.',
      },
    },
  ],

  hooks: {
    afterChange: [
      async ({ doc, req, operation, previousDoc }) => {
        // Solo procesar si el estado es 'completado'
        if (doc.state !== 'completado') {
          return
        }

        // Evitar reprocesar si ya estaba en 'completado'
        if (operation === 'update' && previousDoc?.state === 'completado') {
          return
        }

        // Llamar al endpoint en el nuevo servidor
        try {
          await fetch('https://server-production-021a.up.railway.app/process-completado', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ doc, operation, previousDoc }),
          })
        } catch (err) {
          console.error('Error en fetch a /process-completado:', err)
        }
      },
    ],
  },
}
