import type { CollectionConfig } from 'payload'

type Mensaje = {
  tipo: 'texto' | 'imagen'
  contenido?: string // Solo para texto
  imagen?: string // Solo para imágenes
  enviadoPor: 'usuario' | 'profesora'
}

const PreguntasRespuestas: CollectionConfig = {
  slug: 'preguntasRespuestas',
  labels: {
    singular: 'Pregunta y Respuesta',
    plural: 'Preguntas y Respuestas',
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
      name: 'nombreDelUsuario',
      type: 'text',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'curso',
      type: 'relationship',
      relationTo: 'cursos',
      required: true,
    },
    {
      name: 'mensajes',
      type: 'array',
      fields: [
        {
          name: 'tipo',
          type: 'select',
          options: [
            { label: 'Texto', value: 'texto' },
            { label: 'Imagen', value: 'imagen' },
          ],
          required: true,
        },
        {
          name: 'contenido',
          type: 'textarea',
          admin: {
            condition: (data, siblingData) => siblingData?.tipo === 'texto',
          },
        },
        {
          name: 'imagen',
          type: 'upload',
          relationTo: 'fotosPreguntas',
          admin: {
            condition: (data, siblingData) => siblingData?.tipo === 'imagen',
          },
        },
        {
          name: 'enviadoPor',
          type: 'select',
          options: [
            { label: 'Usuario', value: 'usuario' },
            { label: 'Profesora', value: 'profesora' },
          ],
          required: true,
        },
      ],
    },
    {
      name: 'estado',
      type: 'select',
      options: ['En proceso', 'Resuelta'],
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'fechaPregunta',
      type: 'date',
      admin: {
        readOnly: true,
        date: {
          displayFormat: 'dd/MM/yyyy',
        },
      },
      defaultValue: () => new Date().toISOString(),
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, originalDoc }) => {
        if (!originalDoc) {
          // Si es un nuevo documento, establece el estado inicial
          data.estado = 'En proceso'
          return data
        }

        // Verifica si hay nuevos mensajes enviados por el usuario
        const nuevosMensajesUsuario = data.mensajes?.filter(
          (msg: Mensaje) => msg.enviadoPor === 'usuario',
        )

        const mensajesUsuarioPrevios = originalDoc.mensajes?.filter(
          (msg: Mensaje) => msg.enviadoPor === 'usuario',
        )

        if (nuevosMensajesUsuario?.length > (mensajesUsuarioPrevios?.length || 0)) {
          data.estado = 'En proceso'
        }

        // Verifica si hay nuevos mensajes enviados por la profesora
        const nuevosMensajesProfesora = data.mensajes?.filter(
          (msg: Mensaje) => msg.enviadoPor === 'profesora',
        )

        const mensajesProfesoraPrevios = originalDoc.mensajes?.filter(
          (msg: Mensaje) => msg.enviadoPor === 'profesora',
        )

        if (nuevosMensajesProfesora?.length > (mensajesProfesoraPrevios?.length || 0)) {
          data.estado = 'Resuelta'
        }

        return data
      },
      async ({ data, req }) => {
        if (data.usuario) {
          const usuario = await req.payload.findByID({
            collection: 'usuarios',
            id: data.usuario,
          })

          if (usuario) {
            const nombreCompleto = `${usuario.nombre || ''} ${usuario.apellidos || ''}`.trim()
            data.nombreDelUsuario = nombreCompleto || 'Nombre no disponible'
          } else {
            data.nombreDelUsuario = 'Nombre no disponible'
          }
        }

        return data
      },
    ],
  },
  admin: {
    useAsTitle: 'nombreDelUsuario',
  },
}

export default PreguntasRespuestas
