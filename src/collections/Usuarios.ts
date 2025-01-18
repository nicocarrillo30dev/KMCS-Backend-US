import type { CollectionConfig } from 'payload'

export const Usuarios: CollectionConfig = {
  slug: 'usuarios',

  access: {
    read: () => true,
    create: () => true,
    update: () => true,
  },
  admin: {
    useAsTitle: 'email',
  },
  auth: {},

  fields: [
    {
      name: 'nombre',
      type: 'text',
      label: 'Nombre',
      required: true,
    },
    {
      name: 'apellidos',
      type: 'text',
      label: 'Apellidos',
      required: false,
    },
    {
      name: 'pais',
      type: 'select',
      label: 'País',
      required: false,
      options: [
        { value: 'andorra', label: 'Andorra' },
        { value: 'argentina', label: 'Argentina' },
        { value: 'australia', label: 'Australia' },
        { value: 'austria', label: 'Austria' },
        { value: 'bahamas', label: 'Bahamas' },
        { value: 'belgica', label: 'Bélgica' },
        { value: 'bolivia', label: 'Bolivia' },
        { value: 'brasil', label: 'Brasil' },
        { value: 'canada', label: 'Canadá' },
        { value: 'chile', label: 'Chile' },
        { value: 'china', label: 'China' },
        { value: 'colombia', label: 'Colombia' },
        { value: 'costa_rica', label: 'Costa Rica' },
        { value: 'croacia', label: 'Croacia' },
        { value: 'cuba', label: 'Cuba' },
        { value: 'chipre', label: 'Chipre' },
        { value: 'republica_checa', label: 'República Checa' },
        { value: 'dinamarca', label: 'Dinamarca' },
        { value: 'dominica', label: 'Dominica' },
        { value: 'republica_dominicana', label: 'República Dominicana' },
        { value: 'ecuador', label: 'Ecuador' },
        { value: 'egipto', label: 'Egipto' },
        { value: 'el_salvador', label: 'El Salvador' },
        { value: 'espana', label: 'España' },
        { value: 'estados_unidos', label: 'Estados Unidos' },
        { value: 'estonia', label: 'Estonia' },
        { value: 'finlandia', label: 'Finlandia' },
        { value: 'francia', label: 'Francia' },
        { value: 'georgia', label: 'Georgia' },
        { value: 'alemania', label: 'Alemania' },
        { value: 'grecia', label: 'Grecia' },
        { value: 'granada', label: 'Granada' },
        { value: 'guatemala', label: 'Guatemala' },
        { value: 'honduras', label: 'Honduras' },
        { value: 'islandia', label: 'Islandia' },
        { value: 'irlanda', label: 'Irlanda' },
        { value: 'italia', label: 'Italia' },
        { value: 'jamaica', label: 'Jamaica' },
        { value: 'japon', label: 'Japón' },
        { value: 'corea_del_sur', label: 'Corea del Sur' },
        { value: 'mexico', label: 'México' },
        { value: 'monaco', label: 'Mónaco' },
        { value: 'paises_bajos', label: 'Países Bajos' },
        { value: 'nueva_zelanda', label: 'Nueva Zelanda' },
        { value: 'nicaragua', label: 'Nicaragua' },
        { value: 'noruega', label: 'Noruega' },
        { value: 'panama', label: 'Panamá' },
        { value: 'paraguay', label: 'Paraguay' },
        { value: 'peru', label: 'Perú' },
        { value: 'polonia', label: 'Polonia' },
        { value: 'portugal', label: 'Portugal' },
        { value: 'rusia', label: 'Rusia' },
        { value: 'san_marino', label: 'San Marino' },
        { value: 'serbia', label: 'Serbia' },
        { value: 'singapur', label: 'Singapur' },
        { value: 'eslovaquia', label: 'Eslovaquia' },
        { value: 'eslovenia', label: 'Eslovenia' },
        { value: 'suecia', label: 'Suecia' },
        { value: 'suiza', label: 'Suiza' },
        { value: 'trinidad_y_tobago', label: 'Trinidad y Tobago' },
        { value: 'turquia', label: 'Turquía' },
        { value: 'ucrania', label: 'Ucrania' },
        { value: 'reino_unido', label: 'Reino Unido' },
        { value: 'uruguay', label: 'Uruguay' },
        { value: 'ciudad_del_vaticano', label: 'Ciudad del Vaticano' },
        { value: 'venezuela', label: 'Venezuela' },
      ],
    },
    {
      name: 'numero',
      type: 'number',
      label: 'Número',
      required: false,
    },
    {
      name: 'role',
      label: 'Rol',
      type: 'select',
      required: true,
      options: [
        { label: 'Admin', value: 'Admin' },
        { label: 'User', value: 'User' },
      ],
      defaultValue: 'User',
    },
  ],
}
