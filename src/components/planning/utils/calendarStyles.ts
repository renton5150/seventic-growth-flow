
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
  `;
  document.head.appendChild(style);
  return () => {
    document.head.removeChild(style);
  };
};
