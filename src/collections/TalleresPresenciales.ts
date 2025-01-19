import type { CollectionConfig } from 'payload'
import type { CollectionBeforeValidateHook } from 'payload'

import slugify from 'slugify'

const slugBeforeValidate: CollectionBeforeValidateHook = ({ data }) => {
  if (!data) return data

  if (data && data.title && !data.slug) {
    data.slug = slugify(data.title, { lower: true })
  }

  return data
}

export const TalleresPresenciales: CollectionConfig = {
  slug: 'talleres-presenciales',
  hooks: {
    beforeValidate: [slugBeforeValidate],
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
  },
  admin: {
    defaultColumns: ['id', 'title', 'precio', 'estado', 'coverImage'],
    useAsTitle: 'title',
    listSearchableFields: ['title'],
  },
  labels: {
    singular: 'Taller Presencial',
    plural: 'Talleres Presenciales',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'General',
          fields: [
            {
              name: 'title',
              type: 'text',
              label: 'Título del Curso',
              required: true,
            },
            {
              name: 'slug',
              type: 'text',
              label: 'Slug',
              unique: true,
              admin: {
                description:
                  'El "slug" es el identificador de cada curso. Ej: https://kathymonzon.com/cursos/👉[pasteles-vintage]👈 (El slug se crea sólo en base al nombre del curso, no hay escribir nada en el campo. Pero si se comete un error, se puede modificar después de crear el curso)',
              },
            },
            {
              name: 'estado',
              type: 'select',
              label: 'Estado',
              options: [
                { label: 'Público', value: 'publico' },
                { label: 'Oculto', value: 'oculto' },
              ],
              defaultValue: 'oculto',
            },
          ],
        },
        {
          label: 'Texto',
          fields: [
            {
              name: 'descripcionCurso',
              type: 'textarea',
              label: 'Descripción del Curso',
              admin: {
                description:
                  'Añade una descripción general del curso. Este texto aparecerá encima de la lista de recetas en la página del curso.',
              },
              required: false,
            },
            {
              name: 'contenido',
              type: 'array',
              label: 'Contenidos del Curso',
              labels: {
                singular: 'Contenido',
                plural: 'Contenidos',
              },
              admin: {
                description:
                  'Añade las recetas o técnicas asociadas con este curso. Ejemplo: "Cupcakes de fresa", "Uso correcto del batido".',
              },
              fields: [
                {
                  name: 'nombre',
                  type: 'text',
                  label: 'Nombre de la Técnica o Receta',
                  required: true,
                },
                {
                  name: 'descripcion',
                  type: 'textarea',
                  label: 'Descripción',
                  admin: {
                    description: 'Añade una breve descripción de la técnica o receta.',
                  },
                },
              ],
            },
            {
              name: 'beneficios',
              type: 'array',
              label: 'Beneficios del Curso',
              labels: {
                singular: 'Beneficio',
                plural: 'Beneficios',
              },
              admin: {
                description: 'Lista los beneficios que ofrece este curso.',
              },
              fields: [
                {
                  name: 'descripcionBeneficio',
                  type: 'text',
                  label: 'Descripción del Beneficio',
                  required: true,
                },
              ],
              defaultValue: [
                {
                  descripcionBeneficio:
                    'Videos demostrativos para todas las etapas de la preparación de los postres',
                },
                {
                  descripcionBeneficio: 'Acceso a todas las clases y contenido durante 12 meses',
                },
                {
                  descripcionBeneficio: 'Demos en video y fotos de todos los postres',
                },
              ],
            },
          ],
        },
        {
          label: 'Detalles del Curso',
          fields: [
            {
              name: 'precio',
              type: 'number',
              label: 'Precio',
              required: true,
            },
            {
              name: 'gruposDeFechas',
              type: 'array', // Campo para agrupar fechas
              label: 'Grupos de Fechas de Clases',
              admin: {
                description: 'Añade grupos de fechas. Cada grupo puede tener múltiples fechas.',
              },
              fields: [
                {
                  name: 'nombreGrupo',
                  type: 'text',
                  label: 'Nombre del Grupo de Fechas',
                  required: true, // Cada grupo necesita un nombre
                },
                {
                  name: 'vacantes',
                  type: 'number', // Campo para número de vacantes
                  label: 'Número de Vacantes',
                  required: true, // Asegura que se defina un número
                  admin: {
                    description: 'Número total de vacantes disponibles para este grupo.',
                  },
                },
                {
                  name: 'horario',
                  type: 'text', // Campo de texto para el horario
                  label: 'Horario del Grupo',
                  required: true,
                  admin: {
                    description: 'Especifica el horario del grupo (Ejemplo: 3 PM - 7 PM).',
                  },
                },
                {
                  name: 'fechas',
                  type: 'array',
                  label: 'Fechas',
                  fields: [
                    {
                      name: 'fechaClase',
                      type: 'date',
                      label: 'Fecha de Clase',
                      required: true,
                      admin: {
                        date: {
                          displayFormat: 'dd/MM/yyyy',
                        },
                      },
                    },
                  ],
                },
              ],
            },
            {
              name: 'nivel',
              type: 'select',
              label: 'Nivel',
              options: [
                { label: 'Principiante', value: 'principiante' },
                { label: 'Intermedio', value: 'intermedio' },
                { label: 'Avanzado', value: 'avanzado' },
              ],
              required: false,
              defaultValue: 'principiante',
            },
            {
              name: 'diasExpiracion',
              type: 'number',
              label: 'Días de Expiración',
              defaultValue: 365,
            },
            {
              name: 'preguntasYRespuestas',
              type: 'checkbox',
              label: 'Preguntas y Respuestas',
              defaultValue: false,
            },
          ],
        },
        {
          label: 'Imágenes',
          fields: [
            {
              name: 'coverImage',
              type: 'upload',
              label: 'Imagen de Portada',
              relationTo: 'imagenes',
              maxDepth: 1,
              admin: {
                description:
                  'La imagen de portada de los talleres presenciales es en formato rectangular (4:5). Son las imágenes que aparecen cuando ingresas a https://kathymonzon.com/talleres-presenciales',
              },
            },
            {
              name: 'imagenesAdicionales',
              labels: {
                singular: 'Imagen Adicional',
                plural: 'Imágenes Adicionales',
              },
              admin: {
                description:
                  'Las imágenes adicionales son las que aparecen dentro de cada curso y el tamaño sugerido es de (4:5). Lo ideal es colocar un número de imágenes impar, Ej. 3, 5, 7; para no dejar espacios en blanco en la página del curso',
              },
              type: 'array',
              fields: [
                {
                  name: 'imagen',
                  label: 'Imagen',
                  type: 'upload',
                  relationTo: 'imagenes',
                  maxDepth: 1,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
