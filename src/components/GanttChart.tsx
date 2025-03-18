import React from 'react';
import { addDays, differenceInDays, format, isWithinInterval, parseISO, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Task {
  id: string;
  titre: string;
  complete: boolean;
  dateDebut: string;
  dateFin: string;
}

interface Phase {
  id: string;
  nom: string;
  dateDebut: string;
  dateFin: string;
  taches: Task[];
}

interface Project {
  id: string;
  nom: string;
  description: string;
  progression: number;
  dateLimite: string;
  phases: Phase[];
}

interface GanttChartProps {
  project: Project;
}

const GanttChart: React.FC<GanttChartProps> = ({ project }) => {
  // Find project start and end dates
  const allDates = project.phases.flatMap(phase => [
    parseISO(phase.dateDebut),
    parseISO(phase.dateFin),
    ...phase.taches.flatMap(task => [parseISO(task.dateDebut), parseISO(task.dateFin)])
  ]);

  if (allDates.length === 0) {
    return (
      <div className="mt-6 bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Diagramme de Gantt</h3>
        <p className="text-gray-500 text-center">Aucune donnée à afficher</p>
      </div>
    );
  }

  const startDate = startOfDay(Math.min(...allDates.map(date => date.getTime())));
  const endDate = startOfDay(Math.max(...allDates.map(date => date.getTime())));
  const totalDays = differenceInDays(endDate, startDate) + 1;

  // Generate dates for the header
  const dates = Array.from({ length: totalDays }, (_, i) => addDays(startDate, i));

  const getBarStyles = (start: string, end: string) => {
    const startPos = (differenceInDays(parseISO(start), startDate) / totalDays) * 100;
    const width = (differenceInDays(parseISO(end), parseISO(start)) + 1) / totalDays * 100;
    return {
      left: `${startPos}%`,
      width: `${width}%`
    };
  };

  return (
    <div className="mt-6 bg-white rounded-lg shadow-md p-4 sm:p-6">
      <h3 className="text-lg font-semibold mb-4">Diagramme de Gantt</h3>
      
      <div className="relative overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Timeline header */}
          <div className="flex border-b mb-4">
            <div className="w-1/4 flex-shrink-0"></div>
            <div className="flex-grow flex">
              {dates.map((date, index) => (
                <div
                  key={index}
                  className="flex-grow text-center text-xs text-gray-600 pb-2"
                >
                  {format(date, 'dd MMM', { locale: fr })}
                </div>
              ))}
            </div>
          </div>

          {/* Phases and tasks */}
          <div className="space-y-2">
            {project.phases.map((phase) => (
              <React.Fragment key={phase.id}>
                {/* Phase bar */}
                <div className="flex items-center mb-2">
                  <div className="w-1/4 flex-shrink-0 pr-4">
                    <span className="font-medium text-gray-900 text-sm sm:text-base">{phase.nom}</span>
                  </div>
                  <div className="flex-grow relative h-6">
                    <div
                      className="absolute h-full bg-indigo-200 rounded"
                      style={getBarStyles(phase.dateDebut, phase.dateFin)}
                    ></div>
                  </div>
                </div>

                {/* Tasks */}
                {phase.taches.map((task) => (
                  <div key={task.id} className="flex items-center mb-2 pl-4">
                    <div className="w-1/4 flex-shrink-0 pr-4">
                      <span className="text-sm text-gray-600">{task.titre}</span>
                    </div>
                    <div className="flex-grow relative h-5">
                      <div
                        className={`absolute h-full ${
                          task.complete ? 'bg-green-500' : 'bg-blue-400'
                        } rounded`}
                        style={getBarStyles(task.dateDebut, task.dateFin)}
                      ></div>
                    </div>
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>

          {/* Today marker */}
          <div
            className="absolute top-0 bottom-0 w-px bg-red-500"
            style={{
              left: `${(differenceInDays(new Date(), startDate) / totalDays) * 100}%`
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default GanttChart;