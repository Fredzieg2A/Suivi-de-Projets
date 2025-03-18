import React, { useState } from 'react';
import { Calendar, CheckCircle2, Clock, ListTodo, Plus } from 'lucide-react';

interface Project {
  id: number;
  nom: string;
  description: string;
  progression: number;
  dateLimite: string;
  taches: Task[];
}

interface Task {
  id: number;
  titre: string;
  complete: boolean;
}

function App() {
  const [projets, setProjets] = useState<Project[]>([
    {
      id: 1,
      nom: "Refonte Site E-commerce",
      description: "Modernisation complète de la plateforme de vente en ligne",
      progression: 65,
      dateLimite: "2024-04-15",
      taches: [
        { id: 1, titre: "Maquettes UI/UX", complete: true },
        { id: 2, titre: "Développement Frontend", complete: true },
        { id: 3, titre: "Intégration API", complete: false },
      ]
    }
  ]);

  const [showNewProject, setShowNewProject] = useState(false);
  const [newProject, setNewProject] = useState({
    nom: '',
    description: '',
    dateLimite: ''
  });

  const handleAddProject = () => {
    if (newProject.nom && newProject.description && newProject.dateLimite) {
      setProjets([...projets, {
        id: projets.length + 1,
        ...newProject,
        progression: 0,
        taches: []
      }]);
      setShowNewProject(false);
      setNewProject({ nom: '', description: '', dateLimite: '' });
    }
  };

  const toggleTask = (projetId: number, taskId: number) => {
    setProjets(projets.map(projet => {
      if (projet.id === projetId) {
        const newTaches = projet.taches.map(tache => 
          tache.id === taskId ? { ...tache, complete: !tache.complete } : tache
        );
        const progression = Math.round((newTaches.filter(t => t.complete).length / newTaches.length) * 100);
        return { ...projet, taches: newTaches, progression };
      }
      return projet;
    }));
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
            <div key={projet.id} className="bg-white rounded-xl shadow-lg p-6 transition-transform hover:scale-[1.02]">
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
                {projet.taches.map(tache => (
                  <div
                    key={tache.id}
                    className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                    onClick={() => toggleTask(projet.id, tache.id)}
                  >
                    <CheckCircle2 
                      className={`w-5 h-5 mr-2 ${tache.complete ? 'text-green-500' : 'text-gray-300'}`}
                    />
                    <span className={tache.complete ? 'line-through text-gray-400' : 'text-gray-700'}>
                      {tache.titre}
                    </span>
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

        {showNewProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-xl font-semibold mb-4">Nouveau Projet</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du projet
                  </label>
                  <input
                    type="text"
                    value={newProject.nom}
                    onChange={(e) => setNewProject({...newProject, nom: e.target.value})}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newProject.description}
                    onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowNewProject(false)}
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
      </div>
    </div>
  );
}

export default App;