
import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Calendar } from "@/components/ui/calendar";
import { useAuth } from "@/contexts/AuthContext";
import { getAllRequests } from "@/services/requestService";
import { getMissionsByUserId } from "@/services/missionService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { format, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Calendar as CalendarIcon, Info } from "lucide-react";

const CalendarPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(new Date());
  
  const requests = getAllRequests();
  const missions = user ? getMissionsByUserId(user.id) : [];
  
  // Filter requests based on user role and selected day
  const filteredRequests = requests.filter(request => {
    // First filter by user role
    const isSdrRequest = user?.role === "sdr" && missions
      .map(mission => mission.id)
      .includes(request.missionId);
      
    const isGrowthRequest = user?.role === "growth";
    const isAdminRequest = user?.role === "admin";
    
    // Then filter by selected date if we have one
    const isSameDate = selectedDay 
      ? isSameDay(new Date(request.dueDate), selectedDay)
      : false;
      
    return isSameDate && (isSdrRequest || isGrowthRequest || isAdminRequest);
  });
  
  // Count requests by day for highlighting calendar
  const requestsByDate = requests.reduce((acc, request) => {
    const dateStr = format(new Date(request.dueDate), "yyyy-MM-dd");
    
    // Check if this user should see this request
    const isUserRequest = user?.role === "sdr" 
      ? missions.map(m => m.id).includes(request.missionId)
      : true; // Admin and Growth see all
      
    if (isUserRequest) {
      acc[dateStr] = (acc[dateStr] || 0) + 1;
    }
    
    return acc;
  }, {} as Record<string, number>);
  
  const handleDaySelect = (day: Date | undefined) => {
    setSelectedDay(day);
  };
  
  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Calendrier des demandes</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Calendrier</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDay}
                onSelect={handleDaySelect}
                locale={fr}
                className="pointer-events-auto"
                modifiers={{
                  highlighted: (date) => {
                    const dateStr = format(date, "yyyy-MM-dd");
                    return !!requestsByDate[dateStr];
                  }
                }}
                modifiersClassNames={{
                  highlighted: "bg-seventic-100 text-seventic-800 font-bold"
                }}
              />
            </CardContent>
          </Card>
          
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                {selectedDay ? (
                  <>
                    <CalendarIcon className="mr-2 h-5 w-5" />
                    Demandes du {format(selectedDay, "d MMMM yyyy", { locale: fr })}
                  </>
                ) : (
                  <>
                    <Info className="mr-2 h-5 w-5" />
                    Sélectionnez une date pour voir les demandes
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredRequests.length > 0 ? (
                <div className="space-y-4">
                  {filteredRequests.map((request) => (
                    <div 
                      key={request.id} 
                      className="flex justify-between items-center p-3 border rounded-md hover:bg-muted cursor-pointer"
                      onClick={() => navigate(`/requests/${request.type}/${request.id}`)}
                    >
                      <div>
                        <h3 className="font-medium">{request.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {request.type === "email" ? "Campagne Email" : 
                           request.type === "database" ? "Base de données" : 
                           "Scraping LinkedIn"}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={request.status === "completed" ? "outline" : "default"}>
                          {request.status === "pending" ? "En attente" : 
                           request.status === "inprogress" ? "En cours" : 
                           "Terminé"}
                        </Badge>
                        <Button variant="ghost" size="sm" onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/requests/${request.type}/${request.id}`);
                        }}>
                          Voir
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : selectedDay ? (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Aucune demande</AlertTitle>
                  <AlertDescription>
                    Il n'y a pas de demandes prévues pour cette date.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Sélectionnez une date</AlertTitle>
                  <AlertDescription>
                    Choisissez une date dans le calendrier pour voir les demandes correspondantes.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default CalendarPage;
