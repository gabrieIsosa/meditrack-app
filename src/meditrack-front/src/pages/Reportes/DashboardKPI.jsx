import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getKpisDashboard } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { RefreshCcw, FileText } from 'lucide-react';

const DashboardKPI = () => {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [historico, setHistorico] = useState(false);

    const cargarDatos = async (modoHistorico = false) => {
        try {
            setLoading(true);
            setError(null);
            const respuesta = await getKpisDashboard(modoHistorico);
            setData(respuesta);
        } catch {
            setError('No se pudieron sincronizar los indicadores con la base de datos.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarDatos(historico);
    }, [historico]);

    const obtenerDatosFiltrados = (volumen) => {
        return (volumen || []).filter(item => item.cantidad > 0);
    };

    const calcularRotacionCalibre = (valor, maximo) => {
        const porcentaje = Math.min(Math.max(valor / maximo, 0), 1);
        return -90 + (porcentaje * 180);
    };

    const navegarAReporte = (temaReporte) => {
        const hoy = new Date().toISOString().split('T')[0];
        const fechaInicio = historico ? '2020-01-01' : hoy;
        
        navigate('/reportes', {
            state: {
                tema: temaReporte,
                fechaInicio: fechaInicio,
                fechaFin: hoy,
                granularidad: 'diaria',
                autoEjecutar: true
            }
        });
    };

    const renderAgujaIncidencias = (valor, maximo, cx, cy, innerRadius, outerRadius) => {
        const porcentaje = Math.min(Math.max(valor / maximo, 0), 1);
        const angulo = 180 - (porcentaje * 180);
        const RADIAN = Math.PI / 180;
        const largoAguja = outerRadius - 5;
        const x = cx + largoAguja * Math.cos(angulo * RADIAN);
        const y = cy - largoAguja * Math.sin(angulo * RADIAN);

        return (
            <g style={{ pointerEvents: 'none' }}>
                <line x1={cx} y1={cy} x2={x} y2={y} stroke="#475569" strokeWidth="4" strokeLinecap="round" />
                <circle cx={cx} cy={cy} r="6" fill="#475569" />
            </g>
        );
    };

    if (loading) {
        return (
            <div style={{ padding: '20px', fontFamily: 'sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
                <style>{`
                    .skeleton-pulse {
                        background: #e2e8f0;
                        animation: skeleton-blink 1.5s infinite ease-in-out;
                    }
                    @keyframes skeleton-blink {
                        0% { background-color: #e2e8f0; }
                        50% { background-color: #cbd5e1; }
                        100% { background-color: #e2e8f0; }
                    }
                `}</style>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
                        <div className="skeleton-pulse" style={{ height: '38px', width: '90px', borderRadius: '6px' }}></div>
                        <div className="skeleton-pulse" style={{ height: '32px', width: '320px', borderRadius: '6px' }}></div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <div className="skeleton-pulse" style={{ height: '32px', width: '110px', borderRadius: '6px' }}></div>
                        <div className="skeleton-pulse" style={{ height: '40px', width: '40px', borderRadius: '50%' }}></div>
                    </div>
                </div>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '30px' }}>
                    {[1, 2, 3].map((n) => (
                        <div key={n} style={{ flex: '1 1 300px', background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '180px', justifyContent: 'space-between' }}>
                            <div className="skeleton-pulse" style={{ height: '18px', width: '60%', borderRadius: '4px' }}></div>
                            <div className="skeleton-pulse" style={{ height: '80px', width: '80%', borderRadius: '8px', margin: '15px 0' }}></div>
                            <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
                                <div className="skeleton-pulse" style={{ height: '26px', width: '32px', borderRadius: '6px' }}></div>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '20px' }}>
                    {[1, 2].map((n) => (
                        <div key={n} style={{ flex: '1 1 450px', background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', minHeight: '380px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div className="skeleton-pulse" style={{ height: '22px', width: '40%', borderRadius: '4px', marginBottom: '20px' }}></div>
                            <div className="skeleton-pulse" style={{ flex: 1, width: '100%', borderRadius: '8px', minHeight: '280px' }}></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: '20px', color: '#ef4444', textAlign: 'center', fontFamily: 'sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <p style={{ fontWeight: '500', fontSize: '16px' }}>{error}</p>
                <button onClick={() => cargarDatos(historico)} style={{ marginTop: '10px', padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Reintentar</button>
            </div>
        );
    }

    const maxEntregasDia = Math.max((data?.entregasDia || 0) * 2, 10);
    const datosSemicirculo = [
        { value: 33.33, color: '#f3d785' },
        { value: 33.33, color: '#f59e0b' },
        { value: 33.34, color: '#ef4444' }
    ];

    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '10px' }}>
                <div className="page-header-row" style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
                    <button className="btn btn-secondary" onClick={() => navigate(-1)}>VOLVER</button>
                    <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#111827' }}>Panel de Control Meditrack</h1>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', background: '#e2e8f0', borderRadius: '6px', padding: '2px' }}>
                        <button onClick={() => setHistorico(false)} style={{ padding: '6px 12px', borderRadius: '4px', border: 'none', background: !historico ? 'white' : 'transparent', color: !historico ? '#1e293b' : '#64748b', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>Hoy</button>
                        <button onClick={() => setHistorico(true)} style={{ padding: '6px 12px', borderRadius: '4px', border: 'none', background: historico ? 'white' : 'transparent', color: historico ? '#1e293b' : '#64748b', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>Histórico</button>
                    </div>
                    <button onClick={() => cargarDatos(historico)} style={{ background: 'white', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <RefreshCcw size={18} />
                    </button>
                </div>
            </div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '30px' }}>
                <div style={{ flex: '1 1 300px', background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', minHeight: '180px' }}>
                    <h4 style={{ margin: '0 0 15px 0', color: '#64748b', fontSize: '0.95rem', fontWeight: '600', width: '100%', textAlign: 'center' }}>Volumen de Envíos</h4>
                    <div style={{ width: '100%', height: '110px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={obtenerDatosFiltrados(data?.volumenEnvios)} margin={{ top: 5, right: 10, left: -30, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="estado" stroke="#94a3b8" fontSize={10} tickLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} allowDecimals={false} />
                                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ background: '#1e293b', color: '#fff', borderRadius: '6px', fontSize: '11px', border: 'none' }} />
                                <Bar dataKey="cantidad" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={30} name="Envíos" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <button onClick={() => navegarAReporte('volumen')} style={{ position: 'absolute', bottom: '3px', right: '10px', background: '#f1f5f9', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', color: '#475569' }}>
                        <FileText size={14} />
                    </button>
                </div>
                <div style={{ flex: '1 1 300px', background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
                    <h4 style={{ margin: '0 0 15px 0', color: '#64748b', fontSize: '0.95rem', fontWeight: '600', width: '100%', textAlign: 'center' }}>Entregas {historico ? 'Totales' : 'de Hoy'}</h4>
                    <div style={{ position: 'relative', width: '160px', height: '85px', overflow: 'hidden', marginBottom: '10px' }}>
                        <div style={{ width: '160px', height: '160px', borderRadius: '50%', border: '20px solid #e2e8f0', boxSizing: 'border-box', position: 'absolute', top: 0, left: 0 }}></div>
                        <div style={{ width: '160px', height: '160px', borderRadius: '50%', border: '20px solid transparent', borderTopColor: '#10b981', borderRightColor: '#10b981', boxSizing: 'border-box', position: 'absolute', top: 0, left: 0, transform: `rotate(${calcularRotacionCalibre(data?.entregasDia || 0, maxEntregasDia)}deg)`, transformOrigin: 'center center' }}></div>
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, textAlign: 'center', fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>{data?.entregasDia || 0}</div>
                    </div>
                    <button onClick={() => navegarAReporte('entregas')} style={{ position: 'absolute', bottom: '3px', right: '10px', background: '#f1f5f9', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', color: '#475569' }}>
                        <FileText size={14} />
                    </button>
                </div>
                <div style={{ flex: '1 1 300px', background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
                    <h4 style={{ margin: '0 0 5px 0', color: '#64748b', fontSize: '0.95rem', fontWeight: '600', width: '100%', textAlign: 'center' }}>Tasa de Incidencias</h4>
                    <div style={{ width: '180px', height: '100px', position: 'relative' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                <Pie data={datosSemicirculo} cx={90} cy={85} startAngle={180} endAngle={0} innerRadius={58} outerRadius={80} dataKey="value" stroke="none">
                                    {datosSemicirculo.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <text x={90} y={80} textAnchor="middle" dominantBaseline="auto" style={{ fontSize: '24px', fontWeight: 'bold', fill: '#1e293b', fontFamily: 'sans-serif' }}>
                                    {data?.tasaIncidencias || 0}%
                                </text>
                                {renderAgujaIncidencias(data?.tasaIncidencias || 0, 100, 90, 85, 58, 80)}
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <button onClick={() => navegarAReporte('incidencias')} style={{ position: 'absolute', bottom: '3px', right: '10px', background: '#f1f5f9', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', color: '#475569' }}>
                        <FileText size={14} />
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '20px' }}>
                <div style={{ flex: '1 1 450px', background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', minHeight: '380px', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ color: '#334155', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px', marginTop: 0, fontSize: '1.1rem', marginBottom: '20px' }}>Medicamentos mas Solicitados</h3>
                    <div style={{ width: '100%', flex: 1, minHeight: '280px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data?.topMedicamentos || []} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="nombre" stroke="#94a3b8" fontSize={11} tickLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ background: '#1e293b', color: '#fff', borderRadius: '6px', fontSize: '12px', border: 'none' }} />
                                <Bar dataKey="cantidad" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={45} name="Unidades" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div style={{ flex: '1 1 450px', background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', minHeight: '380px', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ color: '#334155', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px', marginTop: 0, fontSize: '1.1rem', marginBottom: '20px' }}>Clientes Destacados</h3>
                    <div style={{ width: '100%', flex: 1, minHeight: '280px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data?.topClientes || []} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="nombre" stroke="#94a3b8" fontSize={11} tickLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ background: '#1e293b', color: '#fff', borderRadius: '6px', fontSize: '12px', border: 'none' }} />
                                <Bar dataKey="pedidos" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={45} name="Pedidos Totales" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardKPI;