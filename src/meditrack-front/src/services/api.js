const BASE_URL = 'http://localhost:8080';

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

export async function getEnvios() {
  const res = await fetch(`${BASE_URL}/api/envios`, {
    headers: { ...getAuthHeaders() },
  });
  await handleResponse(res);
  if (!res.ok) throw new Error('Error al obtener envíos');
  return res.json();
}

export async function getEnvioById(id) {
  const res = await fetch(`${BASE_URL}/api/envios/${id}`, {
    headers: { ...getAuthHeaders() },
  });
  await handleResponse(res);
  if (!res.ok) throw new Error('Envío no encontrado');
  return res.json();
}

export async function createEnvio(data) {
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
    observaciones: data.observaciones
  };

  const res = await fetch(`${BASE_URL}/api/envios/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(dataLimpia),
  });

  await handleResponse(res);
  if (!res.ok) throw new Error('Error al actualizar envío');
  return res.json();
}

export async function updateEstadoEnvio(id, estado, fecha, hora, usuario) {
  const res = await fetch(`${BASE_URL}/api/envios/${id}/estado`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ estado, fecha, hora, usuario }),
  });
  await handleResponse(res);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Error al actualizar estado');
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
  const res = await fetch(`${BASE_URL}/api/usuarios`, {
    headers: { ...getAuthHeaders() },
  });
  await handleResponse(res);
  if (!res.ok) throw new Error('Error al obtener usuarios');
  return res.json();
}

export async function getUsuarioById(id) {
  const res = await fetch(`${BASE_URL}/api/usuarios/${id}`, {
    headers: { ...getAuthHeaders() },
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
    telefono: data.telefono,
    rol: data.rol
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
  return 
}

// --- Medicamentos (stubs — conectar cuando exista el modelo) ---
export async function getMedicamentos() {
  const res = await fetch(`${BASE_URL}/api/medicamentos`, {
    headers: { ...getAuthHeaders() },
  });
  await handleResponse(res);
  if (!res.ok) throw new Error('Error al obtener medicamentos');
  return res.json();
}

export async function getMedicamentoById(id) {
  const res = await fetch(`${BASE_URL}/api/medicamentos/${id}`, {
    headers: { ...getAuthHeaders() },
  });

  await handleResponse(res);
  if (!res.ok) throw new Error('Error al obtener medicamentos');
  return res.json();
}

export async function createMedicamento(data) {
  const res = await fetch(`${BASE_URL}/api/medicamentos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
  });

  await handleResponse(res);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al crear medicamento');
  }

  return res.json();
}

export async function updateMedicamento(id, data) {
  fetch(`${BASE_URL}/api/medicamentos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(data),
  });
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
    ? null: msgFromJson;

    throw new Error(limpio || msgByStatus);
  }

  return data;
} 
