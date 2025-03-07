/* tslint:disable */
/* eslint-disable */
/**
 * This file was automatically generated by Payload.
 * DO NOT MODIFY IT BY HAND. Instead, modify your source Payload config,
 * and re-run `payload generate:types` to regenerate this file.
 */

export interface Config {
  auth: {
    usuarios: UsuarioAuthOperations;
  };
  collections: {
    'captura-de-pagos': CapturaDePago;
    categorias: Categoria;
    cursos: Curso;
    cupones: Cupone;
    enrollment: Enrollment;
    fotosPreguntas: FotosPregunta;
    fotosUsuarios: FotosUsuario;
    ingredientesmuffins: Ingredientesmuffin;
    imagenes: Imagene;
    recetasmuffins: Recetasmuffin;
    'imagenes-reviews': ImagenesReview;
    membresias: Membresia;
    pedidos: Pedido;
    preguntasRespuestas: PreguntasRespuesta;
    'registro-de-membresias': RegistroDeMembresia;
    'reviews-cursos-virtuales': ReviewsCursosVirtuale;
    'reviews-talleres-presenciales': ReviewsTalleresPresenciale;
    'talleres-presenciales': TalleresPresenciale;
    usuarios: Usuario;
    'payload-locked-documents': PayloadLockedDocument;
    'payload-preferences': PayloadPreference;
    'payload-migrations': PayloadMigration;
  };
  collectionsJoins: {};
  collectionsSelect: {
    'captura-de-pagos': CapturaDePagosSelect<false> | CapturaDePagosSelect<true>;
    categorias: CategoriasSelect<false> | CategoriasSelect<true>;
    cursos: CursosSelect<false> | CursosSelect<true>;
    cupones: CuponesSelect<false> | CuponesSelect<true>;
    enrollment: EnrollmentSelect<false> | EnrollmentSelect<true>;
    fotosPreguntas: FotosPreguntasSelect<false> | FotosPreguntasSelect<true>;
    fotosUsuarios: FotosUsuariosSelect<false> | FotosUsuariosSelect<true>;
    ingredientesmuffins: IngredientesmuffinsSelect<false> | IngredientesmuffinsSelect<true>;
    imagenes: ImagenesSelect<false> | ImagenesSelect<true>;
    recetasmuffins: RecetasmuffinsSelect<false> | RecetasmuffinsSelect<true>;
    'imagenes-reviews': ImagenesReviewsSelect<false> | ImagenesReviewsSelect<true>;
    membresias: MembresiasSelect<false> | MembresiasSelect<true>;
    pedidos: PedidosSelect<false> | PedidosSelect<true>;
    preguntasRespuestas: PreguntasRespuestasSelect<false> | PreguntasRespuestasSelect<true>;
    'registro-de-membresias': RegistroDeMembresiasSelect<false> | RegistroDeMembresiasSelect<true>;
    'reviews-cursos-virtuales': ReviewsCursosVirtualesSelect<false> | ReviewsCursosVirtualesSelect<true>;
    'reviews-talleres-presenciales': ReviewsTalleresPresencialesSelect<false> | ReviewsTalleresPresencialesSelect<true>;
    'talleres-presenciales': TalleresPresencialesSelect<false> | TalleresPresencialesSelect<true>;
    usuarios: UsuariosSelect<false> | UsuariosSelect<true>;
    'payload-locked-documents': PayloadLockedDocumentsSelect<false> | PayloadLockedDocumentsSelect<true>;
    'payload-preferences': PayloadPreferencesSelect<false> | PayloadPreferencesSelect<true>;
    'payload-migrations': PayloadMigrationsSelect<false> | PayloadMigrationsSelect<true>;
  };
  db: {
    defaultIDType: number;
  };
  globals: {};
  globalsSelect: {};
  locale: null;
  user: Usuario & {
    collection: 'usuarios';
  };
  jobs: {
    tasks: unknown;
    workflows: unknown;
  };
}
export interface UsuarioAuthOperations {
  forgotPassword: {
    email: string;
    password: string;
  };
  login: {
    email: string;
    password: string;
  };
  registerFirstUser: {
    email: string;
    password: string;
  };
  unlock: {
    email: string;
    password: string;
  };
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "captura-de-pagos".
 */
export interface CapturaDePago {
  id: number;
  SupaURL?: string | null;
  prefix?: string | null;
  updatedAt: string;
  createdAt: string;
  url?: string | null;
  thumbnailURL?: string | null;
  filename?: string | null;
  mimeType?: string | null;
  filesize?: number | null;
  width?: number | null;
  height?: number | null;
  focalX?: number | null;
  focalY?: number | null;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "categorias".
 */
export interface Categoria {
  id: number;
  name: string;
  slug: string;
  isActive?: boolean | null;
  updatedAt: string;
  createdAt: string;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "cursos".
 */
export interface Curso {
  id: number;
  title: string;
  /**
   * El "slug" es el identificador de cada curso. Ej: https://kathymonzon.com/cursos/👉[pasteles-vintage]👈 (El slug se crea sólo en base al nombre del curso, no hay escribir nada en el campo. Pero si se comete un error, se puede modificar después de crear el curso)
   */
  slug?: string | null;
  estado?: ('publico' | 'oculto') | null;
  categorias?: (number | Categoria)[] | null;
  cantidadDePostres?: string | null;
  /**
   * Añade una descripción general del curso. Este texto aparecerá encima de la lista de recetas en la página del curso.
   */
  descripcionCurso?: string | null;
  /**
   * Añade las recetas únicas asociadas con este curso. Ejemplo: "Cupcakes de fresa", "Cheesecake clásico de Nueva York".
   */
  recetas?:
    | {
        nombreReceta: string;
        id?: string | null;
      }[]
    | null;
  /**
   * Lista los beneficios que ofrece este curso.
   */
  beneficios?:
    | {
        descripcionBeneficio?: string | null;
        id?: string | null;
      }[]
    | null;
  promedioreviews?: number | null;
  precio: number;
  precioConDescuento?: number | null;
  /**
   * La hora de finalización será siempre a las 11:59 PM. Por ejemplo, si seleccionas el 15/12/2024, la promoción terminará ese mismo día a las 11:59 PM.
   */
  fechaMaximaDescuento?: string | null;
  nivel?: ('principiante' | 'intermedio' | 'avanzado') | null;
  diasExpiracion?: number | null;
  preguntasYRespuestas?: boolean | null;
  /**
   * La imagen de portada de los cursos virtuales es en formato rectangular (16:9). Son las imágenes que aparecen cuando ingresas a https://kathymonzon.com/cursos-virtuales
   */
  coverImage?: (number | null) | Imagene;
  /**
   * Las imágenes adicionales son las que aparecen dentro de cada curso y el tamaño sugerido es de 4:5. Lo ideal es colocar un número de imágenes impar, Ej. 3, 5, 7; para no dejar espacios en blanco en la página del curso
   */
  imagenesAdicionales?:
    | {
        imagen?: (number | null) | Imagene;
        id?: string | null;
      }[]
    | null;
  /**
   * Rellenar este campo cuando sea un curso en pre venta y haya una fecha y hora específica para habilitar el curso. De lo contrario, no es necesario.
   */
  fechaHabilitacionCurso?: string | null;
  /**
   * Un módulo es como una carpeta que agrupa las lecciones relacionadas con un tema específico dentro del curso. Por ejemplo, el módulo "Torta Corazón" incluye todas las lecciones necesarias para aprender a preparar esta receta.
   */
  Modulos?:
    | {
        nombreLeccion?: string | null;
        /**
         * Si aplica, coloca el link de Vimeo en el campo, sino coloca el archivo del curso. Ej. La receta. (NO SE PUEDE COLOCAR LINK Y RECETA EN UNA MISMA LECCIÓN, SINO CAUSARÁ ERROR)
         */
        leccion?:
          | {
              namelesson?: string | null;
              /**
               * Este campo se rellena automáticamente basado en el nombre de la lección.
               */
              slug?: string | null;
              contenidoUrl?: string | null;
              contenidoArchivo?: (number | null) | Imagene;
              /**
               * Este campo se rellena de forma automática, no tocar.
               */
              duration?: string | null;
              miniaturaUrl?: string | null;
              descripcionMiniatura?: string | null;
              id?: string | null;
            }[]
          | null;
        id?: string | null;
      }[]
    | null;
  updatedAt: string;
  createdAt: string;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "imagenes".
 */
export interface Imagene {
  id: number;
  /**
   *
   *           Describe la imagen de manera clara y precisa para mejorar el SEO, la accesibilidad y destacar la marca Kathy Monzón Cake Studio.
   *           Por ejemplo, si la imagen es de una torta de chocolate, escribe:
   *           "Curso Virtual "Torta de Chocolate"- Torta de chocolate decorada con fresas - Kathy Monzón Cake Studio".
   *
   */
  Alt?: string | null;
  SupaURL?: string | null;
  prefix?: string | null;
  updatedAt: string;
  createdAt: string;
  url?: string | null;
  thumbnailURL?: string | null;
  filename?: string | null;
  mimeType?: string | null;
  filesize?: number | null;
  width?: number | null;
  height?: number | null;
  focalX?: number | null;
  focalY?: number | null;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "cupones".
 */
export interface Cupone {
  id: number;
  code: string;
  type?: ('percentage' | 'fixed') | null;
  amount: number;
  /**
   * Dejar vacío si no expira
   */
  expirationDate?: string | null;
  restrictions?: boolean | null;
  /**
   * Si es "per-course", descuenta en cada producto permitido. Si es "per-cart", descuenta del total del carrito.
   */
  applyMode: 'per-course' | 'per-cart';
  /**
   * Elija los cursos a los que aplica el cupón. Vacío por defecto para que no tenga efecto.
   */
  products?: (number | Curso)[] | null;
  /**
   * Elija los cursos a los que NO aplica el cupón. Vacío por defecto para que no tenga efecto.
   */
  excludeProducts?: (number | Curso)[] | null;
  /**
   * Elija las categorías a las que aplica el cupón. Vacío por defecto para que no tenga efecto.
   */
  categories?: (number | Categoria)[] | null;
  /**
   * Elija las categorías a las que NO aplica el cupón. Vacío por defecto para que no tenga efecto.
   */
  excludeCategories?: (number | Categoria)[] | null;
  updatedAt: string;
  createdAt: string;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "enrollment".
 */
export interface Enrollment {
  id: number;
  usuario: number | Usuario;
  cursos: (number | Curso)[];
  status: 'activo' | 'inactivo';
  fechaDeExpiracion: string;
  completedLessons?:
    | {
        lessonSlug?: string | null;
        completedAt?: string | null;
        toggleLesson?: boolean | null;
        id?: string | null;
      }[]
    | null;
  updatedAt: string;
  createdAt: string;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "usuarios".
 */
export interface Usuario {
  id: number;
  nombre: string;
  apellidos?: string | null;
  pais?:
    | (
        | 'andorra'
        | 'argentina'
        | 'australia'
        | 'austria'
        | 'bahamas'
        | 'belgica'
        | 'bolivia'
        | 'brasil'
        | 'canada'
        | 'chile'
        | 'china'
        | 'colombia'
        | 'costa_rica'
        | 'croacia'
        | 'cuba'
        | 'chipre'
        | 'republica_checa'
        | 'dinamarca'
        | 'dominica'
        | 'republica_dominicana'
        | 'ecuador'
        | 'egipto'
        | 'el_salvador'
        | 'espana'
        | 'estados_unidos'
        | 'estonia'
        | 'finlandia'
        | 'francia'
        | 'georgia'
        | 'alemania'
        | 'grecia'
        | 'granada'
        | 'guatemala'
        | 'honduras'
        | 'islandia'
        | 'irlanda'
        | 'italia'
        | 'jamaica'
        | 'japon'
        | 'corea_del_sur'
        | 'mexico'
        | 'monaco'
        | 'paises_bajos'
        | 'nueva_zelanda'
        | 'nicaragua'
        | 'noruega'
        | 'panama'
        | 'paraguay'
        | 'peru'
        | 'polonia'
        | 'portugal'
        | 'rusia'
        | 'san_marino'
        | 'serbia'
        | 'singapur'
        | 'eslovaquia'
        | 'eslovenia'
        | 'suecia'
        | 'suiza'
        | 'trinidad_y_tobago'
        | 'turquia'
        | 'ucrania'
        | 'reino_unido'
        | 'uruguay'
        | 'ciudad_del_vaticano'
        | 'venezuela'
      )
    | null;
  numero?: number | null;
  role: 'Admin' | 'User';
  fotoUsuario?: (number | null) | FotosUsuario;
  updatedAt: string;
  createdAt: string;
  email: string;
  resetPasswordToken?: string | null;
  resetPasswordExpiration?: string | null;
  salt?: string | null;
  hash?: string | null;
  loginAttempts?: number | null;
  lockUntil?: string | null;
  password?: string | null;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "fotosUsuarios".
 */
export interface FotosUsuario {
  id: number;
  SupaURL?: string | null;
  prefix?: string | null;
  updatedAt: string;
  createdAt: string;
  url?: string | null;
  thumbnailURL?: string | null;
  filename?: string | null;
  mimeType?: string | null;
  filesize?: number | null;
  width?: number | null;
  height?: number | null;
  focalX?: number | null;
  focalY?: number | null;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "fotosPreguntas".
 */
export interface FotosPregunta {
  id: number;
  SupaURL?: string | null;
  prefix?: string | null;
  updatedAt: string;
  createdAt: string;
  url?: string | null;
  thumbnailURL?: string | null;
  filename?: string | null;
  mimeType?: string | null;
  filesize?: number | null;
  width?: number | null;
  height?: number | null;
  focalX?: number | null;
  focalY?: number | null;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "ingredientesmuffins".
 */
export interface Ingredientesmuffin {
  id: number;
  nombre: string;
  precio: number;
  cantidadBase: number;
  unidad: 'gramos' | 'mililitros';
  usuario: number | Usuario;
  costoPorGramo?: number | null;
  updatedAt: string;
  createdAt: string;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "recetasmuffins".
 */
export interface Recetasmuffin {
  id: number;
  nombre: string;
  usuario: number | Usuario;
  ingredientesUsados?:
    | {
        ingrediente: number | Ingredientesmuffin;
        cantidadNecesaria: number;
        costoCalculado?: number | null;
        id?: string | null;
      }[]
    | null;
  updatedAt: string;
  createdAt: string;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "imagenes-reviews".
 */
export interface ImagenesReview {
  id: number;
  SupaURL?: string | null;
  prefix?: string | null;
  updatedAt: string;
  createdAt: string;
  url?: string | null;
  thumbnailURL?: string | null;
  filename?: string | null;
  mimeType?: string | null;
  filesize?: number | null;
  width?: number | null;
  height?: number | null;
  focalX?: number | null;
  focalY?: number | null;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "membresias".
 */
export interface Membresia {
  id: number;
  nombre: string;
  Precio: number;
  Cantidad: number;
  Descuento: number;
  duracion: number;
  updatedAt: string;
  createdAt: string;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "pedidos".
 */
export interface Pedido {
  id: number;
  /**
   * Un ID o código interno para identificar este pedido.
   */
  pedidoID: string;
  date: string;
  state: 'pendiente' | 'completado' | 'cancelado';
  client?: (number | null) | Usuario;
  nombre?: string | null;
  apellidos?: string | null;
  country?: string | null;
  phone?: string | null;
  /**
   * Ej: "Yape", "Plin", "Transferencia", "Tarjeta", etc.
   */
  payment?: string | null;
  capturaPago?: (number | null) | CapturaDePago;
  activeCoupon?: (number | null) | Cupone;
  cursos?:
    | {
        cursoRef: number | Curso;
        price?: number | null;
        pricewithDiscount?: number | null;
        customTotalPrice?: number | null;
        discountApplied?: number | null;
        discountCoupon?: number | null;
        /**
         * Precio final después de aplicar descuentos y/o edición manual
         */
        finalPrice?: number | null;
        id?: string | null;
      }[]
    | null;
  talleresPresenciales?:
    | {
        tallerRef: number | TalleresPresenciale;
        price?: number | null;
        customTotalPrice?: number | null;
        discountApplied?: number | null;
        /**
         * Precio final después de aplicar descuentos y/o edición manual
         */
        finalPrice?: number | null;
        schedule?: string | null;
        id?: string | null;
      }[]
    | null;
  membresias?:
    | {
        membresiaRef: number | Membresia;
        price?: number | null;
        customTotalPrice?: number | null;
        discountApplied?: number | null;
        /**
         * Precio final después de aplicar descuentos y/o edición manual
         */
        finalPrice?: number | null;
        id?: string | null;
      }[]
    | null;
  /**
   * Suma de todos los productos finales, con descuentos aplicados.
   */
  totalPrice?: number | null;
  updatedAt: string;
  createdAt: string;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "talleres-presenciales".
 */
export interface TalleresPresenciale {
  id: number;
  title: string;
  /**
   * El "slug" es el identificador de cada curso. Ej: https://kathymonzon.com/cursos/👉[pasteles-vintage]👈 (El slug se crea sólo en base al nombre del curso, no hay escribir nada en el campo. Pero si se comete un error, se puede modificar después de crear el curso)
   */
  slug?: string | null;
  estado?: ('publico' | 'oculto') | null;
  cantidaddePostresoRecetas?: string | null;
  /**
   * Añade una descripción general del curso. Este texto aparecerá encima de la lista de recetas en la página del curso.
   */
  descripcionCurso?: string | null;
  /**
   * Añade las recetas o técnicas asociadas con este curso. Ejemplo: "Cupcakes de fresa", "Uso correcto del batido".
   */
  contenido?:
    | {
        nombre: string;
        /**
         * Añade una breve descripción de la técnica o receta.
         */
        descripcion?: string | null;
        id?: string | null;
      }[]
    | null;
  /**
   * Lista los beneficios que ofrece este curso.
   */
  beneficios?:
    | {
        descripcionBeneficio: string;
        id?: string | null;
      }[]
    | null;
  promedioreviews?: number | null;
  precio: number;
  /**
   * Añade grupos de fechas. Cada grupo puede tener múltiples fechas.
   */
  gruposDeFechas?:
    | {
        nombreGrupo: string;
        /**
         * Número total de vacantes disponibles para este grupo.
         */
        vacantes: number;
        /**
         * Especifica el horario del grupo (Ejemplo: 3 PM - 7 PM).
         */
        horario: string;
        fechas?:
          | {
              fechaClase: string;
              id?: string | null;
            }[]
          | null;
        id?: string | null;
      }[]
    | null;
  nivel?: ('principiante' | 'intermedio' | 'avanzado') | null;
  diasExpiracion?: number | null;
  preguntasYRespuestas?: boolean | null;
  /**
   * La imagen de portada de los talleres presenciales es en formato rectangular (4:5). Son las imágenes que aparecen cuando ingresas a https://kathymonzon.com/talleres-presenciales
   */
  coverImage?: (number | null) | Imagene;
  /**
   * Las imágenes adicionales son las que aparecen dentro de cada curso y el tamaño sugerido es de (4:5). Lo ideal es colocar un número de imágenes impar, Ej. 3, 5, 7; para no dejar espacios en blanco en la página del curso
   */
  imagenesAdicionales?:
    | {
        imagen?: (number | null) | Imagene;
        id?: string | null;
      }[]
    | null;
  updatedAt: string;
  createdAt: string;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "preguntasRespuestas".
 */
export interface PreguntasRespuesta {
  id: number;
  usuario: number | Usuario;
  nombreDelUsuario?: string | null;
  curso: number | Curso;
  mensajes?:
    | {
        tipo: 'texto' | 'imagen';
        contenido?: string | null;
        imagen?: (number | null) | FotosPregunta;
        enviadoPor: 'usuario' | 'profesora';
        id?: string | null;
      }[]
    | null;
  estado?: ('En proceso' | 'Resuelta') | null;
  fechaPregunta?: string | null;
  updatedAt: string;
  createdAt: string;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "registro-de-membresias".
 */
export interface RegistroDeMembresia {
  id: number;
  usuario: number | Usuario;
  tipoDeMembresia: number | Membresia;
  estado: 'activo' | 'inactivo';
  fechaDeExpiracion: string;
  updatedAt: string;
  createdAt: string;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "reviews-cursos-virtuales".
 */
export interface ReviewsCursosVirtuale {
  id: number;
  usuario: number | Usuario;
  curso: number | Curso;
  nombreUsuario: string;
  paisUsuario?: string | null;
  estrellas: number;
  reseña: string;
  fecha: string;
  estado: 'aceptada' | 'denegada';
  imagenesReviews?:
    | {
        imagenReview?: (number | null) | ImagenesReview;
        id?: string | null;
      }[]
    | null;
  updatedAt: string;
  createdAt: string;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "reviews-talleres-presenciales".
 */
export interface ReviewsTalleresPresenciale {
  id: number;
  usuario: number | Usuario;
  taller: number | TalleresPresenciale;
  nombreUsuario: string;
  paisUsuario?: string | null;
  estrellas: number;
  reseña: string;
  fecha: string;
  estado: 'aceptada' | 'denegada';
  updatedAt: string;
  createdAt: string;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "payload-locked-documents".
 */
export interface PayloadLockedDocument {
  id: number;
  document?:
    | ({
        relationTo: 'captura-de-pagos';
        value: number | CapturaDePago;
      } | null)
    | ({
        relationTo: 'categorias';
        value: number | Categoria;
      } | null)
    | ({
        relationTo: 'cursos';
        value: number | Curso;
      } | null)
    | ({
        relationTo: 'cupones';
        value: number | Cupone;
      } | null)
    | ({
        relationTo: 'enrollment';
        value: number | Enrollment;
      } | null)
    | ({
        relationTo: 'fotosPreguntas';
        value: number | FotosPregunta;
      } | null)
    | ({
        relationTo: 'fotosUsuarios';
        value: number | FotosUsuario;
      } | null)
    | ({
        relationTo: 'ingredientesmuffins';
        value: number | Ingredientesmuffin;
      } | null)
    | ({
        relationTo: 'imagenes';
        value: number | Imagene;
      } | null)
    | ({
        relationTo: 'recetasmuffins';
        value: number | Recetasmuffin;
      } | null)
    | ({
        relationTo: 'imagenes-reviews';
        value: number | ImagenesReview;
      } | null)
    | ({
        relationTo: 'membresias';
        value: number | Membresia;
      } | null)
    | ({
        relationTo: 'pedidos';
        value: number | Pedido;
      } | null)
    | ({
        relationTo: 'preguntasRespuestas';
        value: number | PreguntasRespuesta;
      } | null)
    | ({
        relationTo: 'registro-de-membresias';
        value: number | RegistroDeMembresia;
      } | null)
    | ({
        relationTo: 'reviews-cursos-virtuales';
        value: number | ReviewsCursosVirtuale;
      } | null)
    | ({
        relationTo: 'reviews-talleres-presenciales';
        value: number | ReviewsTalleresPresenciale;
      } | null)
    | ({
        relationTo: 'talleres-presenciales';
        value: number | TalleresPresenciale;
      } | null)
    | ({
        relationTo: 'usuarios';
        value: number | Usuario;
      } | null);
  globalSlug?: string | null;
  user: {
    relationTo: 'usuarios';
    value: number | Usuario;
  };
  updatedAt: string;
  createdAt: string;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "payload-preferences".
 */
export interface PayloadPreference {
  id: number;
  user: {
    relationTo: 'usuarios';
    value: number | Usuario;
  };
  key?: string | null;
  value?:
    | {
        [k: string]: unknown;
      }
    | unknown[]
    | string
    | number
    | boolean
    | null;
  updatedAt: string;
  createdAt: string;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "payload-migrations".
 */
export interface PayloadMigration {
  id: number;
  name?: string | null;
  batch?: number | null;
  updatedAt: string;
  createdAt: string;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "captura-de-pagos_select".
 */
export interface CapturaDePagosSelect<T extends boolean = true> {
  SupaURL?: T;
  prefix?: T;
  updatedAt?: T;
  createdAt?: T;
  url?: T;
  thumbnailURL?: T;
  filename?: T;
  mimeType?: T;
  filesize?: T;
  width?: T;
  height?: T;
  focalX?: T;
  focalY?: T;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "categorias_select".
 */
export interface CategoriasSelect<T extends boolean = true> {
  name?: T;
  slug?: T;
  isActive?: T;
  updatedAt?: T;
  createdAt?: T;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "cursos_select".
 */
export interface CursosSelect<T extends boolean = true> {
  title?: T;
  slug?: T;
  estado?: T;
  categorias?: T;
  cantidadDePostres?: T;
  descripcionCurso?: T;
  recetas?:
    | T
    | {
        nombreReceta?: T;
        id?: T;
      };
  beneficios?:
    | T
    | {
        descripcionBeneficio?: T;
        id?: T;
      };
  promedioreviews?: T;
  precio?: T;
  precioConDescuento?: T;
  fechaMaximaDescuento?: T;
  nivel?: T;
  diasExpiracion?: T;
  preguntasYRespuestas?: T;
  coverImage?: T;
  imagenesAdicionales?:
    | T
    | {
        imagen?: T;
        id?: T;
      };
  fechaHabilitacionCurso?: T;
  Modulos?:
    | T
    | {
        nombreLeccion?: T;
        leccion?:
          | T
          | {
              namelesson?: T;
              slug?: T;
              contenidoUrl?: T;
              contenidoArchivo?: T;
              duration?: T;
              miniaturaUrl?: T;
              descripcionMiniatura?: T;
              id?: T;
            };
        id?: T;
      };
  updatedAt?: T;
  createdAt?: T;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "cupones_select".
 */
export interface CuponesSelect<T extends boolean = true> {
  code?: T;
  type?: T;
  amount?: T;
  expirationDate?: T;
  restrictions?: T;
  applyMode?: T;
  products?: T;
  excludeProducts?: T;
  categories?: T;
  excludeCategories?: T;
  updatedAt?: T;
  createdAt?: T;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "enrollment_select".
 */
export interface EnrollmentSelect<T extends boolean = true> {
  usuario?: T;
  cursos?: T;
  status?: T;
  fechaDeExpiracion?: T;
  completedLessons?:
    | T
    | {
        lessonSlug?: T;
        completedAt?: T;
        toggleLesson?: T;
        id?: T;
      };
  updatedAt?: T;
  createdAt?: T;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "fotosPreguntas_select".
 */
export interface FotosPreguntasSelect<T extends boolean = true> {
  SupaURL?: T;
  prefix?: T;
  updatedAt?: T;
  createdAt?: T;
  url?: T;
  thumbnailURL?: T;
  filename?: T;
  mimeType?: T;
  filesize?: T;
  width?: T;
  height?: T;
  focalX?: T;
  focalY?: T;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "fotosUsuarios_select".
 */
export interface FotosUsuariosSelect<T extends boolean = true> {
  SupaURL?: T;
  prefix?: T;
  updatedAt?: T;
  createdAt?: T;
  url?: T;
  thumbnailURL?: T;
  filename?: T;
  mimeType?: T;
  filesize?: T;
  width?: T;
  height?: T;
  focalX?: T;
  focalY?: T;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "ingredientesmuffins_select".
 */
export interface IngredientesmuffinsSelect<T extends boolean = true> {
  nombre?: T;
  precio?: T;
  cantidadBase?: T;
  unidad?: T;
  usuario?: T;
  costoPorGramo?: T;
  updatedAt?: T;
  createdAt?: T;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "imagenes_select".
 */
export interface ImagenesSelect<T extends boolean = true> {
  Alt?: T;
  SupaURL?: T;
  prefix?: T;
  updatedAt?: T;
  createdAt?: T;
  url?: T;
  thumbnailURL?: T;
  filename?: T;
  mimeType?: T;
  filesize?: T;
  width?: T;
  height?: T;
  focalX?: T;
  focalY?: T;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "recetasmuffins_select".
 */
export interface RecetasmuffinsSelect<T extends boolean = true> {
  nombre?: T;
  usuario?: T;
  ingredientesUsados?:
    | T
    | {
        ingrediente?: T;
        cantidadNecesaria?: T;
        costoCalculado?: T;
        id?: T;
      };
  updatedAt?: T;
  createdAt?: T;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "imagenes-reviews_select".
 */
export interface ImagenesReviewsSelect<T extends boolean = true> {
  SupaURL?: T;
  prefix?: T;
  updatedAt?: T;
  createdAt?: T;
  url?: T;
  thumbnailURL?: T;
  filename?: T;
  mimeType?: T;
  filesize?: T;
  width?: T;
  height?: T;
  focalX?: T;
  focalY?: T;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "membresias_select".
 */
export interface MembresiasSelect<T extends boolean = true> {
  nombre?: T;
  Precio?: T;
  Cantidad?: T;
  Descuento?: T;
  duracion?: T;
  updatedAt?: T;
  createdAt?: T;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "pedidos_select".
 */
export interface PedidosSelect<T extends boolean = true> {
  pedidoID?: T;
  date?: T;
  state?: T;
  client?: T;
  nombre?: T;
  apellidos?: T;
  country?: T;
  phone?: T;
  payment?: T;
  capturaPago?: T;
  activeCoupon?: T;
  cursos?:
    | T
    | {
        cursoRef?: T;
        price?: T;
        pricewithDiscount?: T;
        customTotalPrice?: T;
        discountApplied?: T;
        discountCoupon?: T;
        finalPrice?: T;
        id?: T;
      };
  talleresPresenciales?:
    | T
    | {
        tallerRef?: T;
        price?: T;
        customTotalPrice?: T;
        discountApplied?: T;
        finalPrice?: T;
        schedule?: T;
        id?: T;
      };
  membresias?:
    | T
    | {
        membresiaRef?: T;
        price?: T;
        customTotalPrice?: T;
        discountApplied?: T;
        finalPrice?: T;
        id?: T;
      };
  totalPrice?: T;
  updatedAt?: T;
  createdAt?: T;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "preguntasRespuestas_select".
 */
export interface PreguntasRespuestasSelect<T extends boolean = true> {
  usuario?: T;
  nombreDelUsuario?: T;
  curso?: T;
  mensajes?:
    | T
    | {
        tipo?: T;
        contenido?: T;
        imagen?: T;
        enviadoPor?: T;
        id?: T;
      };
  estado?: T;
  fechaPregunta?: T;
  updatedAt?: T;
  createdAt?: T;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "registro-de-membresias_select".
 */
export interface RegistroDeMembresiasSelect<T extends boolean = true> {
  usuario?: T;
  tipoDeMembresia?: T;
  estado?: T;
  fechaDeExpiracion?: T;
  updatedAt?: T;
  createdAt?: T;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "reviews-cursos-virtuales_select".
 */
export interface ReviewsCursosVirtualesSelect<T extends boolean = true> {
  usuario?: T;
  curso?: T;
  nombreUsuario?: T;
  paisUsuario?: T;
  estrellas?: T;
  reseña?: T;
  fecha?: T;
  estado?: T;
  imagenesReviews?:
    | T
    | {
        imagenReview?: T;
        id?: T;
      };
  updatedAt?: T;
  createdAt?: T;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "reviews-talleres-presenciales_select".
 */
export interface ReviewsTalleresPresencialesSelect<T extends boolean = true> {
  usuario?: T;
  taller?: T;
  nombreUsuario?: T;
  paisUsuario?: T;
  estrellas?: T;
  reseña?: T;
  fecha?: T;
  estado?: T;
  updatedAt?: T;
  createdAt?: T;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "talleres-presenciales_select".
 */
export interface TalleresPresencialesSelect<T extends boolean = true> {
  title?: T;
  slug?: T;
  estado?: T;
  cantidaddePostresoRecetas?: T;
  descripcionCurso?: T;
  contenido?:
    | T
    | {
        nombre?: T;
        descripcion?: T;
        id?: T;
      };
  beneficios?:
    | T
    | {
        descripcionBeneficio?: T;
        id?: T;
      };
  promedioreviews?: T;
  precio?: T;
  gruposDeFechas?:
    | T
    | {
        nombreGrupo?: T;
        vacantes?: T;
        horario?: T;
        fechas?:
          | T
          | {
              fechaClase?: T;
              id?: T;
            };
        id?: T;
      };
  nivel?: T;
  diasExpiracion?: T;
  preguntasYRespuestas?: T;
  coverImage?: T;
  imagenesAdicionales?:
    | T
    | {
        imagen?: T;
        id?: T;
      };
  updatedAt?: T;
  createdAt?: T;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "usuarios_select".
 */
export interface UsuariosSelect<T extends boolean = true> {
  nombre?: T;
  apellidos?: T;
  pais?: T;
  numero?: T;
  role?: T;
  fotoUsuario?: T;
  updatedAt?: T;
  createdAt?: T;
  email?: T;
  resetPasswordToken?: T;
  resetPasswordExpiration?: T;
  salt?: T;
  hash?: T;
  loginAttempts?: T;
  lockUntil?: T;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "payload-locked-documents_select".
 */
export interface PayloadLockedDocumentsSelect<T extends boolean = true> {
  document?: T;
  globalSlug?: T;
  user?: T;
  updatedAt?: T;
  createdAt?: T;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "payload-preferences_select".
 */
export interface PayloadPreferencesSelect<T extends boolean = true> {
  user?: T;
  key?: T;
  value?: T;
  updatedAt?: T;
  createdAt?: T;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "payload-migrations_select".
 */
export interface PayloadMigrationsSelect<T extends boolean = true> {
  name?: T;
  batch?: T;
  updatedAt?: T;
  createdAt?: T;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "auth".
 */
export interface Auth {
  [k: string]: unknown;
}


declare module 'payload' {
  export interface GeneratedTypes extends Config {}
}