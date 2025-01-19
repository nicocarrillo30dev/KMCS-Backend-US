import type { CollectionConfig } from 'payload'
import type { CollectionBeforeValidateHook } from 'payload'
import slugify from 'slugify'

const slugBeforeValidate: CollectionBeforeValidateHook = ({ data }) => {
  if (data && data.name && !data.slug) {
    data.slug = slugify(data.name, { lower: true })
  }
  return data
}

export const Categorias: CollectionConfig = {
  slug: 'categorias',
  labels: {
    singular: 'Categoría',
    plural: 'Categorías',
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'isActive'],
  },
  hooks: {
    beforeValidate: [slugBeforeValidate],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Nombre de la Categoría',
      required: true,
      unique: true,
    },
    {
      name: 'slug',
      type: 'text',
      label: 'Slug',
      unique: true,
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      label: 'Estado Activo',
      defaultValue: true,
    },
  ],
}
