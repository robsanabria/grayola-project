'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Layout, FileUp, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { LogoutButton } from '@/components/LogoutButton';
import { supabaseUrl, supabaseKey } from '@/lib/supabase';
import Image from 'next/image';

interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  designer_id: string;
  files?: string[];
}

export default function DesignerDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState("Proyectos");
  const supabase = createClientComponentClient({
    supabaseUrl,
    supabaseKey,
  });

  useEffect(() => {
    fetchAssignedProjects();
  }, []);

  const fetchAssignedProjects = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('No user found');

      const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .eq('designer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(projects || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Error al cargar los proyectos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (projectId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ status: newStatus })
        .eq('id', projectId);

      if (error) throw error;

      toast.success('Estado del proyecto actualizado');
      fetchAssignedProjects();
    } catch (error) {
      console.error('Error updating project status:', error);
      toast.error('Error al actualizar el estado del proyecto');
    }
  };

  const ProjectCard = ({ project }: { project: Project }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle>{project.title}</CardTitle>
          <CardDescription className="mt-2">{project.description}</CardDescription>
        </div>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
          project.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          project.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
          'bg-green-100 text-green-800'
        }`}>
          <Clock className="mr-2 h-4 w-4" />
          {project.status === 'pending' ? 'Pendiente' :
           project.status === 'in_progress' ? 'En progreso' :
           'Completado'}
        </span>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {project.files && project.files.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Archivos adjuntos:</p>
              <ul className="space-y-2">
                {project.files.map((filePath, index) => (
                  <li key={index} className="flex items-center justify-between text-sm bg-lime-50 p-2 rounded">
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
                      className="hover:bg-lime-100 hover:text-lime-700"
                    >
                      <FileUp className="h-4 w-4" />
                      Ver archivo
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            Creado el: {new Date(project.created_at).toLocaleDateString()}
          </p>
          <div className="flex space-x-2">
            {project.status !== 'completed' && (
              <Button
                variant="outline"
                onClick={() => handleUpdateStatus(project.id, 'completed')}
                className="hover:bg-lime-50 hover:text-lime-700"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Marcar como completado
              </Button>
            )}
            {project.status === 'pending' && (
              <Button
                variant="outline"
                onClick={() => handleUpdateStatus(project.id, 'in_progress')}
                className="hover:bg-lime-50 hover:text-lime-700"
              >
                Comenzar proyecto
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Panel de Diseñador</h1>
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
                  view === "Proyectos" 
                    ? "bg-lime-500 hover:bg-lime-600" 
                    : "bg-transparent hover:bg-lime-50 text-lime-700"
                }`}
                onClick={() => setView("Proyectos")}
              >
                <Layout className="mr-2 h-4 w-4" />
                Mis Proyectos
              </Button>
            </li>
          </ul>
        </nav>

        <main className="flex-1 p-8">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lime-500"></div>
            </div>
          ) : (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold mb-8">Proyectos Asignados</h2>
              <div className="grid gap-6">
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
                {projects.length === 0 && (
                  <Card>
                    <CardContent className="text-center py-8">
                      <p className="text-muted-foreground">No tienes proyectos asignados.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
} 