
import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Table,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Plus, FileText, Users } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { Mission } from "@/types/types";
import { getAllMissions, createMission } from "@/services/missionService";
import { useNavigate } from "react-router-dom";
import { RequestsTable } from "@/components/dashboard/RequestsTable";
import { toast } from "sonner";

// Schema for mission form
const missionSchema = z.object({
  name: z.string().min(2, {
    message: "Le nom de la mission doit avoir au moins 2 caractères.",
  }),
  client: z.string().min(2, {
    message: "Le nom du client doit avoir au moins 2 caractères.",
  }),
  description: z.string().optional(),
});

const Missions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [missions, setMissions] = useState<Mission[]>(getAllMissions());
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const form = useForm<z.infer<typeof missionSchema>>({
    resolver: zodResolver(missionSchema),
    defaultValues: {
      name: "",
      client: "",
      description: "",
    },
  });
  
  const onSubmit = (values: z.infer<typeof missionSchema>) => {
    try {
      const newMission = createMission({
        name: values.name,
        client: values.client, 
        description: values.description,
        sdrId: user?.id as string
      });
      
      setMissions(getAllMissions());
      setIsCreateModalOpen(false);
      form.reset();
      toast.success("Mission créée avec succès");
    } catch (error) {
      console.error("Erreur lors de la création de la mission:", error);
      toast.error("Erreur lors de la création de la mission");
    }
  };
  
  const formatDate = (date: Date) => {
    return format(new Date(date), "d MMM yyyy", { locale: fr });
  };
  
  const isAdmin = user?.role === "admin";
  const isSdr = user?.role === "sdr";
  
  // Filter missions based on user role
  const filteredMissions = isAdmin 
    ? missions
    : missions.filter(mission => mission.sdrId === user?.id);
  
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Missions</h1>
          {isSdr && (
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Nouvelle mission
            </Button>
          )}
        </div>
        
        {filteredMissions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Aucune mission trouvée</h3>
              {isSdr ? (
                <p className="text-muted-foreground text-center mt-2">
                  Vous n'avez pas encore de mission. Créez votre première mission pour commencer.
                </p>
              ) : (
                <p className="text-muted-foreground text-center mt-2">
                  Aucune mission n'est assignée à votre compte.
                </p>
              )}
              {isSdr && (
                <Button onClick={() => setIsCreateModalOpen(true)} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" /> Créer une mission
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Liste des missions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Client</TableHead>
                    {isAdmin && <TableHead>SDR</TableHead>}
                    <TableHead>Créée le</TableHead>
                    <TableHead>Demandes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMissions.map((mission) => (
                    <TableRow key={mission.id}>
                      <TableCell className="font-medium">{mission.name}</TableCell>
                      <TableCell>{mission.client}</TableCell>
                      {isAdmin && (
                        <TableCell>
                          <div className="flex items-center">
                            <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                            {mission.sdrName}
                          </div>
                        </TableCell>
                      )}
                      <TableCell>{formatDate(mission.createdAt)}</TableCell>
                      <TableCell>{mission.requests.length}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedMission(mission)}
                        >
                          Voir
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
        
        {/* Create mission dialog */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Créer une nouvelle mission</DialogTitle>
              <DialogDescription>
                Veuillez entrer les détails de la nouvelle mission.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom de la mission</FormLabel>
                      <FormControl>
                        <Input placeholder="Nom de la mission" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="client"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom du client</FormLabel>
                      <FormControl>
                        <Input placeholder="Nom du client" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (optionnel)</FormLabel>
                      <FormControl>
                        <Input placeholder="Description de la mission" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit">Créer</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        
        {/* Mission details dialog */}
        <Dialog open={!!selectedMission} onOpenChange={(open) => !open && setSelectedMission(null)}>
          {selectedMission && (
            <DialogContent className="sm:max-w-[800px]">
              <DialogHeader>
                <DialogTitle>Détails de la mission: {selectedMission.name}</DialogTitle>
                <DialogDescription>
                  Client: {selectedMission.client}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Date de création</p>
                    <p>{formatDate(selectedMission.createdAt)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">SDR responsable</p>
                    <p>{selectedMission.sdrName}</p>
                  </div>
                  {selectedMission.description && (
                    <div className="col-span-2 space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Description</p>
                      <p>{selectedMission.description}</p>
                    </div>
                  )}
                </div>
                
                <div className="pt-4 border-t">
                  <h3 className="text-lg font-medium mb-2">Demandes associées</h3>
                  {selectedMission.requests.length > 0 ? (
                    <RequestsTable requests={selectedMission.requests} missionView={true} />
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      Aucune demande n'a encore été créée pour cette mission.
                    </p>
                  )}
                </div>
                
                {isSdr && (
                  <div className="pt-4 flex justify-end">
                    <Button onClick={() => {
                      setSelectedMission(null);
                      navigate("/requests/email/new", { state: { missionId: selectedMission.id } });
                    }}>
                      <Plus className="mr-2 h-4 w-4" /> Nouvelle demande
                    </Button>
                  </div>
                )}
              </div>
            </DialogContent>
          )}
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Missions;
