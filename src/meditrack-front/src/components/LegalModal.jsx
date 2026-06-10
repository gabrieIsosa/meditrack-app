import { useState, useEffect } from "react";
import { X, Send, CheckCircle2 } from "lucide-react";

export default function LegalModal({ isOpen, type, onClose }) {
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    asunto: "",
    mensaje: "",
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle, submitting, success

  // Reset form when modal opens/closes or type changes
  useEffect(() => {
    if (isOpen) {
      setFormData({ nombre: "", email: "", asunto: "", mensaje: "" });
      setErrors({});
      setStatus("idle");
      document.body.style.overflow = "hidden"; // Prevent background scroll
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, type]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es requerido";
    }
    if (!formData.email.trim()) {
      newErrors.email = "El correo electrónico es requerido";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Ingrese un correo electrónico válido";
    }
    if (!formData.asunto.trim()) {
      newErrors.asunto = "El asunto es requerido";
    }
    if (!formData.mensaje.trim()) {
      newErrors.mensaje = "El mensaje es requerido";
    } else if (formData.mensaje.trim().length < 10) {
      newErrors.mensaje = "El mensaje debe tener al menos 10 caracteres";
    }
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setStatus("submitting");
    // Simulate sending to MediTrack support
    setTimeout(() => {
      console.log("Contacto MediTrack recibido:", formData);
      setStatus("success");
    }, 1500);
  };

  const getTitle = () => {
    switch (type) {
      case "terms":
        return "Términos y Condiciones de Uso";
      case "privacy":
        return "Política de Privacidad (Ley N° 25.326)";
      case "contact":
        return "Contacto con MediTrack";
      default:
        return "Información Legal";
    }
  };

  const renderContent = () => {
    switch (type) {
      case "terms":
        return (
          <div style={{ color: "#374151", fontSize: "14px", lineHeight: "1.6" }}>
            <p style={{ marginBottom: "16px", fontWeight: "500" }}>
              Última actualización: 4 de junio de 2026
            </p>
            <p style={{ marginBottom: "16px" }}>
              Bienvenido a <strong>MediTrack</strong>. Al utilizar nuestra plataforma web y móvil, usted acepta de manera expresa y sin reservas los presentes Términos y Condiciones de Uso. Si no está de acuerdo con ellos, le solicitamos que se abstenga de utilizar nuestros servicios.
            </p>

            <h4 style={{ color: "#111827", fontSize: "16px", fontWeight: "600", marginTop: "20px", marginBottom: "8px" }}>
              1. Objeto del Servicio
            </h4>
            <p style={{ marginBottom: "16px" }}>
              MediTrack es una plataforma digital de control y seguimiento de logística farmacéutica. Proporciona herramientas para la asignación de rutas de entrega de medicamentos, actualización de estados de envío en tiempo real y consulta pública del estado de encomiendas médicas a través de identificadores únicos de tracking.
            </p>

            <h4 style={{ color: "#111827", fontSize: "16px", fontWeight: "600", marginTop: "20px", marginBottom: "8px" }}>
              2. Obligaciones y Uso Responsable
            </h4>
            <p style={{ marginBottom: "16px" }}>
              El Usuario se compromete a utilizar la plataforma únicamente con fines lícitos y autorizados de acuerdo con su rol en el sistema (Repartidor, Supervisor, Operador, Administrador o Cliente Final). Queda terminantemente prohibido alterar, intentar vulnerar la seguridad, o realizar consultas automatizadas masivas ajenas a la operatoria habitual de MediTrack.
            </p>

            <h4 style={{ color: "#111827", fontSize: "16px", fontWeight: "600", marginTop: "20px", marginBottom: "8px" }}>
              3. Propiedad Intelectual
            </h4>
            <p style={{ marginBottom: "16px" }}>
              Todos los desarrollos informáticos, códigos fuente, diseños gráficos, interfaces, logotipos y marcas contenidos en MediTrack son propiedad exclusiva de MediTrack S.A. o de sus licenciantes y están protegidos por las leyes de propiedad intelectual de la República Argentina y tratados internacionales.
            </p>

            <h4 style={{ color: "#111827", fontSize: "16px", fontWeight: "600", marginTop: "20px", marginBottom: "8px" }}>
              4. Limitación de Responsabilidad
            </h4>
            <p style={{ marginBottom: "16px" }}>
              MediTrack realiza sus mayores esfuerzos para asegurar la disponibilidad ininterrumpida de sus servidores y la precisión de la información de trazabilidad. No obstante, no garantiza que el sitio opere libre de errores o que la información sea exacta en todo momento, declinando toda responsabilidad por fallas en las redes de telecomunicaciones ajenas a su control o retrasos menores de sincronización en tránsito.
            </p>

            <h4 style={{ color: "#111827", fontSize: "16px", fontWeight: "600", marginTop: "20px", marginBottom: "8px" }}>
              5. Modificación de los Términos
            </h4>
            <p style={{ marginBottom: "16px" }}>
              MediTrack S.A. se reserva el derecho a modificar estos Términos y Condiciones en cualquier momento para adaptarlos a cambios normativos o mejoras de la plataforma. El uso continuado del sistema con posterioridad a dichas modificaciones implica la aceptación de los nuevos términos.
            </p>
          </div>
        );

      case "privacy":
        return (
          <div style={{ color: "#374151", fontSize: "14px", lineHeight: "1.6" }}>
            <p style={{ marginBottom: "16px", fontWeight: "500" }}>
              Cumplimiento con la Ley Nacional N° 25.326 de Protección de Datos Personales
            </p>
            <p style={{ marginBottom: "16px" }}>
              MediTrack S.A., con domicilio legal en Av. Corrientes 1234, Ciudad Autónoma de Buenos Aires, Argentina (en adelante, "MediTrack"), asume el compromiso constitucional de proteger los datos personales de sus usuarios y clientes de acuerdo con la legislación argentina vigente.
            </p>

            <h4 style={{ color: "#111827", fontSize: "16px", fontWeight: "600", marginTop: "20px", marginBottom: "8px" }}>
              1. Consentimiento Informado (Art. 5, Ley 25.326)
            </h4>
            <p style={{ marginBottom: "16px" }}>
              Al utilizar este portal e ingresar datos de envío, de autenticación o de contacto, el usuario otorga su consentimiento previo, expreso e informado para el tratamiento automatizado de los mismos en las bases de datos de MediTrack. Los datos se recolectan con la única finalidad de optimizar la entrega de medicamentos, realizar el seguimiento de rutas logísticas y responder consultas de soporte técnico.
            </p>

            <h4 style={{ color: "#111827", fontSize: "16px", fontWeight: "600", marginTop: "20px", marginBottom: "8px" }}>
              2. Medidas de Seguridad de la Información (Art. 9, Ley 25.326)
            </h4>
            <p style={{ marginBottom: "16px" }}>
              MediTrack adopta medidas técnicas, físicas y organizativas de seguridad que resultan idóneas para garantizar el resguardo y la confidencialidad de la información personal de los usuarios, evitando su adulteración, pérdida, consulta o tratamiento no autorizado. Estas medidas incluyen políticas de cifrado en tránsito (SSL/HTTPS), autenticación de doble factor para personal logístico y logs de auditoría en base de datos.
            </p>

            <h4 style={{ color: "#111827", fontSize: "16px", fontWeight: "600", marginTop: "20px", marginBottom: "8px" }}>
              3. Confidencialidad y Cesión (Arts. 10 y 11, Ley 25.326)
            </h4>
            <p style={{ marginBottom: "16px" }}>
              MediTrack y todo el personal que intervenga en cualquier fase del tratamiento de datos personales están obligados al secreto profesional. Los datos de pacientes y medicamentos transportados no serán cedidos, vendidos ni compartidos con terceros sin el consentimiento expreso y por escrito del titular, salvo obligación judicial o legal específica en el marco de la salud pública.
            </p>

            <h4 style={{ color: "#111827", fontSize: "16px", fontWeight: "600", marginTop: "20px", marginBottom: "8px" }}>
              4. Ejercicio de Derechos ARCO (Arts. 14, 15 y 16, Ley 25.326)
            </h4>
            <p style={{ marginBottom: "16px" }}>
              El titular de los datos personales tiene la facultad de ejercer el derecho de acceso a los mismos en forma gratuita a intervalos no inferiores a seis meses, salvo que se acredite un interés legítimo al efecto conforme lo establecido en el artículo 14, inciso 3 de la Ley Nº 25.326. Asimismo, podrá solicitar en cualquier momento la rectificación, actualización o supresión de sus datos. Para ejercer estos derechos, el usuario puede enviar una comunicación formal detallando su solicitud al correo electrónico: <a href="mailto:privacidad@meditrack.com" style={{ color: "#00A86B", textDecoration: "none", fontWeight: "500" }}>privacidad@meditrack.com</a>.
            </p>

            <h4 style={{ color: "#111827", fontSize: "16px", fontWeight: "600", marginTop: "20px", marginBottom: "8px" }}>
              5. Autoridad de Control y Denuncias
            </h4>
            <p style={{ marginBottom: "16px" }}>
              Se informa al usuario que la <strong>Agencia de Acceso a la Información Pública (AAIP)</strong>, órgano de control de la Ley N° 25.326, tiene la atribución de atender las denuncias y reclamos que se interpongan con relación al incumplimiento de las normas sobre protección de datos personales.
            </p>
          </div>
        );

      case "contact":
        if (status === "success") {
          return (
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "40px 20px",
              textAlign: "center",
              animation: "modalFadeIn 0.3s ease-out"
            }}>
              <CheckCircle2 size={64} color="#00A86B" style={{ marginBottom: "20px" }} />
              <h3 style={{ fontSize: "20px", fontWeight: "700", color: "#111827", marginBottom: "12px" }}>
                ¡Mensaje Enviado con Éxito!
              </h3>
              <p style={{ fontSize: "14px", color: "#4B5563", lineHeight: "1.6", maxWidth: "440px", margin: "0 0 24px 0" }}>
                Gracias por contactarte con el equipo de soporte y atención al cliente de MediTrack.
                Hemos recibido tus datos y te responderemos por correo electrónico en un plazo estimado de 24 horas hábiles.
              </p>
              <button
                onClick={onClose}
                style={{
                  background: "#00A86B",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 24px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "filter 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.filter = "brightness(0.9)"}
                onMouseLeave={(e) => e.currentTarget.style.filter = "none"}
              >
                Cerrar Ventana
              </button>
            </div>
          );
        }

        return (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#374151", marginBottom: "6px" }}>
                Nombre y Apellido
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                placeholder="Ej: Juan Pérez"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  fontSize: "14px",
                  borderRadius: "8px",
                  border: `1px solid ${errors.nombre ? "#DC2626" : "#D1D5DB"}`,
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.2s"
                }}
              />
              {errors.nombre && <p style={{ color: "#DC2626", fontSize: "12px", margin: "4px 0 0 0" }}>{errors.nombre}</p>}
            </div>

            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#374151", marginBottom: "6px" }}>
                Correo Electrónico
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="juan.perez@ejemplo.com"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  fontSize: "14px",
                  borderRadius: "8px",
                  border: `1px solid ${errors.email ? "#DC2626" : "#D1D5DB"}`,
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.2s"
                }}
              />
              {errors.email && <p style={{ color: "#DC2626", fontSize: "12px", margin: "4px 0 0 0" }}>{errors.email}</p>}
            </div>

            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#374151", marginBottom: "6px" }}>
                Asunto
              </label>
              <input
                type="text"
                name="asunto"
                value={formData.asunto}
                onChange={handleInputChange}
                placeholder="Ej: Inconveniente con tracking / Consulta comercial"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  fontSize: "14px",
                  borderRadius: "8px",
                  border: `1px solid ${errors.asunto ? "#DC2626" : "#D1D5DB"}`,
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.2s"
                }}
              />
              {errors.asunto && <p style={{ color: "#DC2626", fontSize: "12px", margin: "4px 0 0 0" }}>{errors.asunto}</p>}
            </div>

            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#374151", marginBottom: "6px" }}>
                Mensaje
              </label>
              <textarea
                name="mensaje"
                value={formData.mensaje}
                onChange={handleInputChange}
                placeholder="Escribe aquí tu consulta en detalle..."
                rows="4"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  fontSize: "14px",
                  borderRadius: "8px",
                  border: `1px solid ${errors.mensaje ? "#DC2626" : "#D1D5DB"}`,
                  outline: "none",
                  boxSizing: "border-box",
                  resize: "vertical",
                  fontFamily: "inherit",
                  transition: "border-color 0.2s"
                }}
              />
              {errors.mensaje && <p style={{ color: "#DC2626", fontSize: "12px", margin: "4px 0 0 0" }}>{errors.mensaje}</p>}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
              <button
                type="submit"
                disabled={status === "submitting"}
                style={{
                  background: "#00A86B",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 20px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: status === "submitting" ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  opacity: status === "submitting" ? 0.7 : 1,
                  transition: "filter 0.2s"
                }}
                onMouseEnter={(e) => { if (status !== "submitting") e.currentTarget.style.filter = "brightness(0.9)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; }}
              >
                {status === "submitting" ? (
                  <>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                      style={{ animation: "spin 1s linear infinite" }}
                    >
                      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.2)" strokeWidth="3" fill="none" />
                      <path d="M4 12a8 8 0 018-8V4a10 10 0 00-10 10h2z" fill="#fff" />
                    </svg>
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Enviar Mensaje
                  </>
                )}
              </button>
            </div>
          </form>
        );
      default:
        return null;
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.45)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        boxSizing: "border-box",
        animation: "modalFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards"
      }}
      onClick={onClose}
    >
      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalSlideUp {
          from { transform: translateY(16px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "600px",
          maxHeight: "calc(100vh - 32px)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          animation: "modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
          boxSizing: "border-box",
          overflow: "hidden"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px",
            borderBottom: "1px solid #E5E7EB",
            boxSizing: "border-box"
          }}
        >
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#111827" }}>
            {getTitle()}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#9CA3AF",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
              transition: "background-color 0.2s, color 0.2s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#F3F4F6";
              e.currentTarget.style.color = "#4B5563";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#9CA3AF";
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div
          style={{
            padding: "24px",
            overflowY: "auto",
            flex: 1,
            boxSizing: "border-box"
          }}
        >
          {renderContent()}
        </div>

        {/* Footer */}
        {status !== "success" && (
          <div
            style={{
              padding: "16px 24px",
              borderTop: "1px solid #E5E7EB",
              display: "flex",
              justifyContent: "flex-end",
              boxSizing: "border-box"
            }}
          >
            <button
              onClick={onClose}
              style={{
                background: "transparent",
                border: "1px solid #D1D5DB",
                color: "#4B5563",
                borderRadius: "8px",
                padding: "8px 16px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "background-color 0.2s, border-color 0.2s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#F9FAFB";
                e.currentTarget.style.borderColor = "#9CA3AF";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.borderColor = "#D1D5DB";
              }}
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
