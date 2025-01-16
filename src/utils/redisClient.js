import { Redis } from '@upstash/redis'

// Lee tus variables de entorno (Railway, dotenv, etc.)
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
})

/**
 * Obtener un valor del Redis usando el SDK nativo
 */
export async function getFromRedis(key) {
  if (!key) return null

  try {
    console.log(`🔍 Intentando obtener "${key}" desde Redis (SDK nativo)`)
    console.time('Upstash Redis GET')

    // Llamada directa al SDK
    const data = await redis.get(key)

    console.timeEnd('Upstash Redis GET')

    // data puede ser null si la key no existe
    if (!data) {
      return null
    }

    // Importante: Si guardaste un JSON.stringify(...) al settear,
    // debes parsearlo al retornar. Ej:
    try {
      return JSON.parse(data)
    } catch (err) {
      // Si no es un JSON, retornamos tal cual
      return data
    }
  } catch (error) {
    console.error('❌ Error al obtener datos de Redis (SDK):', error)
    return null
  }
}

/**
 * Guardar un valor en Redis usando el SDK nativo
 */
export async function setToRedis(key, value, { expireSeconds } = {}) {
  console.time('Upstash Redis SET')
  try {
    // value debe ser string. Si mandas un objeto, haz JSON.stringify
    const valToStore = typeof value === 'string' ? value : JSON.stringify(value)

    // upstash sdk => redis.set(key, value, { ex: 3600 }) para 1 hora, etc.
    if (expireSeconds) {
      await redis.set(key, valToStore, { ex: expireSeconds })
    } else {
      await redis.set(key, valToStore)
    }
  } catch (error) {
    console.error('❌ Error al guardar datos en Redis (SDK):', error)
  }
  console.timeEnd('Upstash Redis SET')
}

// Exportamos también la instancia por si quieres un acceso directo
export default redis
