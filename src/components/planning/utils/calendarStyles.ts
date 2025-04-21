
export const addCalendarStyles = () => {
  const style = document.createElement('style');
  style.textContent = `
    .mission-event {
      opacity: 1 !important;
      font-weight: bold !important;
      border-width: 2px !important;
      box-shadow: 0 1px 3px rgba(0,0,0,0.2) !important;
    }
    
    .fc-timeline-slot {
      border-left: 1px solid rgba(0,0,0,0.1) !important;
    }
    
    .fc-event-main {
      padding: 2px 4px !important;
    }
    
    /* Styles spécifiques pour la vue trimestrielle */
    .fc-resourceTimelineQuarter-view .fc-timeline-slot {
      border-left: 1px solid rgba(0,0,0,0.15) !important;
    }
    
    .fc-resourceTimelineQuarter-view .fc-timeline-slot.fc-timeline-slot-label {
      font-size: 0.85em !important;
    }
    
    /* Style pour mettre en évidence les débuts de mois */
    .fc-timeline-slot.fc-day-sun:first-child,
    .fc-timeline-slot.fc-day-mon:first-child,
    .fc-timeline-slot.fc-day-1 {
      border-left: 2px solid rgba(0,0,0,0.3) !important;
    }
    
    /* Améliorer la visibilité des étiquettes de ressources */
    .fc-resource-area .fc-resource-cell {
      font-weight: bold !important;
      padding: 8px 4px !important;
    }
  `;
  document.head.appendChild(style);
  return () => {
    document.head.removeChild(style);
  };
};
