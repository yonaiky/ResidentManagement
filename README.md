# Resident Management System

Sistema de gestión de residentes para condominios.

## Requisitos

- Node.js 18 o superior
- npm o yarn
- Git

## Configuración del Proyecto

1. Clona el repositorio:
```bash
git clone https://github.com/yonaiky/ResidentManagement.git
cd ResidentManagement
```

2. Instala las dependencias:
```bash
npm install
```

3. Configura la base de datos:
```bash
# Genera el cliente de Prisma
npx prisma generate

# Ejecuta las migraciones y crea la base de datos
npx prisma migrate dev
```

4. Inicia el servidor de desarrollo:
```bash
npm run dev
```

## Estructura de la Base de Datos

El proyecto usa Prisma como ORM. La base de datos es SQLite y se almacena localmente en `prisma/dev.db`. Este archivo está excluido del control de versiones para evitar conflictos entre diferentes entornos de desarrollo.

### Notas importantes sobre la base de datos:

- Cada desarrollador debe tener su propia base de datos local
- La base de datos se crea automáticamente al ejecutar `npx prisma migrate dev`
- Si hay cambios en el esquema, ejecuta `npx prisma migrate dev` para actualizar la base de datos
- Para ver la base de datos en el Prisma Studio, ejecuta `npx prisma studio`

## Scripts Disponibles

- `npm run dev`: Inicia el servidor de desarrollo
- `npm run build`: Construye la aplicación para producción
- `npm start`: Inicia la aplicación en modo producción
- `npm run lint`: Ejecuta el linter
- `npm run format`: Formatea el código

## Tecnologías Utilizadas

- Next.js 14
- React
- TypeScript
- Prisma
- SQLite
- Tailwind CSS
- Shadcn/ui
