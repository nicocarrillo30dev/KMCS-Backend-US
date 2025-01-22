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

// Define el tipo de datos para cada lección
interface Lesson {
  namelesson?: string
  slug?: string
  [key: string]: any
}

// Define el tipo de datos para el curso
interface CourseData {
  leccion?: Lesson[]
  [key: string]: any
}

interface Lesson {
  namelesson?: string
  slug?: string
}

interface Modulo {
  nombreLeccion?: string
  leccion?: Lesson[]
}

const generateLessonSlug: CollectionBeforeValidateHook = ({ data }: { data?: CourseData }) => {
  if (!data?.Modulos) return data

  data.Modulos = data.Modulos.map((modulo: Modulo) => {
    if (!modulo.leccion) return modulo

    modulo.leccion = modulo.leccion.map((lesson: Lesson) => {
      if (lesson.namelesson && !lesson.slug) {
        lesson.slug = slugify(lesson.namelesson, { lower: true })
      }
      return lesson
    })

    return modulo
  })

  return data
}

export const Cursos: CollectionConfig = {
  slug: 'cursos',
  hooks: {
    beforeValidate: [slugBeforeValidate, generateLessonSlug],
  },

  access: {
    read: () => true, // Allow public read access
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  admin: {
    defaultColumns: ['id', 'title', 'precio', 'categorias', 'estado', 'coverImage'],
    useAsTitle: 'title',
    listSearchableFields: ['title'],
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
              defaultValue: 'publico', // Valor por defecto
            },
            {
              name: 'categorias',
              type: 'relationship',
              label: 'Categoría',
              relationTo: 'categorias',
              hasMany: true,
              defaultValue: [1],
            },
          ],
        },
        {
          label: 'Texto',
          fields: [
            {
              name: 'cantidadDePostres',
              type: 'text',
              label: 'Cantidad de Postres',
              required: false,
            },
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
              name: 'recetas',
              type: 'array',
              label: 'Recetas del Curso',
              labels: {
                singular: 'Receta',
                plural: 'Recetas',
              },
              admin: {
                description:
                  'Añade las recetas únicas asociadas con este curso. Ejemplo: "Cupcakes de fresa", "Cheesecake clásico de Nueva York".',
              },
              fields: [
                {
                  name: 'nombreReceta',
                  type: 'text',
                  label: 'Nombre de la Receta',
                  required: true,
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
                  required: false,
                },
              ],
              defaultValue: [
                {
                  descripcionBeneficio:
                    'Técnicas de horneado para obtener resultados parejos, sin inconvenientes de por medio',
                },
                {
                  descripcionBeneficio: 'Técnicas de preparación',
                },
                {
                  descripcionBeneficio: 'Tips de presentación, decoración y conservación',
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
              name: 'precioConDescuento',
              type: 'number',
              label: 'Precio con Descuento',
            },
            {
              name: 'fechaMaximaDescuento',
              type: 'date',
              label: 'Fecha Máxima de Descuento',
              admin: {
                description:
                  'La hora de finalización será siempre a las 11:59 PM. Por ejemplo, si seleccionas el 15/12/2024, la promoción terminará ese mismo día a las 11:59 PM.',
                date: {
                  displayFormat: 'dd/MM/yyyy',
                },
              },
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
                  'La imagen de portada de los cursos virtuales es en formato rectangular (16:9). Son las imágenes que aparecen cuando ingresas a https://kathymonzon.com/cursos-virtuales',
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
                  'Las imágenes adicionales son las que aparecen dentro de cada curso y el tamaño sugerido es de 4:5. Lo ideal es colocar un número de imágenes impar, Ej. 3, 5, 7; para no dejar espacios en blanco en la página del curso',
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
        {
          label: 'Módulos',
          fields: [
            {
              name: 'fechaHabilitacionCurso',
              type: 'date',
              label: 'Fecha y hora para habilitar el curso',
              admin: {
                date: {
                  pickerAppearance: 'dayAndTime',
                  displayFormat: 'dd/MM/yyyy HH:mm',
                  timeIntervals: 30,
                },
                description:
                  'Rellenar este campo cuando sea un curso en pre venta y haya una fecha y hora específica para habilitar el curso. De lo contrario, no es necesario.',
              },
            },
            {
              name: 'Modulos',
              labels: {
                singular: 'Módulos',
                plural: 'Módulo',
              },
              admin: {
                description:
                  'Un módulo es como una carpeta que agrupa las lecciones relacionadas con un tema específico dentro del curso. Por ejemplo, el módulo "Torta Corazón" incluye todas las lecciones necesarias para aprender a preparar esta receta.',
              },
              type: 'array',
              fields: [
                {
                  name: 'nombreLeccion',
                  label: 'Nombre del Módulo',
                  type: 'text',
                },
                {
                  name: 'leccion',
                  label: 'Lecciones',
                  type: 'array',
                  admin: {
                    description:
                      'Si aplica, coloca el link de Vimeo en el campo, sino coloca el archivo del curso. Ej. La receta. (NO SE PUEDE COLOCAR LINK Y RECETA EN UNA MISMA LECCIÓN, SINO CAUSARÁ ERROR)',
                  },
                  fields: [
                    {
                      name: 'namelesson',
                      label: 'Nombre de la Lección',
                      type: 'text',
                      required: false,
                    },
                    {
                      name: 'slug',
                      label: 'Slug de la Lección',
                      type: 'text',
                      unique: true,
                      admin: {
                        description:
                          'Este campo se rellena automáticamente basado en el nombre de la lección.',
                      },
                    },
                    {
                      name: 'contenidoUrl',
                      label: 'URL del video',
                      type: 'text',
                      required: false,
                    },
                    {
                      name: 'contenidoArchivo',
                      label: 'Archivo de la Lección',
                      type: 'upload',
                      relationTo: 'imagenes',
                      required: false,
                    },
                    {
                      name: 'duration',
                      label: 'Duración del video',
                      type: 'text',
                      required: false,
                      admin: {
                        description: 'Este campo se rellena de forma automática, no tocar.',
                      },
                    },
                    {
                      name: 'miniaturaUrl',
                      label: 'URL de la miniatura',
                      type: 'text',
                      required: false,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
