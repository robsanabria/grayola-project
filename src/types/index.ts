/**
 * Definición de tipos para la aplicación
 * 
 * Este archivo contiene todas las interfaces y tipos utilizados en la aplicación.
 * Es importante para mantener la consistencia de tipos en toda la aplicación.
 */

/**
 * Roles de usuario disponibles en la aplicación
 * 
 * - client: Puede crear proyectos y ver sus propios proyectos
 * - project_manager: Puede ver todos los proyectos, asignarlos a diseñadores, editarlos y eliminarlos
 * - designer: Puede ver los proyectos asignados, pero no puede editarlos ni eliminarlos
 */
export type UserRole = 'client' | 'project_manager' | 'designer'

/**
 * Interfaz que representa a un usuario en la aplicación
 * 
 * Esta interfaz se utiliza para tipar los datos de usuario que se obtienen de Supabase.
 */
export interface User {
  id: string
  email: string
  role: UserRole
  points_balance: number
  created_at: string
  updated_at: string
}

/**
 * Interfaz que representa a un proyecto en la aplicación
 * 
 * Esta interfaz se utiliza para tipar los datos de proyecto que se obtienen de Supabase.
 */
export interface Project {
  id: string
  title: string
  description: string
  created_at: string
  updated_at: string
  client_id: string
  designer_id: string | null
  status: 'pending' | 'in_progress' | 'completed'
  points_cost: number
}

/**
 * Interfaz que representa a un archivo asociado a un proyecto
 * 
 * Esta interfaz se utiliza para tipar los datos de archivos que se obtienen de Supabase.
 */
export interface ProjectFile {
  id: string
  project_id: string
  file_url: string
  file_name: string
  created_at: string
}

/**
 * Estados posibles de un proyecto
 * 
 * - pending: Proyecto creado pero no asignado a un diseñador
 * - in_progress: Proyecto asignado a un diseñador y en desarrollo
 * - completed: Proyecto completado por el diseñador
 */
export type ProjectStatus = 'pending' | 'in_progress' | 'completed'

/**
 * Interfaz para los datos del formulario de creación de proyectos
 * 
 * Esta interfaz se utiliza para tipar los datos que se envían al crear un nuevo proyecto.
 */
export interface ProjectFormData {
  title: string
  description: string
  points_cost: number
  files?: File[]
} 