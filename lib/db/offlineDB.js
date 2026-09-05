import { openDB } from 'idb'

const DB_NAME = 'punto_de_venta_offline'
const DB_VERSION = 3

let dbPromise = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (!db.objectStoreNames.contains('productos')) {
          db.createObjectStore('productos', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('clientes')) {
          db.createObjectStore('clientes', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('empresa')) {
          db.createObjectStore('empresa', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('sync_queue')) {
          const store = db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true })
          store.createIndex('pendiente', 'pendiente')
        }
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' })
        }
        if (!db.objectStoreNames.contains('categorias')) {
          db.createObjectStore('categorias', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('unidades_medida')) {
          db.createObjectStore('unidades_medida', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('configuracion')) {
          db.createObjectStore('configuracion', { keyPath: 'clave' })
        }
        if (!db.objectStoreNames.contains('cajas')) {
          db.createObjectStore('cajas', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('tablas')) {
          db.createObjectStore('tablas', { keyPath: 'nombre' })
        }
      },
    })
  }
  return dbPromise
}

function guardarMuchos(nombreStore, items) {
  return getDB().then(async (db) => {
    const tx = db.transaction(nombreStore, 'readwrite')
    await tx.store.clear()
    if (items && items.length > 0) {
      for (const item of items) {
        await tx.store.put(item)
      }
    }
    await tx.done
  })
}

function obtenerTodos(nombreStore) {
  return getDB().then((db) => db.getAll(nombreStore))
}

export async function guardarProductos(items) { return guardarMuchos('productos', items) }
export async function obtenerProductos() { return obtenerTodos('productos') }
export async function guardarClientes(items) { return guardarMuchos('clientes', items) }
export async function obtenerClientes() { return obtenerTodos('clientes') }
export async function guardarCategorias(items) { return guardarMuchos('categorias', items) }
export async function obtenerCategorias() { return obtenerTodos('categorias') }
export async function guardarUnidadesMedida(items) { return guardarMuchos('unidades_medida', items) }
export async function obtenerUnidadesMedida() { return obtenerTodos('unidades_medida') }
export async function guardarCajas(items) { return guardarMuchos('cajas', items) }
export async function obtenerCajas() { return obtenerTodos('cajas') }

export async function guardarTabla(nombre, filas) {
  if (!Array.isArray(filas)) filas = []
  const db = await getDB()
  await db.put('tablas', { nombre, filas })
}

export async function obtenerTabla(nombre) {
  const db = await getDB()
  const r = await db.get('tablas', nombre)
  return r ? r.filas || [] : []
}

export async function guardarTablas(tablas) {
  if (!tablas || typeof tablas !== 'object') return
  const db = await getDB()
  const nombres = Object.keys(tablas)
  const tx = db.transaction('tablas', 'readwrite')
  await tx.store.clear()
  for (const nombre of nombres) {
    await tx.store.put({ nombre, filas: tablas[nombre] || [] })
  }
  await tx.done
}

export async function obtenerTodasLasTablas() {
  const db = await getDB()
  const registros = await db.getAll('tablas')
  const out = {}
  for (const r of registros) {
    out[r.nombre] = r.filas || []
  }
  return out
}

export async function guardarEmpresa(datos) {
  const db = await getDB()
  await db.put('empresa', { id: 'default', ...datos })
}

export async function obtenerEmpresa() {
  const db = await getDB()
  return db.get('empresa', 'default')
}

export async function guardarConfig(clave, valor) {
  const db = await getDB()
  await db.put('configuracion', { clave, valor })
}

export async function obtenerConfig(clave) {
  const db = await getDB()
  const r = await db.get('configuracion', clave)
  return r ? r.valor : null
}

export async function guardarMetadata(key, value) {
  const db = await getDB()
  await db.put('metadata', { key, value })
}

export async function obtenerMetadata(key) {
  const db = await getDB()
  const entry = await db.get('metadata', key)
  return entry ? entry.value : null
}

export async function agregarSyncQueue(operacion) {
  const db = await getDB()
  const id = await db.add('sync_queue', { ...operacion, pendiente: true, creado: new Date().toISOString() })
  return id
}

export async function obtenerSyncQueue() {
  const db = await getDB()
  return db.getAllFromIndex('sync_queue', 'pendiente', true)
}

export async function marcarSyncCompletado(id) {
  const db = await getDB()
  const item = await db.get('sync_queue', id)
  if (item) {
    item.pendiente = false
    await db.put('sync_queue', item)
  }
}

export async function limpiarSyncCompletados() {
  const db = await getDB()
  const todos = await db.getAll('sync_queue')
  const tx = db.transaction('sync_queue', 'readwrite')
  for (const item of todos) {
    if (!item.pendiente) {
      await tx.store.delete(item.id)
    }
  }
  await tx.done
}

export async function limpiarDatosOffline() {
  const db = await getDB()
  const stores = db.objectStoreNames
  const tx = db.transaction(stores, 'readwrite')
  for (const storeName of stores) {
    await tx.objectStore(storeName).clear()
  }
  await tx.done
}

export async function contarProductos() {
  const db = await getDB()
  return db.count('productos')
}

export async function contarClientes() {
  const db = await getDB()
  return db.count('clientes')
}