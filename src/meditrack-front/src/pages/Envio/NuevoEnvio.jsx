import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createEnvio, getMedicamentos, getClientes } from '../../services/api';

const FORM_INICIAL = {
  remitente: '',
  destinatario: '',
  origen: '',
  destino: '',
  fechaEstimada: '',
  observaciones: '',
  latitudOrigen: null,
  longitudOrigen: null,
  latitudDestino: null,
  longitudDestino: null,
};

function NuevoEnvio() {
  const [form, setForm] = useState(FORM_INICIAL);
  const [catalogo, setCatalogo] = useState([]);
  const [itemsCarga, setItemsCarga] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [medicamentoSeleccionado, setMedicamentoSeleccionado] = useState(null);
  const [cantidadMed, setCantidadMed] = useState(1);
  const [loteMed, setLoteMed] = useState('');
  const [vencimientoMed, setVencimientoMed] = useState('');
  const [error, setError] = useState('');

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [clientes, setClientes] = useState([]);

  const [busquedaRemitente, setBusquedaRemitente] = useState('');
  const [busquedaDestinatario, setBusquedaDestinatario] = useState('');

  const [openRemitente, setOpenRemitente] = useState(false);
  const [openDestinatario, setOpenDestinatario] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    getClientes()
      .then(setClientes)
      .catch(console.error);

    getMedicamentos()
      .then(setCatalogo)
      .catch(err => setError(err.message || 'Error al cargar medicamentos.'));

    const handleClickAfuera = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickAfuera);
    return () => document.removeEventListener('mousedown', handleClickAfuera);
  }, []);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSelectMedicamento = (med) => {
    setMedicamentoSeleccionado(med);
    setBusqueda(`${med.nombre} (${med.presentacion})`);
    if (med.lote) setLoteMed(med.lote);
    if (med.fechaVencimiento) setVencimientoMed(med.fechaVencimiento);
    setIsOpen(false);
  };

  const handleAñadirCarga = () => {
    if (!busqueda.trim() || !medicamentoSeleccionado) {
      alert('Debe seleccionar un medicamento válido del catálogo para poder asociarlo al envío.');
      return;
    }

    if (!form.fechaEstimada) {
      alert('Debe ingresar primero la Fecha de entrega estimada del envío para poder validar el vencimiento.');
      return;
    }

    if (!loteMed.trim() || !vencimientoMed) {
      alert('El Lote y la Fecha de Vencimiento son campos estrictamente obligatorios.');
      return;
    }

    const fechaEntrega = new Date(form.fechaEstimada);
    const fechaVenc = new Date(vencimientoMed);

    if (fechaVenc <= fechaEntrega) {
      alert('La fecha de vencimiento del medicamento debe ser mayor que la fecha estimada de entrega del envío.');
      return;
    }

    const yaExiste = itemsCarga.some(m => m.idMedicamento === medicamentoSeleccionado.id && m.lote === loteMed.trim());
    if (yaExiste) {
      alert('Este medicamento con el mismo lote ya figura en la lista de la carga.');
      return;
    }

    setItemsCarga([
      ...itemsCarga,
      {
        idMedicamento: medicamentoSeleccionado.id,
        nombre: medicamentoSeleccionado.nombre,
        presentacion: medicamentoSeleccionado.presentacion,
        imagenUrl: medicamentoSeleccionado.imagenUrl,
        cantidad: Number(cantidadMed),
        lote: loteMed.trim(),
        vencimiento: vencimientoMed
      }
    ]);

    setBusqueda('');
    setMedicamentoSeleccionado(null);
    setCantidadMed(1);
    setLoteMed('');
    setVencimientoMed('');
  };

  const eliminarItem = (idMedicamento, lote) => {
    setItemsCarga(itemsCarga.filter(m => !(m.idMedicamento === idMedicamento && m.lote === lote)));
  };

  const actualizarCantidad = (idMedicamento, lote, nuevaCantidad) => {
    const val = Number(nuevaCantidad);
    if (val <= 0) return;
    setItemsCarga(prevItems => prevItems.map(m =>
      (m.idMedicamento === idMedicamento && m.lote === lote) ? { ...m, cantidad: val } : m
    ));
  };
console.log("asd")
  const handleGuardar = async () => {
    const camposAValidar = ['remitente', 'destinatario', 'origen', 'destino', 'fechaEstimada'];
    const hayCamposVacios = camposAValidar.some(key => !form[key]?.trim());

    if (hayCamposVacios) {
      setError('Todos los campos con asterisco (*) son obligatorios.');
      return;
    }

    if (itemsCarga.length === 0) {
      setError('Debe detallar o asociar al menos un componente en la Asignación de la Carga.');
      return;
    }

    const descripcionGenerada = itemsCarga.map(i => `${i.nombre} x${i.cantidad}`).join(', ');

    try {
      const detallesEnvio = itemsCarga.map(item => ({
        medicamento: { id: String(item.idMedicamento) },
        cantidad: Number(item.cantidad),
        lote: item.lote,
        fechaVencimiento: item.vencimiento
      }));

      const payload = {
        ...form,
        descripcionCarga: descripcionGenerada,
        prioridad: 'MEDIA',
        estado: 'PENDIENTE',
        detalles: detallesEnvio
      };

      await createEnvio(payload);
      navigate('/envios', { state: { success: true } });
    } catch (err) {
      setError(err.message || 'Error de conexión con el servidor.');
    }
  };

  const handleSelectRemitente = (cliente) => {
    setForm(prev => ({
      ...prev,
      remitente: cliente.nombre,
      origen: cliente.direccion,
      latitudOrigen: cliente.latitud,
      longitudOrigen: cliente.longitud
    }));

    setBusquedaRemitente(cliente.nombre);
    setOpenRemitente(false);
  };

  const handleSelectDestinatario = (cliente) => {
    setForm(prev => ({
      ...prev,
      destinatario: cliente.nombre,
      destino: cliente.direccion,
      latitudDestino: cliente.latitud,
      longitudDestino: cliente.longitud
    }));

    setBusquedaDestinatario(cliente.nombre);
    setOpenDestinatario(false);
  };

  const clientesFiltradosRemitente = busquedaRemitente.trim() ? clientes.filter(c => c.nombre?.toLowerCase().includes(busquedaRemitente.toLowerCase())) : clientes;

  const clientesFiltradosDestinatario = clientes.filter(c => c.nombre?.toLowerCase().includes(busquedaDestinatario.toLowerCase()));

  const opcionesFiltradas = catalogo.filter(m =>
    m.estadoActivo &&
    (m.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      m.presentacion.toLowerCase().includes(busqueda.toLowerCase()))
  );

  return (
    <div className="container">
      <div className="page-header">
        <h1>Nuevo envío</h1>
      </div>

      <div className="card">
        {error && (
          <div style={{ color: '#dc3545', backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontWeight: 'bold' }}>
            {error}
          </div>
        )}

        <div className="form-grid">
          <div className="form-group">

            <label>
              Remitente *
            </label>

            <div style={{ position: 'relative' }}>

              <input
                value={busquedaRemitente}
                placeholder="Buscar cliente..."
                onChange={(e) => {

                  setBusquedaRemitente(
                    e.target.value
                  );

                  setOpenRemitente(true);
                }}
                onFocus={() =>
                  setOpenRemitente(true)
                }
              />

              {openRemitente && (

                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: '#fff',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    marginTop: '4px',
                    maxHeight: '220px',
                    overflowY: 'auto',
                    zIndex: 1000
                  }}
                >

                  {clientesFiltradosRemitente.map(c => (

                    <div
                      key={c.id}
                      onClick={() =>
                        handleSelectRemitente(c)
                      }
                      style={{
                        padding: '10px',
                        cursor: 'pointer',
                        borderBottom:
                          '1px solid #F3F4F6'
                      }}
                    >
                      <div
                        style={{
                          fontWeight: '600'
                        }}
                      >
                        {c.nombre}
                      </div>

                      <div
                        style={{
                          fontSize: '12px',
                          color: '#6B7280'
                        }}
                      >
                        {c.direccion}
                      </div>

                    </div>

                  ))}

                </div>

              )}

            </div>

          </div>
          <div className="form-group">

  <label>Destinatario *</label>

  <div style={{ position: 'relative' }}>

    <input
      value={busquedaDestinatario}
      placeholder="Buscar cliente destino..."
      onChange={(e) => {
        setBusquedaDestinatario(e.target.value);
        setOpenDestinatario(true);
      }}
      onFocus={() => setOpenDestinatario(true)}
    />

    {openDestinatario && (
      <div
        style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: '#fff',
          border: '1px solid #D1D5DB',
          borderRadius: '8px',
          marginTop: '4px',
          maxHeight: '220px',
          overflowY: 'auto',
          zIndex: 1000
        }}
      >

        {clientesFiltradosDestinatario.map(c => (
          <div
            key={c.id}
            onClick={() =>
              handleSelectDestinatario(c)
            }
            style={{
              padding: '10px',
              cursor: 'pointer',
              borderBottom: '1px solid #F3F4F6'
            }}
          >

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span style={{ fontWeight: '600' }}>
                {c.nombre}
              </span>

            </div>

            <div
              style={{
                fontSize: '12px',
                color: '#6B7280'
              }}
            >
              {c.direccion}
            </div>

          </div>
        ))}

      </div>
    )}

  </div>

</div>
          <div className="form-group">
            <label>Origen *</label>
            <input name="origen" value={form.origen} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Destino *</label>
            <input name="destino" value={form.destino} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Fecha de entrega estimada *</label>
            <input type="date" name="fechaEstimada" value={form.fechaEstimada} onChange={handleChange} />
          </div>
          <div className="form-group form-full">
            <label>Observaciones (Opcional)</label>
            <textarea name="observaciones" value={form.observaciones} onChange={handleChange} rows="3" />
          </div>
        </div>

        <div style={{ background: '#F9FAFB', padding: '20px', borderRadius: '12px', border: '1px solid #E5E7EB', marginTop: '20px' }}>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '700', color: '#374151' }}>Asignación y detalle de la carga *</h3>
          <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#6B7280' }}>Busque un medicamento del catálogo. Luego complete lote, vencimiento vigente y añádalo.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#4B5563', marginBottom: '4px', display: 'block' }}>Buscar medicamento</label>
              <input
                type="text"
                value={busqueda}
                onChange={e => {
                  setBusqueda(e.target.value);
                  setMedicamentoSeleccionado(null);
                  setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                placeholder="Ej: Paracetamol..."
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #D1D5DB', boxSizing: 'border-box', minHeight: '42px' }}
              />
              {isOpen && busqueda.trim() && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#fff', border: '1px solid #D1D5DB', borderRadius: '8px', marginTop: '4px', maxHeight: '220px', overflowY: 'auto', zIndex: 1000, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                  {opcionesFiltradas.map(med => (
                    <div key={med.id} onClick={() => handleSelectMedicamento(med)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', cursor: 'pointer', borderBottom: '1px solid #F3F4F6', fontSize: '14px' }}>
                      {med.imagenUrl && (
                        <img src={med.imagenUrl} alt={med.nombre} style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '4px' }} />
                      )}
                      <div style={{ flex: 1 }}>
                        <span style={{ fontWeight: '600' }}>{med.nombre}</span> <span style={{ color: '#6B7280' }}>({med.presentacion})</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#4B5563', marginBottom: '4px', display: 'block' }}>Lote *</label>
                <input type="text" value={loteMed} onChange={e => setLoteMed(e.target.value)} placeholder="Ej: LOTE-123" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #D1D5DB', boxSizing: 'border-box', minHeight: '42px' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#4B5563', marginBottom: '4px', display: 'block' }}>Fecha de vencimiento *</label>
                <input type="date" value={vencimientoMed} onChange={e => setVencimientoMed(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #D1D5DB', boxSizing: 'border-box', minHeight: '42px' }} />
              </div>
              <div style={{ width: '100px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#4B5563', marginBottom: '4px', display: 'block' }}>Cantidad</label>
                <input type="number" min="1" value={cantidadMed} onChange={e => setCantidadMed(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #D1D5DB', boxSizing: 'border-box', minHeight: '42px' }} />
              </div>
              <button type="button" onClick={handleAñadirCarga} disabled={!busqueda.trim()} style={{ padding: '11px 20px', backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", minHeight: '42px' }}>
                AÑADIR
              </button>
            </div>
          </div>

          {itemsCarga.length > 0 ? (
            <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden', background: '#fff' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead style={{ backgroundColor: '#F3F4F6' }}>
                  <tr>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Detalle</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Lote</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Vencimiento</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>Cantidad</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {itemsCarga.map((item) => (
                    <tr key={`${item.idMedicamento}-${item.lote}`} style={{ borderBottom: '1px solid #E5E7EB' }}>
                      <td style={{ padding: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {item.imagenUrl && (
                          <img src={item.imagenUrl} alt={item.nombre} style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '4px' }} />
                        )}
                        <span>{item.nombre}</span>
                      </td>
                      <td style={{ padding: '10px' }}>{item.lote}</td>
                      <td style={{ padding: '10px' }}>{item.vencimiento}</td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <input type="number" min="1" value={item.cantidad} onChange={e => actualizarCantidad(item.idMedicamento, item.lote, e.target.value)} style={{ width: '60px', padding: '4px', textAlign: 'center', borderRadius: '4px', border: '1px solid #D1D5DB' }} />
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <button type="button" onClick={() => eliminarItem(item.idMedicamento, item.lote)} style={{ background: 'none', border: 'none', color: '#EF4444', fontWeight: 'bold', cursor: 'pointer' }}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '14px', fontSize: '12px', color: '#9CA3AF', border: '2px dashed #D1D5DB', borderRadius: '8px' }}>
              La carga está vacía. Añada medicamentos para continuar.
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '25px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/envios')}>CANCELAR</button>
          <button className="btn btn-primary" onClick={handleGuardar}>CREAR ENVÍO</button>
        </div>
      </div>
    </div>
  );
}

export default NuevoEnvio;