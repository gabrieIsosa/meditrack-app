import { useState } from "react";
import { getTrackingPublico } from "../../services/api";
import Navbar from '../../components/Navbar';

const PASOS =[
    {key: 'PENDIENTE', label: 'PENDIENTE'},
    {key: 'ASIGNADO', label: 'ASIGNADO'},
    {key: 'EN_PREPARACION', label: 'EN PREPARACION'},
    {key: 'EN_TRANSITO', label: 'EN TRANSITO'},
    {key: 'EN_PUNTO_DE_ENTREGA', label: 'EN PUNTO DE ENTREGA'},
    {key: 'ENTREGADO', label: 'ENTREGADO'},
    {key: 'CANCELADO', label: 'CANCELADO'},
];

function formaUltimaActualizacion(fecha, hora){
    if(!fecha && !hora) return '';
    const [y, m, d] = (fecha || '').split('-');
    const fechaFormateada = y && m && d ? `${d}/${m}/${y}` : (fecha || '');
    return `${fechaFormateada} ${hora ? `${hora}` : ''}`.trim();
}

export default function TrackingPublico() {
    const [trackingId, setTrackingId] = useState('');
    const [resultado, setResultado] = useState(null);
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);

    const idxActual = resultado
    ? PASOS.findIndex(p => p.key === resultado.estado)
    : -1;

    async function consultar(e) {
        e.preventDefault();
        setError('');
        setResultado(null);

        const id = trackingId.trim();
        if (!id) {
            setError('Ingrese un Tracking ID');
            return;
        }

        setCargando(true);
        try {
            const data = await getTrackingPublico(id);
            setResultado(data);
        } catch (err) {
            setError(err?.message || 'Error al consultar tracking');
        } finally {
            setCargando(false);
        }
    }
        return(
            <>
            <Navbar/>

            <div style={{maxWidth: 820, margin: '40px auto', padding: 16, color: '#111827'}}>
                <h1>Seguimiento público</h1>
                <p>Ingresá tu Tracking ID para consultar el estado de tu envío.</p>

                <form onSubmit={consultar} style={{display: 'flex', gap: 8, marginTop: 12}}>
                    <input
                        value={trackingId}
                        onChange={(e) => setTrackingId(e.target.value)}
                        placeholder="Ej: A1B2C3D4"
                        style={{flex: 1, padding: 10}}
                    />
                    <button type="submit"
                            disabled={cargando}
                            style={{padding: '10px 16px',
                                    background: cargando ? '#059669' : '#00A86B',
                                    color: '#fff',
                                    border: 'none',
                                    cursor: cargando ? 'not-allowed' : 'pointer',
                                    borderRadius: 8,
                                    transition: "transform 0.05s ease, filter 0.15s ease, background 0.15s ease",
                                    filter: cargando ? 'brightness(0.95)' : 'none',
                                    fontWeight: 'bold'
                                }}
                                onMouseDown={(e) => {
                                    if(!cargando) e.currentTarget.style.transform = 'scale(0.98)';
                                }}
                                onMouseUp={(e) => {
                                    e.currentTarget.style.transform = 'scale(1)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'scale(1)';
                                }}
                                onMouseEnter={(e) => {
                                    if(!cargando) e.currentTarget.style.filter = 'brightness(0.92)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.filter = cargando ? 'brightness(0.95)' : 'none';
                                }}
                                >
                        {cargando ? 'Consultando...' : 'Consultar'}
                    </button>
                </form>
            {error && (
                <div style={{marginTop: 16, color: '#DC2626'}}>
                    {error}
                </div>
            )}

            {resultado && (
                <div style={{ marginTop: 24 }}>
                    <h2 style={{ marginBottom: 6 }}>
                        Estado actual: {resultado.estado?.replaceAll('_', ' ')}
                    </h2>

                    <div style={{ color: "#111827" }}>
                        Última actualización: {''}
                        {formaUltimaActualizacion(resultado.fechaUltimoEstado, 
                            resultado.horaUltimoEstado)}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', marginTop: 22, gap: 8,
                        flexWrap: 'wrap' }}>
                            {PASOS.map((p,i) =>{
                                const completado = idxActual !== -1 && i <= idxActual;
                                const actual = idxActual !== -1 && i === idxActual;

                                const circleBg = actual || completado ? '#00A86B' : '#6B7280' ;
                                const lineBg = completado ? '#00A86B' : '#F3F4F6';
                            
                            return(
                                <div key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

                                <div style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: '50%',
                                    background: circleBg,
                                    color: '#ffffff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 700
                                }}
                                title={p.label}>
                                    {completado ? '✓' : i + 1}
                                </div>

                                <div style={{ fontSize: 12, fontWeight: actual ? 700 : 500 }}>
                                    {p.label}
                                </div>

                                {i < PASOS.length - 1 && (
                                    <div style={{
                                        width: 32, height: 2, background: lineBg}} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            </div>
            </>
        );

    }
    