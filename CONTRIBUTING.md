## 🤝 Contributing

Las contribuciones son bienvenidas.

### 📌 Recomendaciones

- Mantener una estructura de código clara y modular.
- Respetar el sistema de roles y permisos existente.
- Utilizar nombres descriptivos para componentes, variables y commits.
- Evitar lógica duplicada.
- Probar los cambios antes de realizar un PR.

### 🌱 Flujo de trabajo

```bash
git checkout -b feature/nueva-funcionalidad
```

Realizar cambios y luego:

```bash
git add .
git commit -m "feat: nueva funcionalidad"
git push origin feature/nueva-funcionalidad
```

Abrir un Pull Request describiendo:

- Objetivo del cambio
- Funcionalidad agregada/modificada
- Posibles impactos
- Evidencia visual si aplica

### 🧹 Convención sugerida de commits

```bash
feat:
fix:
refactor:
style:
docs:
```

Ejemplos:

```bash
feat: agregar gestión de transportes
fix: corregir permisos en rutas protegidas
refactor: simplificar lógica de asignación
```