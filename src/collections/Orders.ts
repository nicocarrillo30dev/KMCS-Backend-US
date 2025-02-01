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

        // 2. Si es actualización, podemos verificar si YA estaba completado antes
        //    para NO reprocesar (opcional, quítalo si quieres re-ejecutar cada vez).
        if (operation === 'update') {
          if (originalDoc?.state === 'completado') {
            console.log(
              `Pedido ${doc.id} ya estaba en estado 'completado'. Se omite reprocesar enrollments.`,
            )
            return
          }
        }

        // A estas alturas, el pedido es nuevo (create) o acaba de cambiar a "completado" (update)

        // 3. Extraer el ID del usuario (puede llegar como objeto o ID)
        const userId = typeof doc.client === 'object' ? doc.client?.id : doc.client

        if (!userId) {
          console.log(
            `Pedido ${doc.id} está 'completado' pero no tiene 'client'. No se crean enrollments ni membresías.`,
          )
          return
        }

        // -------------------------
        // ENROLAR CURSOS
        // -------------------------
        if (Array.isArray(doc.cursos) && doc.cursos.length > 0) {
          const expirationDate = new Date()
          expirationDate.setFullYear(expirationDate.getFullYear() + 1)

          for (const item of doc.cursos) {
            let courseId: any
            if (typeof item.cursoRef === 'object') {
              courseId = item.cursoRef.id
            } else {
              courseId = item.cursoRef
            }
            console.log(`Enrolling user ${userId} in course:`, courseId)

            // Crear enrollment individual para este curso
            await req.payload.create({
              collection: 'enrollment',
              data: {
                usuario: userId,
                cursos: [courseId], // Enrollment individual: un solo curso en un array
                fechaDeExpiracion: expirationDate.toISOString(),
                status: 'activo',
              },
              overrideAccess: true,
            })

            // Espera 100 ms antes de procesar el siguiente curso
            await new Promise((resolve) => setTimeout(resolve, 100))
          }
          console.log(`Enrollments created individually for pedido ${doc.id}`)
        }

        // -------------------------
        // CREAR REGISTRO DE MEMBRESÍAS
        // -------------------------
        if (Array.isArray(doc.membresias) && doc.membresias.length > 0) {
          for (const item of doc.membresias) {
            const membershipId =
              typeof item.membresiaRef === 'object' ? item.membresiaRef?.id : item.membresiaRef

            if (!membershipId) {
              console.log(
                `Pedido ${doc.id}: no se encontró un ID de membresía válido en 'membresias'.`,
              )
              continue
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
                // La "fechaDeExpiracion" se autocalcula en los hooks de registro-de-membresias
              },
              overrideAccess: true,
            })
          }
          console.log(`Registro(s) de membresía creados para el pedido ${doc.id}`)
        }

        console.log(`Pedido ${doc.id} en 'completado' procesado con éxito.`)
      },
    ],
  },
}
