import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle2, Clock, ListTodo, Plus, X, Edit2, Trash2, ChevronDown, ChevronUp, LogIn, LogOut, UserPlus } from 'lucide-react';
import { supabase, signIn, signUp, signOut } from './lib/supabase';
import GanttChart from './components/GanttChart';

interface Task {
  id: string;
  titre: string;
  complete: boolean;
  dateDebut: string;
  dateFin: string;
  phase_id: string;
}

interface Phase {
  id: string;
  nom: string;
  dateDebut: string;
  dateFin: string;
  budget: number;
  taches: Task[];
  project_id: string;
}

interface Project {
  id: string;
  nom: string;
  description: string;
  progression: number;
  dateLimite: string;
  budget: number;
  phases: Phase[];
}

function App() {
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | null>(null);
  const [authForm, setAuthForm] = useState({ email: '', password: '' });
  const [projets, setProjets] = useState<Project[]>([]);
  const [authError, setAuthError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showPhaseModal, setShowPhaseModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editMode, setEditMode] = useState<{ type: 'project' | 'phase' | 'task', id: string } | null>(null);
  
  const [newProject, setNewProject] = useState({
    nom: '',
    description: '',
    dateLimite: '',
    budget: 0
  });
  const [newPhase, setNewPhase] = useState({
    projectId: '',
    nom: '',
    dateDebut: '',
    dateFin: '',
    budget: 0
  });
  const [newTask, setNewTask] = useState({
    phaseId: '',
    titre: '',
    dateDebut: '',
    dateFin: ''
  });

  const handleDelete = async (type: 'project' | 'phase' | 'task', id: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer cet élément ?`)) return;

    const { error } = await supabase
      .from(type === 'project' ? 'projects' : type === 'phase' ? 'phases' : 'tasks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting ${type}:`, error);
      return;
    }

    fetchProjects();
  };

  const handleEdit = (type: 'project' | 'phase' | 'task', item: any) => {
    setEditMode({ type, id: item.id });
    if (type === 'project') {
      setNewProject({
        nom: item.nom,
        description: item.description || '',
        dateLimite: item.dateLimite,
        budget: item.budget || 0
      });
      setShowProjectModal(true);
    } else if (type === 'phase') {
      setNewPhase({
        projectId: item.project_id,
        nom: item.nom,
        dateDebut: item.dateDebut,
        dateFin: item.dateFin,
        budget: item.budget || 0
      });
      setShowPhaseModal(true);
    } else {
      setNewTask({
        phaseId: item.phase_id,
        titre: item.titre,
        dateDebut: item.dateDebut,
        dateFin: item.dateFin
      });
      setShowTaskModal(true);
    }
  };

  const fetchProjects = async () => {
    const { data: projects, error } = await supabase
      .from('projects')
      .select(`
        id,
        nom,
        description,
        progression,
        date_limite,
        budget,
        phases!fk_project (
          id,
          nom,
          date_debut,
          date_fin,
          budget,
          project_id,
          tasks (
            id,
            titre,
            complete,
            date_debut,
            date_fin,
            phase_id
          )
        )
      `);

    if (error) {
      console.error('Error fetching projects:', error);
      return;
    }

    if (projects) {
      const formattedProjects = projects.map(project => ({
        id: project.id,
        nom: project.nom,
        description: project.description,
        progression: project.progression,
        dateLimite: project.date_limite,
        budget: project.budget,
        phases: (project.phases || []).map(phase => ({
          id: phase.id,
          nom: phase.nom,
          dateDebut: phase.date_debut,
          dateFin: phase.date_fin,
          budget: phase.budget,
          project_id: phase.project_id,
          taches: (phase.tasks || []).map(task => ({
            id: task.id,
            titre: task.titre,
            complete: task.complete,
            dateDebut: task.date_debut,
            dateFin: task.date_fin,
            phase_id: task.phase_id
          }))
        }))
      }));
      setProjets(formattedProjects);
    }
  };

  const handleCreateProject = async () => {
    const { data, error } = await supabase
      .from('projects')
      .upsert([{
        ...(editMode?.type === 'project' ? { id: editMode.id } : {}),
        nom: newProject.nom,
        description: newProject.description,
        date_limite: newProject.dateLimite,
        budget: newProject.budget,
        user_id: user.id
      }])
      .select();

    if (error) {
      console.error('Error creating/updating project:', error);
      return;
    }

    setShowProjectModal(false);
    setNewProject({ nom: '', description: '', dateLimite: '', budget: 0 });
    setEditMode(null);
    fetchProjects();
  };

  const handleCreatePhase = async () => {
    const { data, error } = await supabase
      .from('phases')
      .upsert([{
        ...(editMode?.type === 'phase' ? { id: editMode.id } : {}),
        project_id: newPhase.projectId,
        nom: newPhase.nom,
        date_debut: newPhase.dateDebut,
        date_fin: newPhase.dateFin,
        budget: newPhase.budget
      }])
      .select();

    if (error) {
      console.error('Error creating/updating phase:', error);
      return;
    }

    setShowPhaseModal(false);
    setNewPhase({ projectId: '', nom: '', dateDebut: '', dateFin: '', budget: 0 });
    setEditMode(null);
    fetchProjects();
  };

  const handleCreateTask = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .upsert([{
        ...(editMode?.type === 'task' ? { id: editMode.id } : {}),
        phase_id: newTask.phaseId,
        titre: newTask.titre,
        date_debut: newTask.dateDebut,
        date_fin: newTask.dateFin,
        complete: false
      }])
      .select();

    if (error) {
      console.error('Error creating/updating task:', error);
      return;
    }

    setShowTaskModal(false);
    setNewTask({ phaseId: '', titre: '', dateDebut: '', dateFin: '' });
    setEditMode(null);
    fetchProjects();
  };

  const handleAuth = async (mode: 'signin' | 'signup') => {
    setAuthError(null);
    const { email, password } = authForm;
    
    try {
      const { error } = await (mode === 'signin' ? signIn(email, password) : signUp(email, password));
      
      if (error) {
        console.error(`Error during ${mode}:`, error);
        setAuthError(error.message);
        return;
      }
      
      setAuthMode(null);
      setAuthForm({ email: '', password: '' });
    } catch (error) {
      console.error(`Error during ${mode}:`, error);
      setAuthError('Une erreur est survenue lors de l\'authentification');
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchProjects();
    } else {
      setProjets([]);
    }
  }, [user]);

  const formatBudget = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-12 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-indigo-900 mb-2">Suivi de Projets</h1>
            <p className="text-gray-600">Gérez vos projets web efficacement</p>
          </div>
          
          {user ? (
            <button
              onClick={() => signOut()}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={() => setAuthMode('signin')}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Connexion
              </button>
              <button
                onClick={() => setAuthMode('signup')}
                className="flex items-center px-4 py-2 text-sm font-medium border border-indigo-600 text-indigo-600 rounded-md hover:bg-indigo-50"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Inscription
              </button>
            </div>
          )}
        </header>

        {authMode && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">
                  {authMode === 'signin' ? 'Connexion' : 'Inscription'}
                </h3>
                <button
                  onClick={() => {
                    setAuthMode(null);
                    setAuthError(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={authForm.email}
                    onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
                    className="w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mot de passe
                  </label>
                  <input
                    type="password"
                    value={authForm.password}
                    onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                    className="w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2"
                  />
                </div>
                {authError && (
                  <div className="text-red-600 text-sm">
                    {authError}
                  </div>
                )}
                <button
                  onClick={() => handleAuth(authMode)}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                >
                  {authMode === 'signin' ? 'Se connecter' : 'S\'inscrire'}
                </button>
              </div>
            </div>
          </div>
        )}

        {user ? (
          <div className="mt-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Mes Projets</h2>
              <button
                onClick={() => {
                  setEditMode(null);
                  setNewProject({ nom: '', description: '', dateLimite: '', budget: 0 });
                  setShowProjectModal(true);
                }}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouveau Projet
              </button>
            </div>

            {projets.length === 0 ? (
              <div className="text-center py-12">
                <h2 className="text-xl text-gray-600">Aucun projet pour le moment</h2>
                <p className="text-gray-500 mt-2">Commencez par créer votre premier projet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {projets.map(projet => (
                  <div key={projet.id} className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{projet.nom}</h3>
                        <p className="text-gray-600 mt-1">{projet.description}</p>
                        <p className="text-gray-600 mt-2">Budget: {formatBudget(projet.budget)}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit('project', projet)}
                          className="text-indigo-600 hover:text-indigo-800"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete('project', projet.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setSelectedProject(selectedProject === projet.id ? null : projet.id)}
                          className="text-indigo-600 hover:text-indigo-800"
                        >
                          {selectedProject === projet.id ? (
                            <ChevronUp className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setEditMode(null);
                            setNewPhase({ ...newPhase, projectId: projet.id });
                            setShowPhaseModal(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-800"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                        <span>Progression</span>
                        <span>{projet.progression}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-indigo-600 rounded-full h-2"
                          style={{ width: `${projet.progression}%` }}
                        />
                      </div>
                    </div>

                    {selectedProject === projet.id && (
                      <>
                        <GanttChart project={projet} />

                        {projet.phases.map(phase => (
                          <div key={phase.id} className="mt-4 border-t pt-4">
                            <div className="flex justify-between items-center mb-2">
                              <div>
                                <h4 className="font-medium text-gray-900">{phase.nom}</h4>
                                <p className="text-sm text-gray-600">Budget: {formatBudget(phase.budget)}</p>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEdit('phase', phase)}
                                  className="text-indigo-600 hover:text-indigo-800"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete('phase', phase.id)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setEditMode(null);
                                    setNewTask({ ...newTask, phaseId: phase.id });
                                    setShowTaskModal(true);
                                  }}
                                  className="text-indigo-600 hover:text-indigo-800"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            {phase.taches.map(task => (
                              <div key={task.id} className="flex items-center justify-between mt-2">
                                <div className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={task.complete}
                                    onChange={async () => {
                                      const { error } = await supabase
                                        .from('tasks')
                                        .update({ complete: !task.complete })
                                        .eq('id', task.id);
                                      if (!error) fetchProjects();
                                    }}
                                    className="h-4 w-4 text-indigo-600 rounded border-gray-300"
                                  />
                                  <span className={`ml-2 text-sm ${task.complete ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                                    {task.titre}
                                  </span>
                                </div>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleEdit('task', task)}
                                    className="text-indigo-600 hover:text-indigo-800"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete('task', task.id)}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}

            {showProjectModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-xl p-6 w-full max-w-md">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">
                      {editMode?.type === 'project' ? 'Modifier le projet' : 'Nouveau Projet'}
                    </h3>
                    <button
                      onClick={() => {
                        setShowProjectModal(false);
                        setEditMode(null);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom du projet
                      </label>
                      <input
                        type="text"
                        value={newProject.nom}
                        onChange={(e) => setNewProject({...newProject, nom: e.target.value})}
                        className="w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={newProject.description}
                        onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                        className="w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Budget (€)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={newProject.budget}
                        onChange={(e) => setNewProject({...newProject, budget: parseFloat(e.target.value) || 0})}
                        className="w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date limite
                      </label>
                      <input
                        type="date"
                        value={newProject.dateLimite}
                        onChange={(e) => setNewProject({...newProject, dateLimite: e.target.value})}
                        className="w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2"
                      />
                    </div>
                    <button
                      onClick={handleCreateProject}
                      className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                    >
                      {editMode?.type === 'project' ? 'Modifier' : 'Créer le projet'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showPhaseModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-xl p-6 w-full max-w-md">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">
                      {editMode?.type === 'phase' ? 'Modifier la phase' : 'Nouvelle Phase'}
                    </h3>
                    <button
                      onClick={() => {
                        setShowPhaseModal(false);
                        setEditMode(null);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom de la phase
                      </label>
                      <input
                        type="text"
                        value={newPhase.nom}
                        onChange={(e) => setNewPhase({...newPhase, nom: e.target.value})}
                        className="w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Budget (€)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={newPhase.budget}
                        onChange={(e) => setNewPhase({...newPhase, budget: parseFloat(e.target.value) || 0})}
                        className="w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date de début
                      </label>
                      <input
                        type="date"
                        value={newPhase.dateDebut}
                        onChange={(e) => setNewPhase({...newPhase, dateDebut: e.target.value})}
                        className="w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date de fin
                      </label>
                      <input
                        type="date"
                        value={newPhase.dateFin}
                        onChange={(e) => setNewPhase({...newPhase, dateFin: e.target.value})}
                        className="w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2"
                      />
                    </div>
                    <button
                      onClick={handleCreatePhase}
                      className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                    >
                      {editMode?.type === 'phase' ? 'Modifier' : 'Créer la phase'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showTaskModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-xl p-6 w-full max-w-md">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">
                      {editMode?.type === 'task' ? 'Modifier la tâche' : 'Nouvelle Tâche'}
                    </h3>
                    <button
                      onClick={() => {
                        setShowTaskModal(false);
                        setEditMode(null);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Titre de la tâche
                      </label>
                      <input
                        type="text"
                        value={newTask.titre}
                        onChange={(e) => setNewTask({...newTask, titre: e.target.value})}
                        className="w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date de début
                      </label>
                      <input
                        type="date"
                        value={newTask.dateDebut}
                        onChange={(e) => setNewTask({...newTask, dateDebut: e.target.value})}
                        className="w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date de fin
                      </label>
                      <input
                        type="date"
                        value={newTask.dateFin}
                        onChange={(e) => setNewTask({...newTask, dateFin: e.target.value})}
                        className="w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2"
                      />
                    </div>
                    <button
                      onClick={handleCreateTask}
                      className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                    >
                      {editMode?.type === 'task' ? 'Modifier' : 'Créer la tâche'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl text-gray-600">
              Connectez-vous pour gérer vos projets
            </h2>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;