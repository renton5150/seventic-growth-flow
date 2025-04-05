import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { getAllRequests, updateRequestStatus, updateRequest } from "@/services/requestService";
import { Request, RequestStatus } from "@/types/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Mail,
  Database as DatabaseIcon,
  User,
  Users,
  Clock,
  AlertCircle,
  CheckCircle,
  FileCheck,
  ArrowRightLeft,
  Pencil,
} from "lucide-react";
import { mockData } from "@/data/mockData";
import { getUserById } from "@/data/users";

const emailCompletionSchema = z.object({
  platform: z.enum(["Acelmail", "Bevo", "Postyman", "Direct IQ", "Mindbaz"]),
  sent: z.coerce.number().min(0),
  opened: z.coerce.number().min(0),
  clicked: z.coerce.number().min(0),
  bounced: z.coerce.number().min(0),
});

const databaseCompletionSchema = z.object({
  contactsCreated: z.coerce.number().min(0),
});

const linkedinCompletionSchema = z.object({
  profilesScraped: z.coerce.number().min(0),
  resultFileUrl: z.string().optional(),
});

const GrowthDashboard = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [activeTab, setActiveTab] = useState<string>("pending");
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [isCompletionDialogOpen, setIsCompletionDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  const emailForm = useForm<z.infer<typeof emailCompletionSchema>>({
    resolver: zodResolver(emailCompletionSchema),
    defaultValues: {
      platform: "Acelmail",
      sent: 0,
      opened: 0,
      clicked: 0,
      bounced: 0,
    },
  });
  
  const databaseForm = useForm<z.infer<typeof databaseCompletionSchema>>({
    resolver: zodResolver(databaseCompletionSchema),
    defaultValues: {
      contactsCreated: 0,
    },
  });
  
  const linkedinForm = useForm<z.infer<typeof linkedinCompletionSchema>>({
    resolver: zodResolver(linkedinCompletionSchema),
    defaultValues: {
      profilesScraped: 0,
      resultFileUrl: "",
    },
  });
  
  const editForm = useForm<{
    title: string;
    dueDate: string;
    status: RequestStatus;
  }>({
    defaultValues: {
      title: "",
      dueDate: "",
      status: "pending"
    },
  });
  
  useEffect(() => {
    if (user?.role === "growth" || user?.role === "admin") {
      const allRequests = getAllRequests();
      
      const requestsWithSdrNames = allRequests.map(request => {
        const mission = mockData.missions.find(m => m.id === request.missionId);
        if (mission) {
          const sdr = getUserById(mission.sdrId);
          return {
            ...request,
            sdrName: sdr?.name || "Inconnu"
          };
        }
        return request;
      });
      
      setRequests(requestsWithSdrNames);
    }
  }, [user]);
  
  const filteredRequests = requests.filter(request => {
    if (activeTab === "all") return true;
    if (activeTab === "pending") return request.status === "pending";
    if (activeTab === "inprogress") return request.status === "inprogress";
    if (activeTab === "completed") return request.status === "completed";
    if (activeTab === "email") return request.type === "email";
    if (activeTab === "database") return request.type === "database";
    if (activeTab === "linkedin") return request.type === "linkedin";
    return false;
  });
  
  const handleStartRequest = (request: Request) => {
    try {
      const updatedRequest = updateRequestStatus(request.id, "inprogress");
      if (updatedRequest) {
        refreshRequests();
        toast.success("La demande a été mise en cours de traitement");
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la demande:", error);
      toast.error("Erreur lors de la mise à jour de la demande");
    }
  };
  
  const refreshRequests = () => {
    const allRequests = getAllRequests();
    
    const requestsWithSdrNames = allRequests.map(request => {
      const mission = mockData.missions.find(m => m.id === request.missionId);
      if (mission) {
        const sdr = getUserById(mission.sdrId);
        return {
          ...request,
          sdrName: sdr?.name || "Inconnu"
        };
      }
      return request;
    });
    
    setRequests(requestsWithSdrNames);
  };
  
  const handleOpenEditDialog = (request: Request) => {
    setSelectedRequest(request);
    setIsEditDialogOpen(true);
    
    const dueDate = new Date(request.dueDate);
    const formattedDate = dueDate.toISOString().split('T')[0];
    
    editForm.reset({
      title: request.title,
      dueDate: formattedDate,
      status: request.status
    });
  };
  
  const handleOpenCompletionDialog = (request: Request) => {
    setSelectedRequest(request);
    setIsCompletionDialogOpen(true);
    
    if (request.type === "email") {
      emailForm.reset({
        platform: "Acelmail",
        sent: 0,
        opened: 0,
        clicked: 0,
        bounced: 0
      });
    } else if (request.type === "database") {
      databaseForm.reset({
        contactsCreated: 0
      });
    } else if (request.type === "linkedin") {
      linkedinForm.reset({
        profilesScraped: 0,
        resultFileUrl: ""
      });
    }
  };
  
  const handleSaveEdit = (data: { title: string; dueDate: string; status: RequestStatus }) => {
    if (!selectedRequest) return;
    
    try {
      const newDueDate = new Date(data.dueDate);
      
      const updatedRequest = updateRequest(selectedRequest.id, {
        title: data.title,
        dueDate: newDueDate,
        status: data.status
      });
      
      if (updatedRequest) {
        refreshRequests();
        setIsEditDialogOpen(false);
        setSelectedRequest(null);
        toast.success("La demande a été modifiée avec succès");
      }
    } catch (error) {
      console.error("Erreur lors de la modification de la demande:", error);
      toast.error("Erreur lors de la modification de la demande");
    }
  };
  
  const handleCompleteEmailRequest = (data: z.infer<typeof emailCompletionSchema>) => {
    if (!selectedRequest) return;
    
    try {
      const completedRequest = updateRequestStatus(selectedRequest.id, "completed", {
        platform: data.platform,
        statistics: {
          sent: data.sent,
          opened: data.opened,
          clicked: data.clicked,
          bounced: data.bounced,
        },
      });
      
      if (completedRequest) {
        setRequests(getAllRequests());
        setIsCompletionDialogOpen(false);
        setSelectedRequest(null);
        toast.success("La campagne d'email a été marquée comme terminée");
      }
    } catch (error) {
      console.error("Erreur lors de la complétion de la demande:", error);
      toast.error("Erreur lors de la complétion de la demande");
    }
  };
  
  const handleCompleteDatabaseRequest = (data: z.infer<typeof databaseCompletionSchema>) => {
    if (!selectedRequest) return;
    
    try {
      const completedRequest = updateRequestStatus(selectedRequest.id, "completed", {
        contactsCreated: data.contactsCreated,
      });
      
      if (completedRequest) {
        setRequests(getAllRequests());
        setIsCompletionDialogOpen(false);
        setSelectedRequest(null);
        toast.success("La demande de base de données a été marquée comme terminée");
      }
    } catch (error) {
      console.error("Erreur lors de la complétion de la demande:", error);
      toast.error("Erreur lors de la complétion de la demande");
    }
  };
  
  const handleCompleteLinkedinRequest = (data: z.infer<typeof linkedinCompletionSchema>) => {
    if (!selectedRequest) return;
    
    try {
      const completedRequest = updateRequestStatus(selectedRequest.id, "completed", {
        profilesScraped: data.profilesScraped,
        resultFileUrl: data.resultFileUrl,
      });
      
      if (completedRequest) {
        setRequests(getAllRequests());
        setIsCompletionDialogOpen(false);
        setSelectedRequest(null);
        toast.success("La demande de scraping LinkedIn a été marquée comme terminée");
      }
    } catch (error) {
      console.error("Erreur lors de la complétion de la demande:", error);
      toast.error("Erreur lors de la complétion de la demande");
    }
  };
  
  const renderStatusBadge = (status: RequestStatus, isLate?: boolean) => {
    if (isLate && status === "pending") {
      return (
        <Badge variant="outline" className="bg-status-late text-white flex gap-1 items-center">
          <AlertCircle size={14} /> En retard
        </Badge>
      );
    }

    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-status-pending text-white flex gap-1 items-center">
            <Clock size={14} /> En attente
          </Badge>
        );
      case "inprogress":
        return (
          <Badge variant="outline" className="bg-status-inprogress text-white flex gap-1 items-center">
            <ArrowRightLeft size={14} /> En cours
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="outline" className="bg-status-completed text-white flex gap-1 items-center">
            <CheckCircle size={14} /> Terminé
          </Badge>
        );
      default:
        return null;
    }
  };
  
  const renderTypeIcon = (type: string) => {
    switch (type) {
      case "email":
        return <Mail size={16} className="text-seventic-500" />;
      case "database":
        return <DatabaseIcon size={16} className="text-seventic-500" />;
      case "linkedin":
        return <User size={16} className="text-seventic-500" />;
      default:
        return null;
    }
  };
  
  const formatDate = (date: Date) => {
    return format(new Date(date), "d MMM yyyy", { locale: fr });
  };
  
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Dashboard Growth</h1>
        </div>
        
        <div className="flex flex-wrap gap-2 border-b pb-2">
          <Button
            variant={activeTab === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("all")}
          >
            Toutes
          </Button>
          <Button
            variant={activeTab === "pending" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("pending")}
          >
            En attente
          </Button>
          <Button
            variant={activeTab === "inprogress" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("inprogress")}
          >
            En cours
          </Button>
          <Button
            variant={activeTab === "completed" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("completed")}
          >
            Terminées
          </Button>
          <Button
            variant={activeTab === "email" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("email")}
          >
            <Mail className="mr-1 h-4 w-4" /> Email
          </Button>
          <Button
            variant={activeTab === "database" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("database")}
          >
            <DatabaseIcon className="mr-1 h-4 w-4" /> Base de données
          </Button>
          <Button
            variant={activeTab === "linkedin" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("linkedin")}
          >
            <User className="mr-1 h-4 w-4" /> LinkedIn
          </Button>
        </div>
        
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Type</TableHead>
                <TableHead>Titre</TableHead>
                <TableHead>Mission</TableHead>
                <TableHead>SDR</TableHead>
                <TableHead>Créée le</TableHead>
                <TableHead>Date prévue</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                    Aucune demande à afficher
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="text-center">
                      {renderTypeIcon(request.type)}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{request.title}</div>
                    </TableCell>
                    <TableCell>Mission {request.missionId}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Users className="mr-1 h-4 w-4 text-muted-foreground" />
                        {request.sdrName || "Non assigné"}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(request.createdAt)}</TableCell>
                    <TableCell>{formatDate(request.dueDate)}</TableCell>
                    <TableCell>{renderStatusBadge(request.status, request.isLate)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEditDialog(request)}
                        >
                          <Pencil size={14} className="mr-1" /> Éditer
                        </Button>
                        
                        {request.status === "pending" && (
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => handleStartRequest(request)}
                          >
                            <ArrowRightLeft className="mr-2 h-4 w-4" /> Commencer
                          </Button>
                        )}
                        {request.status === "inprogress" && (
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenCompletionDialog(request)}
                          >
                            <FileCheck className="mr-2 h-4 w-4" /> Terminer
                          </Button>
                        )}
                        {request.status === "completed" && (
                          <Button 
                            variant="ghost"
                            size="sm"
                            disabled
                          >
                            <CheckCircle className="mr-2 h-4 w-4 text-status-completed" /> Terminée
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Modifier la demande</DialogTitle>
            <DialogDescription>
              Modifiez les détails de cette demande.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleSaveEdit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titre</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date prévue</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statut</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un statut" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="inprogress">En cours</SelectItem>
                        <SelectItem value="completed">Terminé</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">Enregistrer</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isCompletionDialogOpen} onOpenChange={setIsCompletionDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Compléter la demande</DialogTitle>
            <DialogDescription>
              Entrez les détails de complétion pour cette demande.
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest?.type === "email" && (
            <Form {...emailForm}>
              <form onSubmit={emailForm.handleSubmit(handleCompleteEmailRequest)} className="space-y-4">
                <FormField
                  control={emailForm.control}
                  name="platform"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plateforme utilisée</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une plateforme" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Acelmail">Acelmail</SelectItem>
                          <SelectItem value="Bevo">Bevo</SelectItem>
                          <SelectItem value="Postyman">Postyman</SelectItem>
                          <SelectItem value="Direct IQ">Direct IQ</SelectItem>
                          <SelectItem value="Mindbaz">Mindbaz</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={emailForm.control}
                  name="sent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre d'emails envoyés</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={emailForm.control}
                  name="opened"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre d'emails ouverts</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={emailForm.control}
                  name="clicked"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de clics</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={emailForm.control}
                  name="bounced"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de rebonds</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit">Terminer la campagne</Button>
                </DialogFooter>
              </form>
            </Form>
          )}
          
          {selectedRequest?.type === "database" && (
            <Form {...databaseForm}>
              <form onSubmit={databaseForm.handleSubmit(handleCompleteDatabaseRequest)} className="space-y-4">
                <FormField
                  control={databaseForm.control}
                  name="contactsCreated"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de contacts créés</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit">Terminer la demande</Button>
                </DialogFooter>
              </form>
            </Form>
          )}
          
          {selectedRequest?.type === "linkedin" && (
            <Form {...linkedinForm}>
              <form onSubmit={linkedinForm.handleSubmit(handleCompleteLinkedinRequest)} className="space-y-4">
                <FormField
                  control={linkedinForm.control}
                  name="profilesScraped"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de profils récupérés</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={linkedinForm.control}
                  name="resultFileUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL du fichier résultat (optionnel)</FormLabel>
                      <FormControl>
                        <Input placeholder="URL du fichier" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit">Terminer la demande</Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default GrowthDashboard;
