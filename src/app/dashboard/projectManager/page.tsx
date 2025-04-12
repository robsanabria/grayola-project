'use client';

import { useEffect, useState } from 'react';
import { createClientSupabaseClient } from '@/lib/supabase/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Clock, Pencil, Trash2, FileUp, Layout, Users, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { LogoutButton } from '@/components/LogoutButton';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

/**
 * Interfaz que define la estructura de un proyecto
 * @interface Project
 * @property {string} id - Identificador único del proyecto
 * @property {string} client_id - ID del cliente que creó el proyecto
 * @property {string | null} designer_id - ID del diseñador asignado (null si no está asignado)
 * @property {string} status - Estado actual del proyecto ('pending', 'in_progress', 'completed')
 * @property {number} points_cost - Costo en puntos del proyecto
 * @property {string} created_at - Fecha de creación
 * @property {string} updated_at - Fecha de última actualización
 * @property {string} title - Título del proyecto
 * @property {string} description - Descripción detallada del proyecto
 * @property {string[]} [files] - Array opcional de URLs de archivos adjuntos
 */
interface Project {
  id: string;
  client_id: string;
  designer_id: string | null;
  status: string;
  points_cost: number;
  created_at: string;
  updated_at: string;
  title: string;
  description: string;
  files?: string[];
}

/**
 * Interfaz que define la estructura de un diseñador
 * @interface Designer
 * @property {string} id - Identificador único del diseñador
 * @property {string} role - Rol del usuario ('designer')
 * @property {number} points_balance - Balance de puntos del diseñador
 * @property {string} created_at - Fecha de creación del perfil
 * @property {string} updated_at - Fecha de última actualización del perfil
 * @property {Project[]} [assigned_projects] - Proyectos asignados al diseñador
 */
interface Designer {
  id: string;
  role: string;
  points_balance: number;
  created_at: string;
  updated_at: string;
  assigned_projects?: Project[];
}

/**
 * Componente principal del Dashboard del Project Manager
 * Permite gestionar proyectos y asignarlos a diseñadores
 */
export default function ProjectManagerDashboard() {
  // Estados para manejar proyectos y diseñadores
  const [projects, setProjects] = useState<Project[]>([]);
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    points_cost: 0,
  });
  const [editProject, setEditProject] = useState({
    title: '',
    description: '',
    points_cost: 0,
    status: '',
  });
  const [view, setView] = useState<'projects' | 'designers'>('projects');
  const supabase = createClientSupabaseClient();
  const router = useRouter();

  // Efecto para cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([fetchProjects(), fetchDesigners()]);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  /**
   * Obtiene los proyectos de la base de datos
   * @returns {Promise<void>}
   */
  const fetchProjects = async () => {
    try {
      console.log('Fetching projects...');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('No session found');
        return;
      }
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Projects fetched:', data);
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Error al cargar los proyectos');
    }
  };

  /**
   * Obtiene los diseñadores y sus proyectos asignados
   * @returns {Promise<void>}
   */
  const fetchDesigners = async () => {
    try {
      console.log('Iniciando fetchDesigners...');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('No hay sesión activa al intentar obtener diseñadores');
        return;
      }
      
      // Obtener diseñadores
      const { data: designersData, error: designersError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'designer');

      if (designersError) throw designersError;

      // Para cada diseñador, obtener sus proyectos asignados
      const designersWithProjects = await Promise.all(
        (designersData || []).map(async (designer) => {
          const { data: assignedProjects } = await supabase
            .from('projects')
            .select('*')
            .eq('designer_id', designer.id);
          
          return {
            ...designer,
            assigned_projects: assignedProjects || []
          };
        })
      );

      setDesigners(designersWithProjects);
    } catch (error) {
      console.error('Error en fetchDesigners:', error);
      toast.error('Error al cargar los diseñadores');
    }
  };

  /**
   * Asigna un diseñador a un proyecto
   * @param {string} projectId - ID del proyecto
   * @param {string} designerId - ID del diseñador
   */
  const handleAssignDesigner = async (projectId: string, designerId: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ 
          designer_id: designerId,
          status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId);

      if (error) throw error;

      toast.success('Diseñador asignado correctamente');
      await Promise.all([fetchProjects(), fetchDesigners()]);
    } catch (error) {
      console.error('Error assigning designer:', error);
      toast.error('Error al asignar el diseñador');
    }
  };

  /**
   * Actualiza los detalles de un proyecto existente
   * @param {string} projectId - ID del proyecto a actualizar
   * @param {Partial<Project>} updates - Objeto con los campos a actualizar
   */
  const handleUpdateProject = async (projectId: string, updates: Partial<Project>) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId);

      if (error) throw error;

      toast.success('Proyecto actualizado correctamente');
      setIsEditModalOpen(false);
      fetchProjects();
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Error al actualizar el proyecto');
    }
  };

  /**
   * Elimina un proyecto de la base de datos
   * @param {string} projectId - ID del proyecto a eliminar
   */
  const handleDeleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      toast.success('Proyecto eliminado correctamente');
      setIsModalOpen(false);
      setCurrentProject(null);
      fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Error al eliminar el proyecto');
    }
  };

  /**
   * Actualiza el estado de un proyecto
   * @param {string} projectId - ID del proyecto
   * @param {string} newStatus - Nuevo estado ('pending', 'in_progress', 'completed')
   */
  const handleUpdateProjectStatus = async (projectId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ status: newStatus })
        .eq('id', projectId);

      if (error) throw error;

      toast.success('Estado del proyecto actualizado correctamente');
      fetchProjects();
    } catch (error) {
      console.error('Error updating project status:', error);
      toast.error('Error al actualizar el estado del proyecto');
    }
  };

  /**
   * Actualiza el rol de un usuario en la base de datos
   * @param {string} userId - ID del usuario
   * @param {string} newRole - Nuevo rol a asignar
   */
  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      console.log(`Updating user ${userId} role to ${newRole}...`);
      
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
      
      if (error) {
        console.error('Error updating user role:', error);
        throw error;
      }
      
      console.log('User role updated successfully');
      toast.success('Rol de usuario actualizado correctamente');
      fetchDesigners();
    } catch (error) {
      console.error('Error in updateUserRole:', error);
      toast.error('Error al actualizar el rol del usuario');
    }
  };

  /**
   * Componente que renderiza la tarjeta de un proyecto
   * @component
   * @param {Object} props - Propiedades del componente
   * @param {Project} props.project - Datos del proyecto a mostrar
   */
  const ProjectCard = ({ project }: { project: Project }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle>{project.title}</CardTitle>
          <CardDescription className="mt-2">
            {project.description}
            <div className="mt-2 text-sm text-muted-foreground">
              ID del Cliente: {project.client_id}
            </div>
          </CardDescription>
        </div>
        <Select
          value={project.status}
          onValueChange={(value) => handleUpdateProjectStatus(project.id, value)}
        >
          <SelectTrigger className="w-[180px] bg-white border-2">
            <SelectValue>
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  project.status === 'pending' ? 'bg-yellow-500' :
                  project.status === 'in_progress' ? 'bg-blue-500' :
                  'bg-green-500'
                }`} />
                {project.status === 'pending' ? 'Pendiente' :
                 project.status === 'in_progress' ? 'En progreso' :
                 'Completado'}
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending" className="flex items-center">
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2" />
                Pendiente
              </div>
            </SelectItem>
            <SelectItem value="in_progress" className="flex items-center">
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
                En progreso
              </div>
            </SelectItem>
            <SelectItem value="completed" className="flex items-center">
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                Completado
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 mr-4">
            <Select
              onValueChange={(value: string) => handleAssignDesigner(project.id, value)}
              defaultValue={project.designer_id || ''}
            >
              <SelectTrigger className="w-full bg-white border-2">
                <SelectValue placeholder="Asignar diseñador" />
              </SelectTrigger>
              <SelectContent>
                {designers.map((designer) => (
                  <SelectItem key={designer.id} value={designer.id}>
                    {designer.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="icon"
              className="hover:bg-red-50 hover:text-red-500 transition-colors"
              onClick={() => {
                setCurrentProject(project);
                setIsModalOpen(true);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {project.files && project.files.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Archivos adjuntos:</p>
            <ul className="space-y-2">
              {project.files.map((filePath, index) => (
                <li key={index} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                  <span className="truncate">{filePath.split('/').pop()}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      try {
                        const { data } = await supabase.storage
                          .from('projects')
                          .createSignedUrl(filePath, 3600);
                        
                        if (data?.signedUrl) {
                          window.open(data.signedUrl, '_blank');
                        }
                      } catch (error) {
                        console.error('Error getting signed URL:', error);
                      }
                    }}
                  >
                    <FileUp className="h-4 w-4" />
                    Ver archivo
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );

  /**
   * Componente que renderiza la tarjeta de un diseñador
   * @component
   * @param {Object} props - Propiedades del componente
   * @param {Designer} props.designer - Datos del diseñador a mostrar
   */
  const DesignerCard = ({ designer }: { designer: Designer }) => (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-xl">ID: {designer.id}</CardTitle>
        <CardDescription>
          Proyectos asignados: {designer.assigned_projects?.length || 0}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {designer.assigned_projects && designer.assigned_projects.length > 0 ? (
            designer.assigned_projects.map(project => (
              <div key={project.id} className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium">{project.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className={`px-2 py-1 rounded text-sm ${
                    project.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    project.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {project.status}
                  </span>
                  <span className="text-sm text-gray-500">
                    Creado: {new Date(project.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">
              No hay proyectos asignados
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Panel de Project Manager</h1>
        <LogoutButton />
      </div>

      <div className="flex min-h-[calc(100vh-8rem)]">
        <nav className="w-64 bg-white border-r border-gray-200 p-6">
          <div className="mb-8">
            <Image
              src="/images/Favicon.png"
              alt="Grayola Logo"
              width={80}
              height={80}
              className="mx-auto"
            />
          </div>
          <ul className="space-y-2">
            <li>
              <Button
                variant="default"
                className={`w-full justify-start ${
                  view === 'projects' ? "bg-lime-500 hover:bg-lime-600" : "bg-transparent hover:bg-lime-50 text-lime-700"
                }`}
                onClick={() => setView('projects')}
              >
                <Layout className="mr-2 h-4 w-4" />
                Proyectos
              </Button>
            </li>
            <li>
              <Button
                variant="default"
                className={`w-full justify-start ${
                  view === 'designers' ? "bg-lime-500 hover:bg-lime-600" : "bg-transparent hover:bg-lime-50 text-lime-700"
                }`}
                onClick={() => setView('designers')}
              >
                <Users className="mr-2 h-4 w-4" />
                Diseñadores
              </Button>
            </li>
          </ul>
        </nav>

        <main className="flex-1 p-8">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lime-500"></div>
            </div>
          ) : view === 'projects' ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mb-4">Listado de Proyectos</h2>
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
              {projects.length === 0 && (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-muted-foreground">No hay proyectos disponibles.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mb-4">Listado de Diseñadores</h2>
              {designers.map((designer) => (
                <DesignerCard key={designer.id} designer={designer} />
              ))}
              {designers.length === 0 && (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-muted-foreground">No hay diseñadores disponibles.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </main>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Proyecto</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este proyecto? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsModalOpen(false);
                setCurrentProject(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => currentProject && handleDeleteProject(currentProject.id)}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 