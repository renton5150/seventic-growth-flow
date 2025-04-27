
import React from 'react';
import { Request } from '@/types/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface RequestTimelineProps {
  request: Request;
}

export const RequestTimeline: React.FC<RequestTimelineProps> = ({ request }) => {
  const formatDate = (dateString: string | Date | undefined) => {
    if (!dateString) return 'Date inconnue';
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return format(date, 'dd MMMM yyyy à HH:mm', { locale: fr });
  };

  // Build a simple timeline based on available dates
  const timelineEvents = [
    { 
      label: 'Création', 
      date: request.created_at || request.createdAt,
      by: request.created_by_name || 'Utilisateur'
    },
    { 
      label: 'Date limite', 
      date: request.due_date || request.dueDate,
      future: true
    },
    { 
      label: 'Dernière mise à jour', 
      date: request.last_updated || request.lastUpdated,
      by: request.assigned_to_name || request.assignedToName
    },
  ].filter(event => event.date);

  return (
    <div className="space-y-8">
      <div className="relative">
        {timelineEvents.map((event, index) => (
          <div key={index} className="mb-10 relative">
            <div className="flex items-center">
              <div className="flex flex-col items-center mr-4">
                <div className={`rounded-full h-4 w-4 ${event.future ? 'bg-gray-300' : 'bg-blue-500'}`}></div>
                {index < timelineEvents.length - 1 && (
                  <div className="h-14 w-0.5 bg-gray-200"></div>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500">{formatDate(event.date)}</p>
                <h3 className="text-lg font-medium">{event.label}</h3>
                {event.by && <p className="text-sm text-gray-600">Par: {event.by}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {request.comments && request.comments.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-medium mb-4">Commentaires</h3>
          <div className="space-y-4">
            {request.comments.map((comment, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex justify-between">
                  <p className="font-medium">{comment.userName || 'Utilisateur'}</p>
                  <p className="text-sm text-gray-500">
                    {formatDate(comment.date)}
                  </p>
                </div>
                <p className="mt-2">{comment.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
