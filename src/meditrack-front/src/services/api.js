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
  }).catch(() => {});
}

export async function getEnvios() {
  const res = await fetch(`${BASE_URL}/envios`, {
    headers: { ...getAuthHeaders() },
  });
  await handleResponse(res);
  if (!res.ok) throw new Error('Error al obtener envíos');
  return res.json();
}

export async function getEnvio(id) {
  const res = await fetch(`${BASE_URL}/envios/${id}`, {
    headers: { ...getAuthHeaders() },
  });
  await handleResponse(res);
  if (!res.ok) throw new Error('Envío no encontrado');
  return res.json();
}

export async function createEnvio(data) {
  const res = await fetch(`${BASE_URL}/envios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(data),
  });
  await handleResponse(res);
  if (!res.ok) throw new Error('Error al crear envío');
  return res.json();
}

export async function updateEnvio(id, data) {
  const res = await fetch(`${BASE_URL}/envios/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(data),
  });
  await handleResponse(res);
  if (!res.ok) throw new Error('Error al actualizar envío');
  return res.json();
}

export async function updateEstado(id, estado, fecha, hora, usuario) {
  const res = await fetch(`${BASE_URL}/envios/${id}/estado`, {
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
