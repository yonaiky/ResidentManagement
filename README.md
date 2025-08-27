# Sistema de Gestión de Funeraria

Un sistema completo de gestión para funerarias que permite administrar clientes, planes funerarios, inventario de ataúdes, pagos y notificaciones.

## 🚀 Características

### Gestión de Clientes
- Registro completo de clientes con información personal
- Contactos de emergencia
- Historial de planes y pagos
- Búsqueda y filtrado avanzado

### Planes Funerarios
- Diferentes tipos de planes (Funeral, Cremación, Entierro, Memorial)
- Asociación con ataúdes específicos
- Control de precios y duración
- Estados de plan (Activo, Inactivo, Completado)

### Inventario de Ataúdes
- Control de stock en tiempo real
- Diferentes materiales y tamaños
- Precios y disponibilidad
- Estados de inventario (Disponible, Reservado, Vendido)

### Sistema de Pagos
- Registro de pagos por cliente
- Estados de pago (Pagado, Pendiente, Vencido)
- Historial completo de transacciones
- Recordatorios automáticos

### Notificaciones
- Integración con WhatsApp
- Envío de recordatorios de pagos
- Notificaciones personalizadas

## 🛠️ Tecnologías

- **Frontend**: Next.js 14, React, TypeScript
- **UI**: Shadcn/ui, Tailwind CSS
- **Base de Datos**: Prisma ORM, SQLite
- **Validación**: Zod, React Hook Form
- **Iconos**: Lucide React
- **Fechas**: date-fns
- **Máscaras de Input**: react-imask

## 📦 Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd ResidentManagement
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar la base de datos**
```bash
npx prisma migrate dev
npx prisma generate
```

4. **Ejecutar el proyecto**
```bash
npm run dev
```

5. **Abrir en el navegador**
```
http://localhost:3000
```

## 🗄️ Estructura de la Base de Datos

### Modelos Principales

#### Client (Cliente)
- Información personal (nombre, apellido, cédula, teléfono, email)
- Dirección y contactos de emergencia
- Relación con planes y pagos

#### Plan (Plan Funerario)
- Nombre y descripción del plan
- Tipo de plan (funeral, cremación, entierro, memorial)
- Precio y duración
- Asociación con cliente y ataúd

#### Casket (Ataúd)
- Nombre y descripción
- Material y tamaño
- Precio y stock disponible
- Estado de disponibilidad

#### Payment (Pago)
- Monto y fecha de pago
- Estado del pago
- Asociación con cliente

#### Notification (Notificación)
- Tipo y contenido de notificación
- Estado de envío
- Asociación con cliente

## 🎯 Funcionalidades Principales

### Dashboard
- Resumen general de la funeraria
- Estadísticas de clientes, planes y ingresos
- Gráficos de ingresos mensuales
- Actividad reciente

### Gestión de Clientes
- Lista completa de clientes
- Búsqueda por nombre, cédula o email
- Crear, editar y eliminar clientes
- Ver historial de planes y pagos

### Gestión de Planes
- Crear planes funerarios personalizados
- Asociar con clientes y ataúdes
- Control de precios y estados
- Seguimiento de duración

### Inventario
- Control de stock de ataúdes
- Diferentes materiales y tamaños
- Estados de disponibilidad
- Alertas de stock bajo

### Pagos
- Registro de pagos
- Estados de pago
- Historial completo
- Recordatorios automáticos

## 🔧 Configuración

### Variables de Entorno
Crear un archivo `.env.local` con:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

### WhatsApp Integration
Para la integración con WhatsApp, configurar las credenciales necesarias en el archivo de configuración.

## 📱 Interfaz de Usuario

El sistema cuenta con una interfaz moderna y responsiva que incluye:

- **Navegación lateral** con acceso rápido a todas las secciones
- **Dashboard interactivo** con estadísticas en tiempo real
- **Tablas con búsqueda** y filtrado avanzado
- **Formularios validados** con feedback visual
- **Modales y diálogos** para acciones específicas
- **Notificaciones toast** para feedback del usuario

## 🚀 Despliegue

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm run build
npm start
```

### Docker
```bash
docker-compose up -d
```

## 📝 Licencia

Este proyecto está bajo la Licencia MIT.

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📞 Soporte

Para soporte técnico o preguntas sobre el sistema, contactar al equipo de desarrollo.
