const BASE_URL = 'http://localhost:8080';

// --- Offline Helpers & Caching ---
const OFFLINE_CACHE_PREFIX = 'meditrack_cache_';
const SYNC_QUEUE_KEY = 'meditrack_sync_queue';

function setLocalCache(key, data) {
  try {
    localStorage.setItem(OFFLINE_CACHE_PREFIX + key, JSON.stringify(data));
  } catch (e) {
    console.error('Error writing to offline cache:', e);
  }
}

function getLocalCache(key) {
  try {
    const data = localStorage.getItem(OFFLINE_CACHE_PREFIX + key);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error('Error reading from offline cache:', e);
    return null;
  }
}

export function isOnline() {
  return navigator.onLine;
}

export function getPendingSyncCount() {
  try {
    const queue = JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]');
    return queue.length;
  } catch {
    return 0;
  }
}

function addToSyncQueue(type, url, method, body) {
  try {
    const queue = JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]');
    queue.push({
      id: Date.now() + Math.random().toString(36).substr(2, 9),
      type,
      url,
      method,
      body,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    window.dispatchEvent(new CustomEvent('meditrack-sync-changed', { detail: { count: queue.length } }));
  } catch (e) {
    console.error('Error adding to sync queue:', e);
  }
}

export async function syncOfflineQueue() {
  if (!isOnline()) return { success: false, reason: 'offline' };
  
  try {
    const queue = JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]');
    if (queue.length === 0) return { success: true, count: 0 };
    
    console.log(`[Offline Sync] Sincronizando ${queue.length} elementos pendientes...`);
    
    for (const item of queue) {
      const headers = {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      };
      
      const res = await fetch(item.url, {
        method: item.method,
        headers,
        body: JSON.stringify(item.body)
      });
      
      if (!res.ok) {
        console.error(`[Offline Sync] Error al sincronizar el item ${item.id}:`, res.status);
        if (res.status >= 500 || res.status === 0) {
          throw new Error('Error del servidor o de red al sincronizar');
        }
      }
    }
    
    localStorage.setItem(SYNC_QUEUE_KEY, '[]');
    window.dispatchEvent(new CustomEvent('meditrack-sync-changed', { detail: { count: 0 } }));
    return { success: true, count: queue.length };
  } catch (err) {
    console.error('[Offline Sync] Error de sincronización:', err);
    return { success: false, reason: err.message };
  }
}

function updateLocalCacheEnvio(envioId, nuevoEstado, receptorNombre = null, receptorDni = null) {
  const cachedRutas = getLocalCache('rutas');
  if (cachedRutas) {
    const updatedRutas = cachedRutas.map(ruta => {
      if (ruta.envios) {
        return {
          ...ruta,
          envios: ruta.envios.map(re => {
            if (re.envio && re.envio.id === envioId) {
              return {
                ...re,
                envio: {
                  ...re.envio,
                  estado: nuevoEstado,
                  receptorNombre: receptorNombre || re.envio.receptorNombre,
                  receptorDni: receptorDni || re.envio.receptorDni
                }
              };
            }
            return re;
          })
        };
      }
      return ruta;
    });
    setLocalCache('rutas', updatedRutas);
  }

  const cachedEnvio = getLocalCache(`envio_${envioId}`);
  if (cachedEnvio) {
    const updatedEnvio = {
      ...cachedEnvio,
      estado: nuevoEstado,
      receptorNombre: receptorNombre || cachedEnvio.receptorNombre,
      receptorDni: receptorDni || cachedEnvio.receptorDni
    };
    setLocalCache(`envio_${envioId}`, updatedEnvio);
  }
}

function updateLocalCacheFinalizarRuta(rutaId) {
  const cachedRutas = getLocalCache('rutas');
  if (cachedRutas) {
    const updatedRutas = cachedRutas.map(ruta => {
      if (ruta.id === rutaId) {
        return {
          ...ruta,
          estado: 'COMPLETADA'
        };
      }
      return ruta;
    });
    setLocalCache('rutas', updatedRutas);
  }
}

function getAuthHeaders() {
  try {
    const user = JSON.parse(localStorage.getItem('meditrack_user'));
    if (user?.token) return { 'Authorization': `Bearer ${user.token}` };
  } catch {
    return {};
  }
  return {};
}

async function handleResponse(res) {
  if (res.status === 401) {
    localStorage.removeItem('meditrack_user');
    window.location.href = '/login';
    throw new Error('Sesión expirada. Por favor, volvé a iniciar sesión.');
  }
  if (res.status === 403) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Sin permisos para esta acción');
  }
  return res;
}

export async function login(email, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Error al iniciar sesión');
  }
  return res.json();
}

export async function logout() {
  await fetch(`${BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: { ...getAuthHeaders() },
  }).catch(() => { });
}

export const verify2fa = async (email, codigo) => {
  const response = await fetch(`${BASE_URL}/auth/verify-2fa`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, codigo }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Error al verificar el código 2FA');
  }

  return response.json();
};

export async function forgotPassword(email) {
  const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al solicitar código');
  return data;
}

export async function verifyCode(email, codigo) {
  const res = await fetch(`${BASE_URL}/auth/verify-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, codigo })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al verificar código');
  return data;
}

export async function resetPassword(email, codigo, nuevaPassword) {
  const res = await fetch(`${BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, codigo, nuevaPassword })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al cambiar contraseña');
  return data;
}

export async function descargarEtiqueta(id) {
  const res = await fetch(`${BASE_URL}/api/envios/${id}/etiqueta`, {
    headers: { ...getAuthHeaders() },
  });
  await handleResponse(res);
  if (!res.ok) throw new Error('Error al generar la etiqueta');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `etiqueta-${id}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function getEnvios() {
  const res = await fetch(`${BASE_URL}/api/envios?_t=${Date.now()}`, {
    headers: { ...getAuthHeaders() },
    cache: 'no-store'
  });
  await handleResponse(res);
  if (!res.ok) throw new Error('Error al obtener envíos');
  return res.json();
}

export async function getEnvioById(id) {
  const cacheKey = `envio_${id}`;
  if (!isOnline()) {
    const cached = getLocalCache(cacheKey);
    if (cached) return cached;
    throw new Error('Sin conexión y envío no disponible en la caché local.');
  }
  try {
    const res = await fetch(`${BASE_URL}/api/envios/${id}?_t=${Date.now()}`, {
      headers: { ...getAuthHeaders() },
      cache: 'no-store'
    });
    await handleResponse(res);
    if (!res.ok) throw new Error('Envío no encontrado');
    const data = await res.json();
    setLocalCache(cacheKey, data);
    return data;
  } catch (error) {
    const cached = getLocalCache(cacheKey);
    if (cached) {
      console.warn('Fallo de red, sirviendo envío desde caché local:', error);
      return cached;
    }
    throw error;
  }
}

export async function createEnvio(data) {
  console.log("a")
  const res = await fetch(`${BASE_URL}/api/envios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(data),
  });
  await handleResponse(res);
  if (!res.ok) throw new Error('Error al crear envío');
  return res.json();
}

export async function updateEnvio(id, data) {
  const dataLimpia = {
    remitente: data.remitente,
    destinatario: data.destinatario,
    descripcionCarga: data.descripcionCarga,
    direccionEntrega: data.direccionEntrega,
    origen: data.origen,
    destino: data.destino,
    fechaEstimada: data.fechaEstimada,
    prioridad: data.prioridad,
    observaciones: data.observaciones,
    latitudOrigen: data.latitudOrigen,
    longitudOrigen: data.longitudOrigen,
    latitudDestino: data.latitudDestino,
    longitudDestino: data.longitudDestino,
    detalles: data.detalles.map(d => ({
      id: d.id,
      medicamento: d.medicamento,
      cantidad: d.cantidad,
      lote: d.lote,
      fechaVencimiento: d.fechaVencimiento
    }))

  };

  const res = await fetch(`${BASE_URL}/api/envios/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(dataLimpia),
  });

  await handleResponse(res);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.log(err);
    throw new Error(err.error || err.message || 'Error al actualizar envío');
  }
  return res.json();
}

export async function updateEstadoEnvio(id, estado, fecha, hora, usuario, repartidorId = null, tipoIncidencia = null, descripcionIncidencia = null, receptorNombre = null, receptorDni = null) {
  const bodyData = { estado, fecha, hora, usuario };
  if (repartidorId) {
    bodyData.repartidorId = repartidorId;
  }
  if (estado === 'INCIDENTE_REPORTADO') {
    bodyData.tipoIncidencia = tipoIncidencia;
    bodyData.descripcionIncidencia = descripcionIncidencia;
  }
  if (receptorNombre) {
    bodyData.receptorNombre = receptorNombre;
  }
  if (receptorDni) {
    bodyData.receptorDni = receptorDni;
  }
  
  const url = `${BASE_URL}/api/envios/${id}/estado`;

  if (!isOnline()) {
    console.log('[Offline Queue] Encolando cambio de estado para envío:', id);
    addToSyncQueue('updateEstadoEnvio', url, 'PUT', bodyData);
    updateLocalCacheEnvio(id, estado, receptorNombre, receptorDni);
    return { success: true, offline: true, id, estado };
  }

  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(bodyData),
    });
    await handleResponse(res);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al actualizar estado');
    }
    const data = await res.json();
    updateLocalCacheEnvio(id, estado, receptorNombre, receptorDni);
    return data;
  } catch (error) {
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || !isOnline()) {
      console.warn('[Offline Queue] Error de red. Encolando cambio de estado:', error);
      addToSyncQueue('updateEstadoEnvio', url, 'PUT', bodyData);
      updateLocalCacheEnvio(id, estado, receptorNombre, receptorDni);
      return { success: true, offline: true, id, estado };
    }
    throw error;
  }
}

export async function reasignarRepartidorEnvio(id, repartidorId) {
  const res = await fetch(`${BASE_URL}/api/envios/${id}/reasignar`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ repartidorId }),
  });
  await handleResponse(res);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al reasignar repartidor');
  }
  return res.json();
}

export async function cancelarEnvio(id, motivo, firma) {
  const res = await fetch(`${BASE_URL}/api/envios/${id}/cancelar`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ motivo, firma }),
  });
  await handleResponse(res);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Error al cancelar envío');
  }
  return res.json();
}

export async function getUsuarios() {
  const res = await fetch(`${BASE_URL}/api/usuarios?_t=${Date.now()}`, {
    headers: { ...getAuthHeaders() },
    cache: 'no-store'
  });
  await handleResponse(res);
  if (!res.ok) throw new Error('Error al obtener usuarios');
  return res.json();
}

export async function getUsuarioById(id) {
  const res = await fetch(`${BASE_URL}/api/usuarios/${id}?_t=${Date.now()}`, {
    headers: { ...getAuthHeaders() },
    cache: 'no-store'
  });
  await handleResponse(res);
  if (!res.ok) throw new Error('Usuario no encontrado');
  return res.json();
}

export async function createUsuario(data) {
  const res = await fetch(`${BASE_URL}/api/usuarios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(data),
  });
  await handleResponse(res);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al crear usuario');
  }
  return res.json();
}

export async function updateUsuario(id, data) {
  const dataLimpia = {
    nombre: data.nombre,
    dni: data.dni,
    email: data.email,
    role: data.role
  };

  if (data.password && data.password.trim() !== '') {
    dataLimpia.password = data.password;
  }

  const res = await fetch(`${BASE_URL}/api/usuarios/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(dataLimpia),
  });

  await handleResponse(res);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al actualizar usuario');
  }

  return res.json();
}

// --- Medicamentos (stubs — conectar cuando exista el modelo) ---
export async function getMedicamentos() {
  if (!isOnline()) {
    const cached = getLocalCache('medicamentos');
    if (cached) return cached;
    return [];
  }
  try {
    const res = await fetch(`${BASE_URL}/api/medicamentos?_t=${Date.now()}`, {
      headers: { ...getAuthHeaders() },
      cache: 'no-store'
    });
    await handleResponse(res);
    if (!res.ok) throw new Error('Error al obtener medicamentos');
    const data = await res.json();
    setLocalCache('medicamentos', data);
    return data;
  } catch (error) {
    const cached = getLocalCache('medicamentos');
    if (cached) return cached;
    throw error;
  }
}

export async function getMedicamentoById(id) {
  const res = await fetch(`${BASE_URL}/api/medicamentos/${id}?_t=${Date.now()}`, {
    headers: { ...getAuthHeaders() },
    cache: 'no-store'
  });

  await handleResponse(res);
  if (!res.ok) throw new Error('Error al obtener medicamentos');
  return res.json();
}

export async function createMedicamento(formData) {
  const response = await fetch(`${BASE_URL}/api/medicamentos`,
    {
      method: 'POST',
      headers: {
        ...getAuthHeaders()
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error actualizando medicamento');
  }

  return response.json();
}

export async function updateMedicamento(id, formData) {
  const response = await fetch(`${BASE_URL}/api/medicamentos/${id}`,
    {
      method: 'PUT',
      headers: {
        ...getAuthHeaders()
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error actualizando medicamento');
  }

  return response.json();
}

export async function inactivarMedicamento(id) {
  const res = await fetch(`${BASE_URL}/api/medicamentos/${id}/cambiarEstado`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({})
  });

  await handleResponse(res);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al cambiar estado');
  }

  return res.json();
}

export async function toggleEstadoUsuario(id) {
  const res = await fetch(`${BASE_URL}/api/usuarios/${id}/estado`, {
    method: 'PATCH',
    headers: { ...getAuthHeaders() },
  });
  await handleResponse(res);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al cambiar estado del usuario');
  }
}


export async function getRutas() {
  if (!isOnline()) {
    const cached = getLocalCache('rutas');
    if (cached) return cached;
    throw new Error('Sin conexión a Internet y sin datos guardados localmente.');
  }
  try {
    const res = await fetch(`${BASE_URL}/api/rutas?_t=${Date.now()}`, {
      headers: { ...getAuthHeaders() },
      cache: 'no-store'
    });
    await handleResponse(res);
    if (!res.ok) throw new Error('Error al obtener rutas');
    const data = await res.json();
    setLocalCache('rutas', data);
    return data;
  } catch (error) {
    const cached = getLocalCache('rutas');
    if (cached) {
      console.warn('Fallo de red, sirviendo rutas desde la caché local:', error);
      return cached;
    }
    throw error;
  }
}

export async function getRutaById(id) {
  const res = await fetch(`${BASE_URL}/api/rutas/${id}?_t=${Date.now()}`, {
    headers: { ...getAuthHeaders() },
    cache: 'no-store'
  });
  await handleResponse(res);
  if (!res.ok) throw new Error('Ruta no encontrada');
  return res.json();
}

export async function createRuta(data) {
  const res = await fetch(`${BASE_URL}/api/rutas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(data),
  });
  await handleResponse(res);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al crear ruta');
  }
  return res.json();
}

export async function finalizarRuta(id) {
  const url = `${BASE_URL}/api/rutas/${id}/finalizar`;

  if (!isOnline()) {
    console.log('[Offline Queue] Encolando finalización de ruta:', id);
    addToSyncQueue('finalizarRuta', url, 'PUT', {});
    updateLocalCacheFinalizarRuta(id);
    return { success: true, offline: true, id };
  }

  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: { ...getAuthHeaders() },
    });
    await handleResponse(res);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al finalizar ruta');
    }
    const data = await res.json();
    updateLocalCacheFinalizarRuta(id);
    return data;
  } catch (error) {
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || !isOnline()) {
      console.warn('[Offline Queue] Error de red. Encolando finalización de ruta:', error);
      addToSyncQueue('finalizarRuta', url, 'PUT', {});
      updateLocalCacheFinalizarRuta(id);
      return { success: true, offline: true, id };
    }
    throw error;
  }
}

export async function getTrackingPublico(id) {
  const trackingId = (id || "").trim();
  if (!trackingId) throw new Error("Ingresá un Tracking ID");

  const res = await fetch(
    `${BASE_URL}/public/tracking/${encodeURIComponent(trackingId)}`
  );

  const text = await res.text();

  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }

  if (!res.ok) {
    const msgFromJson = data.error || data.message || data.reason;

    const msgByStatus =
      res.status === 404
        ? "Envío no encontrado"
        : res.status === 400
          ? "Tracking ID inválido"
          : "Error al consultar tracking";


    const limpio =
      !msgFromJson || msgFromJson.toLowerCase() === "not found"
        ? null : msgFromJson;

    throw new Error(limpio || msgByStatus);
  }

  return data;
}

export async function getTransportes(q, estado) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (estado) params.set("estado", estado);

  const res = await fetch(`${BASE_URL}/api/transportes?${params.toString()}`, {
    headers: { ...getAuthHeaders() }
  });
  await handleResponse(res);
  if (!res.ok) throw new Error("Error al obtener transportes");
  return res.json();
}

export async function createTransporte(data) {
  const res = await fetch(`${BASE_URL}/api/transportes`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(data)
  });
  await handleResponse(res);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || "Error al crear transporte");
  return body;
}

export async function updateTransporte(id, data) {
  const res = await fetch(`${BASE_URL}/api/transportes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(data)
  });
  await handleResponse(res);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || "Error al actualizar transporte");
  return body;
}

export async function desactivarTransporte(id) {
  const res = await fetch(`${BASE_URL}/api/transportes/${id}/desactivar`, {
    method: "PATCH",
    headers: { ...getAuthHeaders() }
  });
  await handleResponse(res);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || "Error al desactivar transporte");
  return body;
}

//Clientes
export async function getClientes() {
  if (!isOnline()) {
    const cached = getLocalCache('clientes');
    if (cached) return cached;
    return [];
  }
  try {
    const response = await fetch(`${BASE_URL}/api/clientes`, {
      headers: { ...getAuthHeaders() },
    });
    if (!response.ok)
      throw new Error('Error al obtener clientes');
    const data = await response.json();
    setLocalCache('clientes', data);
    return data;
  } catch (error) {
    const cached = getLocalCache('clientes');
    if (cached) return cached;
    throw error;
  }
}

export async function getClienteById(id) {
  const response = await fetch(`${BASE_URL}/api/clientes/${id}`,
    {
      headers: { ...getAuthHeaders() },
    }
  );

  if (!response.ok)
    throw new Error('Error al obtener cliente');

  return response.json();
}

export async function createCliente(cliente) {
  const response = await fetch(`${BASE_URL}/api/clientes`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(cliente)
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al crear cliente');
  }

  return response.json();
}

export async function updateCliente(id, cliente) {
  const response = await fetch(`${BASE_URL}/api/clientes/${id}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(cliente)
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al actualizar cliente');
  }

  return response.json();
}

export async function cambiarEstadoCliente(id) {
  const response = await fetch(`${BASE_URL}/api/clientes/${id}/cambiarEstado`,
    {
      method: 'PUT',
      headers: { ...getAuthHeaders() },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al cambiar estado');
  }

  return response.json();
}

export async function getReporte({ tema, fechaInicio, fechaFin, granularidad }) {
  const params = new URLSearchParams({
    tema,
    fechaInicio,
    fechaFin,
    granularidad
  });
  const res = await fetch(`${BASE_URL}/api/reportes?${params.toString()}`, {
    method: 'GET',
    headers: { ...getAuthHeaders() }
  });
  await handleResponse(res);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al generar el reporte operativo');
  }
  return res.json();
}

export const getKpisDashboard = async (historico = false) => {
  const response = await fetch(`${BASE_URL}/api/kpis/dashboard?historico=${historico}`);
  if (!response.ok) throw new Error('Error al obtener las métricas');
  return await response.json();
}

//CSV
export async function exportReporteCsv({ tema, fechaInicio, fechaFin, granularidad }) {
  const params = new URLSearchParams({
    tema,
    fechaInicio,
    fechaFin,
    granularidad: granularidad || "diaria",
  });

  const url = (`${BASE_URL}/api/reportes/export/csv?${params.toString()}`);

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      ...getAuthHeaders(),
      Accept: 'text/csv',
    },
  });

  await handleResponse(res);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Error al exportar el reporte a CSV");
  }

  return await res.blob();
}

//EXCEL
export async function exportReporteExcel({ tema, fechaInicio, fechaFin, granularidad }) {
  const params = new URLSearchParams({
    tema,
    fechaInicio,
    fechaFin,
    granularidad: granularidad || "diaria",
  });

  const url = (`${BASE_URL}/api/reportes/export/excel?${params.toString()}`);

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      ...getAuthHeaders(),
      Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
  });

  await handleResponse(res);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Error al exportar el reporte a Excel");
  }

  return await res.blob();
}

//Mails
export async function getMails() {
  const response = await fetch(
    `${BASE_URL}/api/mails?_t=${Date.now()}`,
    {
      headers: {
        ...getAuthHeaders()
      },
      cache: 'no-store'
    }
  );

  await handleResponse(response);

  if (!response.ok) {
    throw new Error('Error al obtener mails');
  }

  return response.json();
}

export async function getMailById(id) {
  const response = await fetch(
    `${BASE_URL}/api/mails/${id}?_t=${Date.now()}`,
    {
      headers: {
        ...getAuthHeaders()
      },
      cache: 'no-store'
    }
  );

  await handleResponse(response);

  if (!response.ok) {
    throw new Error('Mail no encontrado');
  }

  return response.json();
}

export async function buscarMails(texto) {
  const response = await fetch(
    `${BASE_URL}/api/mails/buscar?texto=${encodeURIComponent(texto)}`,
    {
      headers: {
        ...getAuthHeaders()
      }
    }
  );

  await handleResponse(response);

  if (!response.ok) {
    throw new Error('Error al buscar mails');
  }

  return response.json();
}

export async function getMailsPorEstado(estado) {
  const response = await fetch(
    `${BASE_URL}/api/mails/estado/${estado}`,
    {
      headers: {
        ...getAuthHeaders()
      }
    }
  );

  await handleResponse(response);

  if (!response.ok) {
    throw new Error('Error al obtener mails');
  }

  return response.json();
}

export async function createMail(mail) {
  const response = await fetch(
    `${BASE_URL}/api/mails`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(mail)
    }
  );

  await handleResponse(response);

  if (!response.ok) {

    const error = await response
      .json()
      .catch(() => ({}));

    throw new Error(
      error.error || 'Error al crear mail'
    );
  }

  return response.json();
}

export async function getNotificaciones() {
  const res = await fetch(`${BASE_URL}/api/notificaciones?_t=${Date.now()}`, {
    headers: { ...getAuthHeaders() },
    cache: 'no-store'
  });
  await handleResponse(res);
  if (!res.ok) throw new Error('Error al obtener notificaciones');
  return res.json();
}

export async function getNotificacionesUnreadCount() {
  const res = await fetch(`${BASE_URL}/api/notificaciones/sin-leer/cantidad?_t=${Date.now()}`, {
    headers: { ...getAuthHeaders() },
    cache: 'no-store'
  });
  await handleResponse(res);
  if (!res.ok) throw new Error('Error al obtener conteo de notificaciones');
  return res.json();
}

export async function marcarNotificacionLeida(id) {
  const res = await fetch(`${BASE_URL}/api/notificaciones/${id}/leer`, {
    method: 'PUT',
    headers: { ...getAuthHeaders() }
  });
  await handleResponse(res);
  if (!res.ok) throw new Error('Error al marcar notificación como leída');
  return res.json();
}

export async function marcarTodasNotificacionesLeidas() {
  const res = await fetch(`${BASE_URL}/api/notificaciones/leer-todas`, {
    method: 'PUT',
    headers: { ...getAuthHeaders() }
  });
  await handleResponse(res);
  if (!res.ok) throw new Error('Error al marcar todas las notificaciones como leídas');
  return res.json();
}

export async function crearReclamoCambioDatos(data) {
  const res = await fetch(`${BASE_URL}/public/reclamos/cambio-datos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al crear reclamo de cambio de datos');
  }
  return res.json();
}
