import type { CollectionConfig } from 'payload'
import pLimit from 'p-limit'

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

    // ----------- Cursos Comprados -----------
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
      async (args: any) => {
        const { doc, req, operation, originalDoc } = args

        // 1. Solo procesar si doc.state es "completado"
        if (doc.state !== 'completado') {
          return
        }

        // 2. Si es actualización y ya estaba completado, se omite reprocesar
        if (operation === 'update' && originalDoc?.state === 'completado') {
          console.log(
            `Pedido ${doc.id} ya estaba en estado 'completado'. Se omite reprocesar enrollments.`,
          )
          return
        }

        // 3. Extraer el ID del usuario (puede venir como objeto o como ID)
        const userId = typeof doc.client === 'object' ? doc.client?.id : doc.client
        if (!userId) {
          console.log(
            `Pedido ${doc.id} está 'completado' pero no tiene 'client'. No se crean enrollments ni membresías.`,
          )
          return
        }

        // -------------------------
        // ENROLAR CURSOS - Procesar de forma concurrente con límite
        // -------------------------
        if (Array.isArray(doc.cursos) && doc.cursos.length > 0) {
          const expirationDate = new Date()
          expirationDate.setFullYear(expirationDate.getFullYear() + 1)

          // Usamos p-limit para limitar la concurrencia (por ejemplo, 3 operaciones simultáneas)
          const limit = pLimit(3)

          await Promise.all(
            doc.cursos.map((item: any) =>
              limit(async () => {
                let courseId: any
                if (typeof item.cursoRef === 'object') {
                  courseId = item.cursoRef.id
                } else {
                  courseId = item.cursoRef
                }
                console.log(`Enrolling user ${userId} in course:`, courseId)

                await req.payload.create({
                  collection: 'enrollment',
                  data: {
                    usuario: userId,
                    cursos: [courseId], // Enrollment individual
                    fechaDeExpiracion: expirationDate.toISOString(),
                    status: 'activo',
                  },
                  overrideAccess: true,
                })
                // Delay opcional muy corto (por ejemplo, 10ms) entre cada inserción
                await new Promise((resolve) => setTimeout(resolve, 10))
              }),
            ),
          )
          console.log(`Enrollments created concurrently for pedido ${doc.id}`)
        }

        // -------------------------
        // CREAR REGISTRO DE MEMBRESÍAS - Procesar de forma concurrente solo si hay membresías
        // -------------------------
        if (Array.isArray(doc.membresias) && doc.membresias.length > 0) {
          // Puedes limitar la concurrencia aquí también si lo consideras necesario
          const limitMem = pLimit(3)
          await Promise.all(
            doc.membresias.map((item: any) =>
              limitMem(async () => {
                const membershipId =
                  typeof item.membresiaRef === 'object' ? item.membresiaRef?.id : item.membresiaRef
                if (!membershipId) {
                  console.log(
                    `Pedido ${doc.id}: no se encontró un ID de membresía válido en 'membresias'.`,
                  )
                  return
                }
                console.log(
                  `Creando registro de membresía para el usuario ${userId}, membresía ${membershipId}.`,
                )
                await req.payload.create({
                  collection: 'registro-de-membresias',
                  data: {
                    usuario: userId,
                    tipoDeMembresia: membershipId,
                    estado: 'activo',
                    // La fechaDeExpiracion se autocalcula en los hooks de registro-de-membresias
                  },
                  overrideAccess: true,
                })
              }),
            ),
          )
          console.log(`Registro(s) de membresía creados para el pedido ${doc.id}`)
        } else {
          console.log(
            `No hay membresías en el pedido ${doc.id}, se omite crear registros de membresía.`,
          )
        }

        console.log(`Pedido ${doc.id} en 'completado' procesado con éxito.`)
      },
    ],
  },
}
