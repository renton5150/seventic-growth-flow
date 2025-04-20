
import { Request } from "@/types/types";

export const sortRequests = (
  requests: Request[],
  sortColumn: string,
  sortDirection: "asc" | "desc",
  filters: {[key: string]: string[]},
  dateFilters: {[key: string]: any}
) => {
  let result = [...requests];

  // Appliquer les filtres
  Object.entries(filters).forEach(([column, values]) => {
    if (values && values.length > 0) {
      result = result.filter(request => {
        const value = request[column as keyof Request];
        return values.includes(String(value));
      });
    }
  });

  // Appliquer les filtres de date
  Object.entries(dateFilters).forEach(([field, filter]) => {
    if (!filter?.type) return;

    result = result.filter(request => {
      const requestDate = new Date(request[field as keyof Request] as string);
      
      switch (filter.type) {
        case 'equals':
          return requestDate.toDateString() === filter.values.date?.toDateString();
        case 'before':
          return requestDate < filter.values.date;
        case 'after':
          return requestDate > filter.values.date;
        default:
          return true;
      }
    });
  });

  // Trier les résultats
  result.sort((a, b) => {
    let comparison = 0;
    
    switch (sortColumn) {
      case "title":
        comparison = (a.title || "").localeCompare(b.title || "");
        break;
      case "missionName":
        comparison = (a.missionName || "").localeCompare(b.missionName || "");
        break;
      case "status":
        comparison = (a.status || "").localeCompare(b.status || "");
        break;
      case "dueDate":
        comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        break;
      case "type":
        comparison = (a.type || "").localeCompare(b.type || "");
        break;
      default:
        comparison = 0;
    }

    return sortDirection === "asc" ? comparison : -comparison;
  });

  return result;
};
