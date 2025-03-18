import React, { useState, useMemo } from 'react';
import { Calendar, CheckCircle2, Clock, ListTodo, Plus, X, Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

interface Task {
  id: number;
  titre: string;
  complete: boolean;
  dateDebut: string;
  dateFin: string;
}

interface Phase {
  id: number;
  nom: string;
  dateDebut: string;
  dateFin: string;
  taches: Task[];
}

interface Project {
  id: number;
  nom: string;
  description: string;
  progression: number;
  dateLimite: string;
  phases: Phase[];
}

function GanttChart({ project }: { project: Project }) {
  const timelineData = useMemo(() => {
    if (!project.phases.length) return null;

    const allDates = project.phases.flatMap(phase => [
      new Date(phase.dateDebut).getTime(),
      new Date(phase.dateFin).getTime(),
      ...phase.taches.map(task => new Date(task.dateDebut).getTime()),
      ...phase.taches.map(task => new Date(task.dateFin).getTime())
    ]);

    const startDate = new Date(Math.min(...allDates));
    const endDate = new Date(Math.max(...allDates));
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    return {
      startDate,
      endDate,
      totalDays,
      getPositionPercentage: (date: string) => {
        const currentDate = new Date(date).getTime();
        return ((currentDate - startDate.getTime()) / (endDate.getTime() - startDate.getTime())) * 100;
      },
      getDurationPercentage: (start: string, end: string) => {
        const duration = new Date(end).getTime() - new Date(start).getTime();
        return (duration / (endDate.getTime() - startDate.getTime())) * 100;
      }
    };
  }, [project.phases]);

  if (!timelineData) return null;

  return (
    <div className="mt-8 bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-6">Diagramme de Gantt</h3>
      
      {/* Timeline header */}
      <div className="flex mb-4">
        <div className="w-1/4">
          <div className="font-medium text-gray-700">Phases / Tâches</div>
        </div>
        <div className="w-3/4 relative">
          <div className="absolute inset-0 flex justify-between px-2">
            <span className="text-sm text-gray-500">
              {timelineData.startDate.toLocaleDateString('fr-FR')}
            </span>
            <span className="text-sm text-gray-500">
              {timelineData.endDate.toLocaleDateString('fr-FR')}
            </span>
          </div>
        </div>
      </div>

      {/* Phases and tasks */}
      <div className="space-y-6">
        {project.phases.map(phase => (
          <div key={phase.id} className="space-y-2">
            {/* Phase bar */}
            <div className="flex items-center">
              <div className="w-1/4">
                <div className="font-medium text-gray-800">{phase.nom}</div>
              </div>
              <div className="w-3/4 h-6 bg-gray-100 rounded relative">
                <div
                  className="absolute h-full bg-indigo-200 rounded"
                  style={{
                    left: `${timelineData.getPositionPercentage(phase.dateDebut)}%`,
                    width: `${timelineData.getDurationPercentage(phase.dateDebut, phase.dateFin)}%`
                  }}
                />
              </div>
            </div>

            {/* Tasks bars */}
            {phase.taches.map(task => (
              <div key={task.id} className="flex items-center pl-4">
                <div className="w-1/4">
                  <div className="text-sm text-gray-600">{task.titre}</div>
                </div>
                <div className="w-3/4 h-4 bg-gray-100 rounded relative">
                  <div
                    className={`absolute h-full rounded ${task.complete ? 'bg-green-400' : 'bg-blue-400'}`}
                    style={{
                      left: `${timelineData.getPositionPercentage(task.dateDebut)}%`,
                      width: `${timelineData.getDurationPercentage(task.dateDebut, task.dateFin)}%`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function App() {
  const [projets, setProjets] = useState<Project[]>([
    {
      id: 1,
      nom: "Refonte Site E-commerce",
      description: "Modernisation complète de la plateforme de vente en ligne",
      progression: 65,
      dateLimite: "2024-04-15",
      phases: [
        {
          id: 1,
          nom: "Phase de Conception",
          dateDebut: "2024-01-01",
          dateFin: "2024-01-15",
          taches: [
            { id: 1, titre: "Maquettes UI/UX", complete: true, dateDebut: "2024-01-01", dateFin: "2024-01-07" },
            { id: 2, titre: "Validation du design", complete: true, dateDebut: "2024-01-08", dateFin: "2024-01-15" }
          ]
        },
        {
          id: 2,
          nom: "Phase de Développement",
          dateDebut: "2024-01-16",
          dateFin: "2024-03-15",
          taches: [
            { id: 3, titre: "Développement Frontend", complete: true, dateDebut: "2024-01-16", dateFin: "2024-02-15" },
            { id: 4, titre: "Intégration API", complete: false, dateDebut: "2024-02-16", dateFin: "2024-03-15" }
          ]
        }
      ]
    }
  ]);

  const [showNewProject, setShowNewProject] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [newProject, setNewProject] = useState({
    nom: '',
    description: '',
    dateLimite: ''
  });
  const [editMode, setEditMode] = useState(false);
  const [showNewPhase, setShowNewPhase] = useState(false);
  const [newPhase, setNewPhase] = useState({
    nom: '',
    dateDebut: '',
    dateFin: ''
  });
  const [newTask, setNewTask] = useState({
    titre: '',
    dateDebut: '',
    dateFin: '',
    phaseId: 0
  });
  const [editingPhaseId, setEditingPhaseId] = useState<number | null>(null);

  const handleAddProject = () => {
    if (newProject.nom && newProject.description && newProject.dateLimite) {
      setProjets([...projets, {
        id: projets.length + 1,
        ...newProject,
        progression: 0,
        phases: []
      }]);
      setShowNewProject(false);
      setNewProject({ nom: '', description: '', dateLimite: '' });
    }
  };

  const handleAddPhase = () => {
    if (selectedProject && newPhase.nom && newPhase.dateDebut && newPhase.dateFin) {
      const updatedProject = {
        ...selectedProject,
        phases: [...selectedProject.phases, {
          id: selectedProject.phases.length + 1,
          ...newPhase,
          taches: []
        }]
      };
      setProjets(projets.map(p => p.id === selectedProject.id ? updatedProject : p));
      setSelectedProject(updatedProject);
      setNewPhase({ nom: '', dateDebut: '', dateFin: '' });
      setShowNewPhase(false);
    }
  };

  const handleAddTask = (phaseId: number) => {
    if (selectedProject && newTask.titre && newTask.dateDebut && newTask.dateFin) {
      const updatedProject = {
        ...selectedProject,
        phases: selectedProject.phases.map(phase => {
          if (phase.id === phaseId) {
            return {
              ...phase,
              taches: [...phase.taches, {
                id: Math.max(0, ...phase.taches.map(t => t.id)) + 1,
                titre: newTask.titre,
                dateDebut: newTask.dateDebut,
                dateFin: newTask.dateFin,
                complete: false
              }]
            };
          }
          return phase;
        })
      };
      
      // Recalculate project progression
      const allTasks = updatedProject.phases.flatMap(p => p.taches);
      const progression = allTasks.length > 0
        ? Math.round((allTasks.filter(t => t.complete).length / allTasks.length) * 100)
        : 0;
      
      updatedProject.progression = progression;
      
      setProjets(projets.map(p => p.id === selectedProject.id ? updatedProject : p));
      setSelectedProject(updatedProject);
      setNewTask({ titre: '', dateDebut: '', dateFin: '', phaseId: 0 });
      setEditingPhaseId(null);
    }
  };

  const toggleTask = (projetId: number, phaseId: number, taskId: number) => {
    setProjets(projets.map(projet => {
      if (projet.id === projetId) {
        const updatedPhases = projet.phases.map(phase => {
          if (phase.id === phaseId) {
            const updatedTasks = phase.taches.map(task =>
              task.id === taskId ? { ...task, complete: !task.complete } : task
            );
            return { ...phase, taches: updatedTasks };
          }
          return phase;
        });
        
        // Recalculate project progression
        const allTasks = updatedPhases.flatMap(p => p.taches);
        const progression = allTasks.length > 0
          ? Math.round((allTasks.filter(t => t.complete).length / allTasks.length) * 100)
          : 0;
        
        const updatedProject = { ...projet, phases: updatedPhases, progression };
        if (selectedProject?.id === projetId) {
          setSelectedProject(updatedProject);
        }
        return updatedProject;
      }
      return projet;
    }));
  };

  const handleUpdateProject = () => {
    if (selectedProject) {
      setProjets(projets.map(p => p.id === selectedProject.id ? selectedProject : p));
      setEditMode(false);
    }
  };

  const handleDeleteTask = (phaseId: number, taskId: number) => {
    if (selectedProject) {
      const updatedProject = {
        ...selectedProject,
        phases: selectedProject.phases.map(phase => {
          if (phase.id === phaseId) {
            return {
              ...phase,
              taches: phase.taches.filter(t => t.id !== taskId)
            };
          }
          return phase;
        })
      };
      
      // Recalculate project progression
      const allTasks = updatedProject.phases.flatMap(p => p.taches);
      const progression = allTasks.length > 0
        ? Math.round((allTasks.filter(t => t.complete).length / allTasks.length) * 100)
        : 0;
      
      updatedProject.progression = progression;
      
      setProjets(projets.map(p => p.id === selectedProject.id ? updatedProject : p));
      setSelectedProject(updatedProject);
    }
  };

  const handleDeletePhase = (phaseId: number) => {
    if (selectedProject) {
      const updatedProject = {
        ...selectedProject,
        phases: selectedProject.phases.filter(p => p.id !== phaseId)
      };
      
      // Recalculate project progression
      const allTasks = updatedProject.phases.flatMap(p => p.taches);
      const progression = allTasks.length > 0
        ? Math.round((allTasks.filter(t => t.complete).length / allTasks.length) * 100)
        : 0;
      
      updatedProject.progression = progression;
      
      setProjets(projets.map(p => p.id === selectedProject.id ? updatedProject : p));
      setSelectedProject(updatedProject);
    }
  };

  const handleDeleteProject = (projectId: number) => {
    setProjets(projets.filter(p => p.id !== projectId));
    setSelectedProject(null);
  };

  const handleCloseProject = () => {
    setSelectedProject(null);
    setEditMode(false);
    setShowNewPhase(false);
    setEditingPhaseId(null);
    setNewPhase({ nom: '', dateDebut: '', dateFin: '' });
    setNewTask({ titre: '', dateDebut: '', dateFin: '', phaseId: 0 });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-indigo-900 mb-2">Suivi de Projets</h1>
          <p className="text-gray-600">Gérez vos projets web efficacement</p>
        </header>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projets.map(projet => (
            <div 
              key={projet.id} 
              className="bg-white rounded-xl shadow-lg p-6 transition-transform hover:scale-[1.02] cursor-pointer"
              onClick={() => setSelectedProject(projet)}
            >
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold text-gray-800">{projet.nom}</h2>
                <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                  {projet.progression}%
                </span>
              </div>
              
              <p className="text-gray-600 mb-4">{projet.description}</p>
              
              <div className="flex items-center text-sm text-gray-500 mb-4">
                <Calendar className="w-4 h-4 mr-2" />
                <span>Échéance: {new Date(projet.dateLimite).toLocaleDateString('fr-FR')}</span>
              </div>

              <div className="space-y-2">
                {projet.phases.map(phase => (
                  <div key={phase.id} className="border-l-2 border-indigo-200 pl-3">
                    <h3 className="text-sm font-medium text-gray-700">{phase.nom}</h3>
                    <div className="text-xs text-gray-500">
                      {new Date(phase.dateDebut).toLocaleDateString('fr-FR')} - {new Date(phase.dateFin).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <button
            onClick={() => setShowNewProject(true)}
            className="bg-white rounded-xl shadow-lg p-6 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-500 hover:text-indigo-600 hover:border-indigo-300 transition-colors"
          >
            <Plus className="w-12 h-12 mb-2" />
            <span>Nouveau Projet</span>
          </button>
        </div>

        {/* Modal Nouveau Projet */}
        {showNewProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Nouveau Projet</h3>
                <button
                  onClick={() => setShowNewProject(false)}
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
                    rows={3}
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
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowNewProject(false);
                      setNewProject({ nom: '', description: '', dateLimite: '' });
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleAddProject}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                  >
                    Créer le projet
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Détail Projet */}
        {selectedProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <div className="flex-1">
                  {editMode ? (
                    <input
                      type="text"
                      value={selectedProject.nom}
                      onChange={(e) => setSelectedProject({...selectedProject, nom: e.target.value})}
                      className="text-2xl font-bold w-full border-b border-gray-300 focus:border-indigo-500 focus:outline-none pb-1"
                    />
                  ) : (
                    <h2 className="text-2xl font-bold text-gray-800">{selectedProject.nom}</h2>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setEditMode(!editMode)}
                    className="p-2 text-gray-500 hover:text-indigo-600"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteProject(selectedProject.id)}
                    className="p-2 text-gray-500 hover:text-red-600"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleCloseProject}
                    className="p-2 text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {editMode ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={selectedProject.description}
                        onChange={(e) => setSelectedProject({...selectedProject, description: e.target.value})}
                        className="w-full rounded-md border border-gray-300 p-2"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date limite
                      </label>
                      <input
                        type="date"
                        value={selectedProject.dateLimite}
                        onChange={(e) => setSelectedProject({...selectedProject, dateLimite: e.target.value})}
                        className="w-full rounded-md border border-gray-300 p-2"
                      />
                    </div>
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => setEditMode(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleUpdateProject}
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                      >
                        Enregistrer les modifications
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-gray-600">{selectedProject.description}</p>
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>Échéance: {new Date(selectedProject.dateLimite).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </>
                )}

                {/* Gantt Chart */}
                <GanttChart project={selectedProject} />

                {/* Phases de développement */}
                <div className="mt-8">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Phases de développement</h3>
                    <button
                      onClick={() => setShowNewPhase(true)}
                      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                    >
                      + Nouvelle phase
                    </button>
                  </div>

                  {/* Formulaire nouvelle phase */}
                  {showNewPhase && (
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nom de la phase
                          </label>
                          <input
                            type="text"
                            value={newPhase.nom}
                            onChange={(e) => setNewPhase({...newPhase, nom: e.target.value})}
                            className="w-full rounded-md border border-gray-300 p-2"
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
                            className="w-full rounded-md border border-gray-300 p-2"
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
                            className="w-full rounded-md border border-gray-300 p-2"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => {
                            setShowNewPhase(false);
                            setNewPhase({ nom: '', dateDebut: '', dateFin: '' });
                          }}
                          className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
                        >
                          Annuler
                        </button>
                        <button
                          onClick={handleAddPhase}
                          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                        >
                          Créer la phase
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Liste des phases */}
                  <div className="space-y-4">
                    {selectedProject.phases.map(phase => (
                      <div key={phase.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium text-gray-800">{phase.nom}</h4>
                            <div className="text-sm text-gray-500">
                              {new Date(phase.dateDebut).toLocaleDateString('fr-FR')} - {new Date(phase.dateFin).toLocaleDateString('fr-FR')}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeletePhase(phase.id)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Tâches de la phase */}
                        <div className="mt-3 space-y-2">
                          {phase.taches.map(tache => (
                            <div
                              key={tache.id}
                              className="flex items-center justify-between p-2 hover:bg-gray-50 rounded group"
                            >
                              <div 
                                className="flex items-center flex-1 cursor-pointer"
                                onClick={() => toggleTask(selectedProject.id, phase.id, tache.id)}
                              >
                                <CheckCircle2 
                                  className={`w-5 h-5 mr-2 ${tache.complete ? 'text-green-500' : 'text-gray-300'}`}
                                />
                                <span className={tache.complete ? 'line-through text-gray-400' : 'text-gray-700'}>
                                  {tache.titre}
                                </span>
                                <span className="ml-2 text-xs text-gray-500">
                                  {new Date(tache.dateDebut).toLocaleDateString('fr-FR')} - {new Date(tache.dateFin).toLocaleDateString('fr-FR')}
                                </span>
                              </div>
                              <button
                                onClick={() => handleDeleteTask(phase.id, tache.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Nouvelle tâche */}
                        {editingPhaseId === phase.id ? (
                          <div className="mt-3 bg-gray-50 p-3 rounded-lg">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="col-span-2">
                                <input
                                  type="text"
                                  value={newTask.titre}
                                  onChange={(e) => setNewTask({...newTask, titre: e.target.value})}
                                  placeholder="Titre de la tâche"
                                  className="w-full rounded-md border border-gray-300 p-2"
                                />
                              </div>
                              <div>
                                <input
                                  type="date"
                                  value={newTask.dateDebut}
                                  onChange={(e) => setNewTask({...newTask, dateDebut: e.target.value})}
                                  className="w-full rounded-md border border-gray-300 p-2"
                                />
                              </div>
                              <div>
                                <input
                                  type="date"
                                  value={newTask.dateFin}
                                  onChange={(e) => setNewTask({...newTask, dateFin: e.target.value})}
                                  className="w-full rounded-md border border-gray-300 p-2"
                                />
                              </div>
                            </div>
                            <div className="flex justify-en
d space-x-2 mt-3">
                              <button
                                onClick={() => {
                                  setEditingPhaseId(null);
                                  setNewTask({ titre: '', dateDebut: '', dateFin: '', phaseId: 0 });
                                }}
                                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                              >
                                Annuler
                              </button>
                              <button
                                onClick={() => handleAddTask(phase.id)}
                                className="px-3 py-1 text-sm text-white bg-indigo-600 rounded hover:bg-indigo-700"
                              >
                                Ajouter la tâche
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingPhaseId(phase.id)}
                            className="mt-3 w-full px-4 py-2 text-sm font-medium text-indigo-600 border border-indigo-600 rounded-md hover:bg-indigo-50"
                          >
                            + Nouvelle tâche
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;