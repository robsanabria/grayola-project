# 🎨 Grayola Project Manager

[![Deploy en Vercel](https://img.shields.io/badge/Deploy-Vercel-000?logo=vercel)](https://grayola-challenge.vercel.app/login)
![Next.js](https://img.shields.io/badge/Next.js-14-blue)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

> Sistema de gestión de proyectos de diseño que permite a los clientes solicitar proyectos, a los project managers asignarlos a diseñadores, y a los diseñadores gestionarlos.

---

## 🚀 Funcionalidades principales

- ✅ Autenticación y autorización basada en roles (Cliente, Project Manager, Diseñador)
- ✅ Gestión de proyectos con estados (`Pendiente`, `En Progreso`, `Completado`)
- ✅ Asignación de diseñadores a proyectos
- ✅ Interfaz moderna y responsiva con Next.js 14 + Tailwind
- ✅ Integración con Supabase (auth, DB, storage)
- ✅ Despliegue automatizado en Vercel

---

## 🌐 Demo en producción

🔗 [grayola-challenge.vercel.app/login](https://grayola-challenge.vercel.app/login)

---

## 🛠️ Tecnologías Utilizadas

| Tecnología        | Rol                        |
|-------------------|----------------------------|
| **Next.js 14**    | Framework principal (SSR, routing) |
| **React 18**      | Librería de UI             |
| **TypeScript**    | Tipado estático y robustez |
| **Tailwind CSS**  | Estilos utilitarios        |
| **Shadcn/UI**     | Componentes UI accesibles  |
| **Supabase**      | Backend: DB + Auth + Storage |
| **Vercel**        | Despliegue continuo        |


## 🧪 Instalación local

bash
git clone https://github.com/robsanabria/grayola-project.git
cd grayola-project
npm install
# o
yarn install

Ejecutá el proyecto:

npm run dev
# o
yarn dev

Abre: http://localhost:3000


Tabla: profiles
	•	id (uuid, PK)
	•	role (client, project_manager, designer)
	•	points_balance, created_at, updated_at

📁 Tabla: projects
	•	id (uuid, PK)
	•	client_id, designer_id (FK)
	•	status (pending, in_progress, completed)
	•	title, description, points_cost, files, created_at, updated_at
