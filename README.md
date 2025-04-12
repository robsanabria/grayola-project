# Grayola Project Manager

Sistema de gestión de proyectos de diseño que permite a los clientes solicitar proyectos, a los project managers asignarlos a diseñadores, y a los diseñadores gestionarlos.

## 🚀 Características

- Autenticación y autorización basada en roles (Cliente, Project Manager, Diseñador)
- Gestión de proyectos con estados (Pendiente, En Progreso, Completado)
- Sistema de asignación de diseñadores a proyectos
- Interfaz moderna y responsiva construida con Next.js 14 y Tailwind CSS
- Integración con Supabase para base de datos y autenticación

## 🛠️ Tecnologías Utilizadas

- **Frontend**: Next.js 14, React, TypeScript
- **Estilos**: Tailwind CSS, ShadcnUI
- **Backend**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **Almacenamiento**: Supabase Storage
- **Despliegue**: Vercel

## 📋 Prerrequisitos

- Node.js 18.x o superior
- npm o yarn
- Cuenta en Supabase
- Cuenta en Vercel (para despliegue)

## 🔧 Instalación Local

1. Clona el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/grayola-project.git
   cd grayola-project
   ```

2. Instala las dependencias:
   ```bash
   npm install
   # o
   yarn install
   ```

3. Configura las variables de entorno:
   Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
   ```

4. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   # o
   yarn dev
   ```

5. Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 🗄️ Estructura de la Base de Datos

### Tabla: profiles
- id (uuid, primary key)
- role (string) - 'client', 'project_manager', 'designer'
- points_balance (integer)
- created_at (timestamp)
- updated_at (timestamp)

### Tabla: projects
- id (uuid, primary key)
- client_id (uuid, foreign key)
- designer_id (uuid, foreign key, nullable)
- status (string) - 'pending', 'in_progress', 'completed'
- points_cost (integer)
- title (string)
- description (text)
- files (array)
- created_at (timestamp)
- updated_at (timestamp)

## 🚀 Despliegue en Vercel

1. Crea una cuenta en Vercel si aún no tienes una.

2. Desde la UI de Vercel:
   - Haz clic en "New Project"
   - Importa tu repositorio de GitHub
   - Configura las variables de entorno:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Haz clic en "Deploy"

3. Vercel desplegará automáticamente tu aplicación y te proporcionará una URL.

## 🎨 Diseño y UX

El diseño de la aplicación sigue los siguientes principios:

- **Simplicidad**: Interfaz limpia y fácil de usar
- **Consistencia**: Uso consistente de colores y componentes
- **Feedback**: Notificaciones claras para todas las acciones
- **Responsividad**: Diseño adaptable a diferentes tamaños de pantalla

## 🤝 Contribución

1. Haz un Fork del proyecto
2. Crea tu rama de características (`git checkout -b feature/AmazingFeature`)
3. Haz commit de tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Haz Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE.md](LICENSE.md) para más detalles.

## 👥 Autores

- **Tu Nombre** - *Trabajo Inicial* - [TuUsuario](https://github.com/tu-usuario)

## 🎉 Agradecimientos

- ShadcnUI por los componentes de UI
- Vercel por el hosting
- Supabase por la infraestructura backend
