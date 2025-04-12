/**
 * Dashboard del Cliente
 * Este componente maneja la interfaz principal para los clientes, permitiendo:
 * - Crear nuevos proyectos de diseño
 * - Ver proyectos existentes
 * - Subir archivos relacionados con los proyectos
 * - Gestionar el balance de puntos
 */

"use client";

import { useState, FormEvent, ChangeEvent, useEffect } from "react";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, FileUp, Plus, Clock, CheckCircle, AlertCircle, Palette, Video, Image as ImageIcon, Brush, Layout, Film, Pencil, MonitorSmartphone, Coins, Badge, Upload, Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LogoutButton } from '@/components/LogoutButton';
import { toast } from 'sonner';

/**
 * Interfaz que define la estructura de un proyecto
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
 * Interfaz que define la estructura del perfil de usuario
 */
interface Profile {
  id: string;
  role: string;
  points_balance: number;
  created_at: string;
  updated_at: string;
}

/**
 * Opciones predefinidas de tipos de proyectos con sus costos en créditos
 */
const orderOptions = [
  { 
    name: "Diseño de marca", 
    credits: 10, 
    image: "/images/diseno-marca.png"
  },
  { 
    name: "Diseño de ilustración", 
    credits: 15, 
    image: "/images/diseno-ilustracion.png"
  },
  { 
    name: "Edición de video", 
    credits: 20, 
    image: "/images/edicion-video.png"
  }
];

/**
 * Componente principal del dashboard del cliente
 */
export default function ClientDashboard() {
  const router = useRouter();
  const supabase = createClientSupabaseClient();
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isNew, setIsNew] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [view, setView] = useState("Nuevos proyectos");
  const [projects, setProjects] = useState<Project[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('ClientDashboard mounted');
    checkSession();
  }, []);

  /**
   * Verifica la sesión del usuario y su rol al cargar el componente
   * Redirige al login si no hay sesión válida o si el rol no es 'client'
   */
  const checkSession = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      
      if (!session) {
        toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        router.push('/login');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        throw profileError;
      }

      if (!profile) {
        toast.error('No se encontró el perfil del usuario');
        router.push('/login');
        return;
      }

      if (profile.role !== 'client') {
        toast.error('Acceso no autorizado');
        router.push('/login');
        return;
      }

      setUserProfile(profile);
      await fetchProjects();
    } catch (error) {
      console.error("Session check error:", error);
      toast.error('Error al verificar la sesión');
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Obtiene el perfil del usuario actual desde Supabase
   * Actualiza el estado userProfile con la información obtenida
   */
  const fetchUserProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Sesión expirada');
        router.push('/login');
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        throw error;
      }

      if (!profile) {
        toast.error('No se encontró el perfil del usuario');
        return;
      }

      console.log('Profile fetched:', profile);
      setUserProfile(profile);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      toast.error('Error al cargar el perfil del usuario');
    }
  };

  /**
   * Maneja la selección del tipo de proyecto
   * @param order - Nombre del tipo de proyecto seleccionado
   */
  const handleOrderSelect = (order: string) => {
    setSelectedOrder(order);
  };

  /**
   * Reinicia el formulario de creación de proyecto a sus valores iniciales
   */
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setFiles([]);
    setSelectedOrder(null);
    setMessage("");
  };

  /**
   * Sube los archivos asociados a un proyecto a Supabase Storage
   * @param projectId - ID del proyecto al que se asociarán los archivos
   * @returns Array de URLs de los archivos subidos
   */
  const uploadFiles = async (projectId: string) => {
    if (!files.length) return;
    setIsUploading(true);
    const uploadedFiles: string[] = [];
    
    try {
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${projectId}/${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { data, error: uploadError } = await supabase.storage
          .from('projects')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Error uploading file:', uploadError);
          throw uploadError;
        }

        if (data) {
          uploadedFiles.push(data.path);
          console.log('File uploaded successfully:', data.path);
        }
      }

      // Actualizar el proyecto con las URLs de los archivos
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          files: uploadedFiles
        })
        .eq('id', projectId);

      if (updateError) {
        console.error('Error updating project with files:', updateError);
        throw updateError;
      }

    } catch (error) {
      console.error("Error in uploadFiles:", error);
      throw error;
    } finally {
      setIsUploading(false);
    }

    return uploadedFiles;
  };

  /**
   * Maneja la creación de un nuevo proyecto
   * Valida los campos, crea el proyecto en la base de datos y sube los archivos
   * @param e - Evento del formulario
   */
  const handleCreateProject = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setErrorMessage("Debes iniciar sesión para crear un proyecto");
        setShowErrorModal(true);
        return;
      }

      const orderType = orderOptions.find(opt => opt.name === selectedOrder);
      if (!orderType) {
        throw new Error("Tipo de proyecto inválido");
      }

      if (!userProfile || userProfile.points_balance < orderType.credits) {
        setErrorMessage("No tienes suficientes créditos para crear este proyecto");
        setShowErrorModal(true);
        return;
      }

      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert([
          { 
            client_id: user.id,
            title,
            description,
            status: 'pending',
            points_cost: orderType.credits
          }
        ])
        .select()
        .single();

      if (projectError) throw projectError;

      // Subir archivos si hay alguno
      if (files.length > 0) {
        await uploadFiles(project.id);
      }

      const newBalance = userProfile.points_balance - orderType.credits;
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ points_balance: newBalance })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setShowSuccessModal(true);
      resetForm();
      fetchProjects();
      fetchUserProfile();
      setTimeout(() => {
        setView("Nuevos proyectos");
      }, 500);
    } catch (error: any) {
      console.error("Error creating project:", error);
      setErrorMessage(error.message);
      setShowErrorModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Obtiene los proyectos del cliente desde la base de datos
   * Actualiza el estado projects con los proyectos obtenidos
   */
  const fetchProjects = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('client_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setProjects(data || []);
      }
    } catch (error: any) {
      console.error("Error fetching projects:", error);
    }
  };

  /**
   * Maneja la selección de archivos para subir
   * @param e - Evento de cambio del input de archivos
   */
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  /**
   * Cambia la vista actual del dashboard
   * @param newView - Nueva vista a mostrar ('Nuevos proyectos' o 'Mis proyectos')
   */
  const handleViewChange = (newView: string) => {
    setView(newView);
    if (newView === "Nuevos proyectos") {
      resetForm();
    }
  };

  /**
   * Componente que renderiza la tarjeta de un proyecto
   * @param project - Proyecto a mostrar
   */
  const ProjectCard = ({ project }: { project: Project }) => (
    <Card key={project.id}>
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
        <p className="text-sm text-muted-foreground mb-4">
          Creado el: {new Date(project.created_at).toLocaleDateString()}
        </p>
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

  return (
    <div className="min-h-screen bg-gray-50">
      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-lime-500" />
        </div>
      ) : userProfile ? (
        <div className="container mx-auto py-10">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold">Panel de Cliente</h1>
              <p className="text-gray-600 mt-2">
                Créditos disponibles: <span className="font-semibold text-lime-600">{userProfile.points_balance}</span>
              </p>
            </div>
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
                      view === "Nuevos proyectos" 
                        ? "bg-lime-500 hover:bg-lime-600" 
                        : "bg-transparent hover:bg-lime-50 text-lime-700"
                    }`}
                    onClick={() => handleViewChange("Nuevos proyectos")}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevos proyectos
                  </Button>
                </li>
                <li>
                  <Button
                    variant="default"
                    className={`w-full justify-start ${
                      view === "Proyectos" 
                        ? "bg-lime-500 hover:bg-lime-600" 
                        : "bg-transparent hover:bg-lime-50 text-lime-700"
                    }`}
                    onClick={() => handleViewChange("Proyectos")}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Mis proyectos
                  </Button>
                </li>
              </ul>
            </nav>

            <main className="flex-1 p-8">
              {message && (
                <div className={`p-4 mb-6 rounded-lg ${
                  message.includes("Error") 
                    ? "bg-destructive/15 text-destructive" 
                    : "bg-green-100 text-green-800"
                }`}>
                  {message.includes("Error") ? (
                    <div className="flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      {message}
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {message}
                    </div>
                  )}
                </div>
              )}

              {view === "Nuevos proyectos" && !selectedOrder && (
                <div>
                  <h2 className="text-3xl font-bold mb-8">Selecciona el tipo de proyecto</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {orderOptions.map((option) => (
                      <Card 
                        key={option.name}
                        className="hover:shadow-lg transition-shadow cursor-pointer overflow-hidden group"
                        onClick={() => handleOrderSelect(option.name)}
                      >
                        <div className="relative w-full h-56">
                          <Image
                            src={option.image}
                            alt={option.name}
                            fill
                            className="object-contain p-4 transition-transform group-hover:scale-105"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            priority
                          />
                        </div>
                        <CardHeader className="space-y-0 pb-4">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-xl">{option.name}</CardTitle>
                            <Badge className="bg-lime-100 text-lime-700 font-bold">
                              {option.credits} créditos
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <Button className="w-full bg-lime-500 hover:bg-lime-600">
                            <Plus className="mr-2 h-4 w-4" />
                            Seleccionar
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {view === "Proyectos" && (
                <div>
                  <div className="mb-8">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="p-3 bg-lime-100 rounded-full">
                              <Coins className="h-6 w-6 text-lime-700" />
                            </div>
                            <div>
                              <h3 className="text-lg font-medium">Tus Créditos Disponibles</h3>
                              <p className="text-3xl font-bold text-lime-600">
                                {userProfile?.points_balance || 0} créditos
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  <h2 className="text-3xl font-bold mb-8">Mis Proyectos</h2>
                  <div className="space-y-4">
                    {projects.map((project) => (
                      <ProjectCard key={project.id} project={project} />
                    ))}
                    {projects.length === 0 && (
                      <Card>
                        <CardContent className="text-center py-8">
                          <p className="text-muted-foreground">No tienes proyectos aún</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              )}

              {selectedOrder && (
                <Card className="max-w-2xl mx-auto">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Detalles del Proyecto</CardTitle>
                      <Button
                        variant="ghost"
                        onClick={() => setSelectedOrder(null)}
                        className="text-muted-foreground"
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCreateProject} className="space-y-6">
                      <div className="space-y-2">
                        <label htmlFor="title" className="text-sm font-medium">
                          Título del Proyecto
                        </label>
                        <Input
                          id="title"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="description" className="text-sm font-medium">
                          Descripción
                        </label>
                        <Textarea
                          id="description"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          rows={4}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="files" className="text-sm font-medium">
                          Adjuntar Material Audiovisual
                        </label>
                        <div className="flex items-center justify-center w-full">
                          <label
                            htmlFor="files"
                            className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                          >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <Upload className="w-8 h-8 mb-4 text-gray-500" />
                              <p className="mb-2 text-sm text-gray-500">
                                <span className="font-semibold">Click para subir</span> o arrastra y suelta
                              </p>
                              <p className="text-xs text-gray-500">
                                SVG, PNG, JPG or GIF (MAX. 800x400px)
                              </p>
                            </div>
                            <input
                              id="files"
                              type="file"
                              className="hidden"
                              multiple
                              onChange={handleFileChange}
                              accept="image/*,video/*"
                            />
                          </label>
                        </div>
                        {files.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium mb-2">Archivos seleccionados:</h4>
                            <ul className="space-y-2">
                              {Array.from(files).map((file, index) => (
                                <li key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                  <span className="text-sm truncate">{file.name}</span>
                                  <span className="text-xs text-gray-500">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full bg-lime-500 hover:bg-lime-600"
                        disabled={isUploading}
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Subiendo archivos...
                          </>
                        ) : (
                          <>
                            <Plus className="mr-2 h-4 w-4" />
                            Crear Proyecto
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}
            </main>
          </div>

          {/* Success Modal */}
          <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CheckCircle className="h-6 w-6 text-lime-500" />
                  ¡Proyecto creado con éxito!
                </DialogTitle>
                <DialogDescription>
                  Tu proyecto ha sido creado y será revisado por nuestro equipo. 
                  Puedes ver el estado de tu proyecto en la sección "Mis Proyectos".
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end">
                <Button
                  onClick={() => setShowSuccessModal(false)}
                  className="bg-lime-500 hover:bg-lime-600"
                >
                  Entendido
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Error Modal */}
          <Dialog open={showErrorModal} onOpenChange={setShowErrorModal}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-6 w-6" />
                  Error al crear el proyecto
                </DialogTitle>
                <DialogDescription>
                  {errorMessage || "Ha ocurrido un error al crear tu proyecto. Por favor, intenta nuevamente."}
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end">
                <Button
                  onClick={() => setShowErrorModal(false)}
                  variant="destructive"
                >
                  Cerrar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      ) : null}
    </div>
  );
} 