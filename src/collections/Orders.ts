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
    beforeChange: [
      async ({ data, req, operation, originalDoc }) => {
        // Si el nuevo estado NO es "completado", no hacemos nada
        if (data.state !== 'completado') {
          return data
        }

        // Si es una actualización y ya estaba completado, no procesamos
        if (operation === 'update' && originalDoc?.state === 'completado') {
          return data
        }

        // Extraer el ID del usuario (puede venir como objeto o como ID)
        const userId = typeof data.client === 'object' ? data.client?.id : data.client
        if (!userId) {
          console.log(
            `Pedido (state: completado) sin client. Se omite enrollments y registros de membresía.`,
          )
          return data
        }

        // Ejecutar en background las llamadas a las APIs externas
        setTimeout(async () => {
          try {
            // 1. Procesar enrollments de cursos virtuales (solo los que existan)
            if (Array.isArray(data.cursos) && data.cursos.length > 0) {
              const expirationDate = new Date()
              expirationDate.setFullYear(expirationDate.getFullYear() + 1)

              // Limitar la concurrencia (por ejemplo, 3 operaciones simultáneas)
              const limit = pLimit(3)
              await Promise.all(
                data.cursos.map((item: any) =>
                  limit(async () => {
                    let courseId: any
                    if (typeof item.cursoRef === 'object') {
                      courseId = item.cursoRef.id
                    } else {
                      courseId = item.cursoRef
                    }
                    console.log(`(Background) Enrolling user ${userId} in course:`, courseId)

                    const enrollmentPayload = {
                      usuario: userId,
                      cursos: [courseId],
                      fechaDeExpiracion: expirationDate.toISOString(),
                      status: 'activo',
                    }

                    try {
                      await fetch('https://admin.nicolascarrillo.com/api/enrollment', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify(enrollmentPayload),
                      })
                    } catch (err) {
                      console.error(`Error en enrollment para curso ${courseId}:`, err)
                    }

                    // Delay opcional muy corto (10ms)
                    await new Promise((resolve) => setTimeout(resolve, 10))
                  }),
                ),
              )
              console.log(
                `(Background) Enrollments for courses procesados para pedido ${data.pedidoID}`,
              )
            }

            // 2. Procesar registros de membresía, si existen
            if (Array.isArray(data.membresias) && data.membresias.length > 0) {
              const limitMem = pLimit(3)
              await Promise.all(
                data.membresias.map((item: any) =>
                  limitMem(async () => {
                    const membershipId =
                      typeof item.membresiaRef === 'object'
                        ? item.membresiaRef.id
                        : item.membresiaRef
                    if (!membershipId) {
                      console.log(
                        `Pedido ${data.pedidoID}: No se encontró un ID válido en membresias.`,
                      )
                      return
                    }
                    console.log(
                      `(Background) Creando registro de membresía para el usuario ${userId}, membresía ${membershipId}.`,
                    )

                    const membershipPayload = {
                      usuario: userId,
                      tipoDeMembresia: membershipId,
                      estado: 'activo',
                      // Si el endpoint calcula la fecha de expiración, no es necesario enviarla
                    }

                    try {
                      await fetch('https://admin.nicolascarrillo.com/api/registro-de-membresias', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify(membershipPayload),
                      })
                    } catch (err) {
                      console.error(`Error en registro de membresía para ${membershipId}:`, err)
                    }

                    await new Promise((resolve) => setTimeout(resolve, 10))
                  }),
                ),
              )
              console.log(
                `(Background) Registros de membresía procesados para pedido ${data.pedidoID}`,
              )
            } else {
              console.log(
                `(Background) No hay membresías en el pedido ${data.pedidoID}, se omite registro de membresía.`,
              )
            }
          } catch (err) {
            console.error('Error en procesamiento background en beforeChange hook:', err)
          }
        }, 0)

        // Devuelve los datos para continuar con la actualización del documento
        return data
      },
    ],
    // Puedes mantener también los hooks beforeChange que ya tengas (por ejemplo, el de validación)
  },
}
