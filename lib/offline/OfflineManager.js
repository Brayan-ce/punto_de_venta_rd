import {
  guardarProductos,
  obtenerProductos,
  guardarClientes,
  obtenerClientes,
  guardarEmpresa,
  obtenerEmpresa,
  guardarCategorias,
  obtenerCategorias,
  guardarUnidadesMedida,
  obtenerUnidadesMedida,
  guardarMetadata,
  obtenerMetadata,
  guardarTablas,
  obtenerTodasLasTablas,
  obtenerTabla,
  guardarTabla,
  agregarSyncQueue,
  obtenerSyncQueue,
  marcarSyncCompletado,
  limpiarDatosOffline,
  contarProductos,
  contarClientes,
} from '@/lib/db/offlineDB'

class OfflineManager {
  constructor() {
    this._listeners = new Set()
    this._online = navigator.onLine
    this._initListeners()
  }

  _initListeners() {
    window.addEventListener('online', () => {
      this._online = true
      this._notify()
    })
    window.addEventListener('offline', () => {
      this._online = false
      this._notify()
    })
  }

  isOnline() {
    return this._online
  }

  isOffline() {
    return !this._online
  }

  subscribe(fn) {
    this._listeners.add(fn)
    return () => this._listeners.delete(fn)
  }

  _notify() {
    for (const fn of this._listeners) {
      fn(this._online)
    }
  }

  async prepararOffline(datos) {
    if (datos.productos?.length) await guardarProductos(datos.productos)
    if (datos.clientes?.length) await guardarClientes(datos.clientes)
    if (datos.empresa) await guardarEmpresa(datos.empresa)
    if (datos.categorias?.length) await guardarCategorias(datos.categorias)
    if (datos.unidades_medida?.length) await guardarUnidadesMedida(datos.unidades_medida)
    if (datos.tablas && typeof datos.tablas === 'object') {
      await guardarTablas(datos.tablas)
    }
    if (datos.usuario) {
      await guardarMetadata('usuario_offline', JSON.stringify(datos.usuario))
    }
    if (datos.empresa_id) {
      await guardarMetadata('empresa_id', String(datos.empresa_id))
    }
    await guardarMetadata('offline_preparado', 'true')
    await guardarMetadata('ultima_descarga', new Date().toISOString())
  }

  async estaPreparado() {
    const val = await obtenerMetadata('offline_preparado')
    return val === 'true'
  }

  async ultimaDescarga() {
    return obtenerMetadata('ultima_descarga')
  }

  async getMetadata(key) {
    return obtenerMetadata(key)
  }

  async guardarMetadata(key, value) {
    return guardarMetadata(key, value)
  }

  async getProductos() {
    return obtenerProductos()
  }

  async getClientes() {
    return obtenerClientes()
  }

  async getEmpresa() {
    return obtenerEmpresa()
  }

  async getCategorias() {
    return obtenerCategorias()
  }

  async getUnidadesMedida() {
    return obtenerUnidadesMedida()
  }

  async getUsuario() {
    const val = await obtenerMetadata('usuario_offline')
    try {
      return val ? JSON.parse(val) : null
    } catch (e) {
      return null
    }
  }

  async getTabla(nombre) {
    return obtenerTabla(nombre)
  }

  async guardarTabla(nombre, filas) {
    return guardarTabla(nombre, filas)
  }

  async getTodasLasTablas() {
    return obtenerTodasLasTablas()
  }

  async getResumen() {
    const [productos, clientes, empresa, categorias, unidades, tablas, ultima] = await Promise.all([
      contarProductos(),
      contarClientes(),
      this.getEmpresa(),
      this.getCategorias().then((r) => r.length),
      this.getUnidadesMedida().then((r) => r.length),
      this.getTodasLasTablas().then((t) => Object.keys(t).length),
      this.ultimaDescarga(),
    ])
    return { productos, clientes, empresaNombre: empresa?.nombre_empresa || '', categorias, unidades, tablas, ultimaDescarga: ultima }
  }

  async exportarDatos() {
    const [productos, clientes, empresa, categorias, unidades_medida, tablas, usuario, empresaId] = await Promise.all([
      this.getProductos(),
      this.getClientes(),
      this.getEmpresa(),
      this.getCategorias(),
      this.getUnidadesMedida(),
      this.getTodasLasTablas(),
      this.getUsuario(),
      obtenerMetadata('empresa_id'),
    ])
    return {
      version: 3,
      exportado: new Date().toISOString(),
      empresa_id: empresaId ? Number(empresaId) : null,
      usuario,
      productos,
      clientes,
      empresa,
      categorias,
      unidades_medida,
      tablas,
    }
  }

  importarDatos(datos) {
    return this.prepararOffline({
      productos: datos.productos || [],
      clientes: datos.clientes || [],
      empresa: datos.empresa || null,
      categorias: datos.categorias || [],
      unidades_medida: datos.unidades_medida || [],
      tablas: datos.tablas || null,
      usuario: datos.usuario || null,
      empresa_id: datos.empresa_id || null,
    })
  }

  async agregarSync(operacion) {
    return agregarSyncQueue(operacion)
  }

  async obtenerSyncPendiente() {
    return obtenerSyncQueue()
  }

  async marcarSyncCompletado(id) {
    return marcarSyncCompletado(id)
  }

  async limpiar() {
    return limpiarDatosOffline()
  }
}

let _instance = null

export function getOfflineManager() {
  if (typeof window === 'undefined') return null
  if (!_instance) {
    _instance = new OfflineManager()
  }
  return _instance
}