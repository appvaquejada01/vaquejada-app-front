import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Calendar,
  Loader2,
  Search,
  MapPin,
  Pen,
  Plus,
  Trash2,
  Upload,
  Image,
  ImageOff,
  X,
  Users,
  Mic,
  Gavel,
} from "lucide-react";
import { GetUserResponse, ListEventResponse } from "@/types/api";
import React, { useState, useRef } from "react";
import { formatCurrency, formatDate } from "@/utils/format-data.util";
import { EventStatusEnum, UserRoleEnum } from "@/types/enums/api-enums";
import { CriarEventoModal } from "../CriarEventoModal";
import { getCategoryNameMap, getEventStatusMap } from "@/types/enums/enum-maps";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  createEventCategory,
  deleteEventCategory,
  getEventCategories,
  updateEvent,
  updateEventCategory,
  uploadEventBanner,
  deleteEventBanner,
} from "@/lib/services/event.service";
import { CategoryNameEnum } from "@/types/enums/api-enums";
import { listCategories } from "@/lib/services/category.service";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { BRstates } from "@/shared/br-states";
import { CreateEventDto } from "@/types/dtos/event.dto";
import { listUsers } from "@/lib/services/user.service";
import {
  addJudgeToEvent,
  addSpeakerToEvent,
  listStaffByEvent,
} from "@/lib/services/staff.service";

interface EventosTabProps {
  eventos: ListEventResponse[];
  loading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  filtro: string;
  onFiltroChange: (value: string) => void;
  filtroStatus: string;
  onFiltroStatusChange: (value: string) => void;
  filtroCidade: string;
  onFiltroCidadeChange: (value: string) => void;
  filtroEstado: string;
  onFiltroEstadoChange: (value: string) => void;
  totalEventos: number;
  cidadesUnicas: string[];
  estadosUnicos: string[];
  statusUnicos: string[];
  onEventCreated?: () => void;
}

interface CategoriaForm {
  id?: string;
  categoryId: string;
  price: string;
  maxRunners: string;
  passwordLimit: string;
  cattleQuantity: string;
  prize: string;
  initialPassword: string;
  finalPassword: string;
  startAt: string;
  endAt: string;
  currentRunners?: number;
  isActive?: boolean;
  category?: {
    id: string;
    name: string;
    description: string;
    rules: string | null;
    isActive: boolean;
  };
}

interface EventFormData {
  name: string;
  startAt: string;
  endAt: string;
  purchaseClosedAt: string;
  prize: string;
  address: string;
  city: string;
  state: string;
  description: string;
  isActive: boolean;
  bannerUrl?: string;
}

interface SelectedImage {
  file: File;
  preview: string;
}

interface EventStaff {
  userId: string;
  name: string;
  email: string;
  phone?: string;
  eventId: string;
  role: UserRoleEnum;
}

interface StaffUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRoleEnum;
}

export const EventosTab: React.FC<EventosTabProps> = ({
  eventos,
  loading,
  page,
  totalPages,
  onPageChange,
  filtro,
  onFiltroChange,
  filtroStatus,
  onFiltroStatusChange,
  filtroCidade,
  onFiltroCidadeChange,
  filtroEstado,
  onFiltroEstadoChange,
  totalEventos,
  cidadesUnicas,
  estadosUnicos,
  statusUnicos,
  onEventCreated,
}) => {
  const { toast } = useToast();
  const [editingEvent, setEditingEvent] = useState<ListEventResponse | null>(
    null
  );
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [categoriasDoEvento, setCategoriasDoEvento] = useState<CategoriaForm[]>(
    []
  );
  const [loadingEvent, setLoadingEvent] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [eventStaff, setEventStaff] = useState<EventStaff[]>([]);
  const [availableJudges, setAvailableJudges] = useState<StaffUser[]>([]);
  const [availablespeakers, setAvailablespeakers] = useState<StaffUser[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [staffSectionOpen, setStaffSectionOpen] = useState(false);

  const [formData, setFormData] = useState<EventFormData>({
    name: "",
    prize: "",
    startAt: "",
    endAt: "",
    purchaseClosedAt: "",
    address: "",
    city: "",
    state: "",
    description: "",
    isActive: true,
    bannerUrl: "",
  });

  const [categoriasDoEventoDisponiveis, setCategoriasDoEventoDisponiveis] =
    useState<{ id: string; name: string }[]>([]);

  React.useEffect(() => {
    const fetchCategoriasDoEventoDisponiveis = async () => {
      try {
        const response = await listCategories();
        if (response.data && Array.isArray(response.data)) {
          setCategoriasDoEventoDisponiveis(
            response.data.map((cat: any) => ({
              id: cat.category?.id || cat.id,
              name: getCategoryNameMap(cat.name as CategoryNameEnum, cat.description),
            }))
          );
        }
      } catch (err) {
        console.error("Erro ao buscar categoriasDoEvento disponíveis:", err);
        setCategoriasDoEventoDisponiveis([]);
      }
    };
    fetchCategoriasDoEventoDisponiveis();
  }, []);

  const loadEventStaff = async (eventId: string) => {
    if (!eventId) return;

    try {
      setLoadingStaff(true);
      const result = await listStaffByEvent(eventId);

      const buildEventStaff = (user: GetUserResponse): EventStaff => ({
        userId: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone ?? "",
        role: user.role,
        eventId: eventId,
      });

      const staffList: EventStaff[] = [
        ...(Array.isArray(result.judges)
          ? result.judges.map(buildEventStaff)
          : []),
        ...(Array.isArray(result.speakers)
          ? result.speakers.map(buildEventStaff)
          : []),
      ];

      setEventStaff(staffList);
    } catch (err) {
      console.error("Erro ao carregar staff:", err);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a equipe do evento",
        variant: "destructive",
      });
    } finally {
      setLoadingStaff(false);
    }
  };

  const loadAvailableStaff = async () => {
    try {
      const [judges, speakers] = await Promise.all([
        listUsers({ role: UserRoleEnum.JUDGE }),
        listUsers({ role: UserRoleEnum.SPEAKER }),
      ]);

      const buildStaffUser = (user: GetUserResponse): StaffUser => ({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone ?? "",
        role: user.role,
      });

      const judgesList: StaffUser[] = Array.isArray(judges)
        ? judges.map(buildStaffUser)
        : [];
      const speakersList: StaffUser[] = Array.isArray(speakers)
        ? speakers.map(buildStaffUser)
        : [];

      setAvailableJudges(judgesList);
      setAvailablespeakers(speakersList);
    } catch (err) {
      console.error("Erro ao carregar staff disponível:", err);
    }
  };

  const handleAddStaff = async (userId: string, role: UserRoleEnum) => {
    if (!editingEvent) return;

    try {
      const user =
        role === UserRoleEnum.JUDGE
          ? availableJudges.find((j) => j.id === userId)
          : availablespeakers.find((a) => a.id === userId);

      if (!user) return;

      if (role === UserRoleEnum.JUDGE) {
        addJudgeToEvent(editingEvent.id, userId);
      } else {
        addSpeakerToEvent(editingEvent.id, userId);
      }

      const newStaff: EventStaff = {
        userId: user.id,
        eventId: editingEvent.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role,
      };

      setEventStaff((prev) => [...prev, newStaff]);

      toast({
        title: "Sucesso",
        description: `${
          role === UserRoleEnum.JUDGE ? "Juiz" : "Locutor"
        } adicionado com sucesso!`,
      });
    } catch (err) {
      console.error("Erro ao adicionar staff:", err);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar à equipe",
        variant: "destructive",
      });
    }
  };

  const handleRemoveStaff = async (staffId: string) => {
    try {
      setEventStaff((prev) => prev.filter((staff) => staff.userId !== staffId));
      toast({
        title: "Sucesso",
        description: "Membro removido da equipe!",
      });
    } catch (err) {
      console.error("Erro ao remover staff:", err);
      toast({
        title: "Erro",
        description: "Não foi possível remover da equipe",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: EventStatusEnum) => {
    switch (status) {
      case EventStatusEnum.SCHEDULED:
        return "bg-green-500";
      case EventStatusEnum.LIVE:
        return "bg-yellow-500";
      case EventStatusEnum.CANCELLED:
        return "bg-red-500";
      case EventStatusEnum.FINISHED:
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const handleInputChange = (field: keyof EventFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEditEvent = async (evento: ListEventResponse) => {
    try {
      setLoadingEvent(true);
      setEditingEvent(evento);
      setIsEditModalOpen(true);
      setSelectedImage(null);

      setFormData({
        name: evento.name || "",
        prize: evento.prize ? String(evento.prize) : "",
        startAt: evento.startAt
          ? new Date(evento.startAt).toISOString().split("T")[0]
          : "",
        endAt: evento.endAt
          ? new Date(evento.endAt).toISOString().split("T")[0]
          : "",
        purchaseClosedAt: evento.purchaseClosedAt
          ? new Date(evento.purchaseClosedAt).toISOString().split("T")[0]
          : "",
        address: evento.address || "",
        city: evento.city || "",
        state: evento.state || "",
        description: evento.description || "",
        isActive: evento.isActive || false,
        bannerUrl: evento.bannerUrl || "",
      });

      const response = await getEventCategories(evento.id);

      if (response.data && Array.isArray(response.data)) {
        const categoriasDoEventoMapeadas = response.data.map((cat) => ({
          id: cat.id,
          categoryId: cat.category?.id || "",
          price: cat.price?.toString() || "",
          maxRunners: cat.maxRunners?.toString() || "",
          startAt: cat.startAt
            ? new Date(cat.startAt).toISOString().split("T")[0]
            : "",
          endAt: cat.endAt
            ? new Date(cat.endAt).toISOString().split("T")[0]
            : "",
          currentRunners: cat.currentRunners || 0,
          passwordLimit: cat.passwordLimit || 0,
          cattleQuantity: cat.cattleQuantity?.toString() || "0",
          prize: cat.prize?.toString() || "0",
          isActive: cat.isActive || false,
          category: cat.category,
          initialPassword: cat.initialPassword || 0,
          finalPassword: cat.finalPassword || 0,
        }));
        setCategoriasDoEvento(categoriasDoEventoMapeadas);
      } else {
        setCategoriasDoEvento([]);
      }

      await loadEventStaff(evento.id);
      await loadAvailableStaff();
    } catch (err) {
      console.error("Erro ao carregar evento:", err);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do evento",
        variant: "destructive",
      });
      setCategoriasDoEvento([]);
    } finally {
      setLoadingEvent(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Erro",
          description: "Por favor, selecione um arquivo de imagem válido",
          variant: "destructive",
        });
        return;
      }

      // Validar tamanho do arquivo (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Erro",
          description: "A imagem deve ter no máximo 5MB",
          variant: "destructive",
        });
        return;
      }

      const preview = URL.createObjectURL(file);
      setSelectedImage({ file, preview });
    }
  };

  const removeSelectedImage = () => {
    if (selectedImage?.preview) {
      URL.revokeObjectURL(selectedImage.preview);
    }
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveBanner = async () => {
    if (!editingEvent?.id) return;

    try {
      setUploadingImage(true);
      await deleteEventBanner(editingEvent.id);

      setFormData((prev) => ({ ...prev, bannerUrl: "" }));
      toast({
        title: "Sucesso",
        description: "Banner removido com sucesso!",
      });
    } catch (err) {
      console.error("Erro ao remover banner:", err);
      toast({
        title: "Erro",
        description: "Não foi possível remover o banner",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const uploadBanner = async (): Promise<string | null> => {
    if (!selectedImage || !editingEvent?.id) return null;

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append("banner", selectedImage.file);

      const response = await uploadEventBanner(editingEvent.id, formData);

      toast({
        title: "Sucesso",
        description: "Banner atualizado com sucesso!",
      });

      return response.url || null;
    } catch (err) {
      console.error("Erro ao fazer upload do banner:", err);
      toast({
        title: "Erro",
        description: "Não foi possível fazer upload do banner",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const addCategoria = () => {
    setCategoriasDoEvento((prev) => [
      ...prev,
      {
        categoryId: "",
        price: "",
        maxRunners: "",
        passwordLimit: "",
        cattleQuantity: "",
        prize: "",
        initialPassword: "",
        finalPassword: "",
        startAt: "",
        endAt: "",
      },
    ]);
  };

  const removeCategoria = async (index: number) => {
    const categoria = categoriasDoEvento[index];

    if (categoria.id && editingEvent?.id) {
      try {
        await deleteEventCategory(editingEvent.id, categoria.id);
        toast({
          title: "Sucesso",
          description: "Categoria removida com sucesso!",
        });
      } catch (err) {
        console.error("Erro ao remover categoria:", err);
        toast({
          title: "Erro",
          description: "Não foi possível remover a categoria",
          variant: "destructive",
        });
        return;
      }
    }

    setCategoriasDoEvento((prev) => prev.filter((_, i) => i !== index));
  };

  const updateCategoria = (
    index: number,
    field: keyof CategoriaForm,
    value: string
  ) => {
    setCategoriasDoEvento((prev) =>
      prev.map((cat, i) => (i === index ? { ...cat, [field]: value } : cat))
    );
  };

  const handleSaveEvent = async () => {
    for (let i = 0; i < categoriasDoEvento.length; i++) {
      const cat = categoriasDoEvento[i];
      if (!cat.categoryId) {
        toast({ title: "Erro", description: `Categoria ${i + 1}: selecione uma categoria.`, variant: "destructive" });
        return;
      }
      if (!Number(cat.maxRunners) || Number(cat.maxRunners) <= 0) {
        toast({ title: "Erro", description: `Categoria ${i + 1}: informe o máximo de participantes (> 0).`, variant: "destructive" });
        return;
      }
      if (!Number(cat.passwordLimit) || Number(cat.passwordLimit) <= 0) {
        toast({ title: "Erro", description: `Categoria ${i + 1}: informe o limite de senhas (> 0).`, variant: "destructive" });
        return;
      }
    }

    const categoryIds = categoriasDoEvento.map((c) => c.categoryId).filter(Boolean);
    const hasDuplicate = categoryIds.length !== new Set(categoryIds).size;
    if (hasDuplicate) {
      toast({
        title: "Erro",
        description: "Há categorias duplicadas. Cada categoria só pode ser adicionada uma vez.",
        variant: "destructive",
      });
      return;
    }

    try {
      let bannerUrl = formData.bannerUrl;

      if (selectedImage) {
        const newBannerUrl = await uploadBanner();
        if (newBannerUrl) {
          bannerUrl = newBannerUrl;
        }
      }

      const updatedData: CreateEventDto = {
        name: formData.name,
        startAt: formData.startAt.includes("T") ? formData.startAt : `${formData.startAt}T12:00:00.000Z`,
        endAt: formData.endAt.includes("T") ? formData.endAt : `${formData.endAt}T12:00:00.000Z`,
        purchaseClosedAt: formData.purchaseClosedAt.includes("T") ? formData.purchaseClosedAt : `${formData.purchaseClosedAt}T12:00:00.000Z`,
        prize: formData.prize || undefined,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        description: formData.description,
        bannerUrl: bannerUrl,
      };

      await updateEvent(editingEvent!.id, updatedData);

      for (const categoria of categoriasDoEvento.filter((c) => c.id)) {
        const catStartAt = categoria.startAt && !categoria.startAt.includes("T") ? `${categoria.startAt}T12:00:00.000Z` : categoria.startAt;
        const catEndAt = categoria.endAt && !categoria.endAt.includes("T") ? `${categoria.endAt}T12:00:00.000Z` : categoria.endAt;
        await updateEventCategory(categoria.id!, {
          eventId: editingEvent!.id,
          categoryId: categoria.categoryId,
          price: Number(categoria.price),
          startAt: catStartAt,
          endAt: catEndAt,
          maxRunners: Number(categoria.maxRunners),
          passwordLimit: Number(categoria.passwordLimit),
          cattleQuantity: Number(categoria.cattleQuantity) || 0,
          prize: Number(categoria.prize) || 0,
        });
      }

      for (const categoria of categoriasDoEvento.filter((c) => !c.id)) {
        const catStartAt = categoria.startAt && !categoria.startAt.includes("T") ? `${categoria.startAt}T12:00:00.000Z` : categoria.startAt;
        const catEndAt = categoria.endAt && !categoria.endAt.includes("T") ? `${categoria.endAt}T12:00:00.000Z` : categoria.endAt;
        await createEventCategory({
          eventId: editingEvent!.id,
          categoryId: categoria.categoryId,
          price: Number(categoria.price),
          startAt: catStartAt,
          endAt: catEndAt,
          maxRunners: Number(categoria.maxRunners),
          passwordLimit: Number(categoria.passwordLimit),
          cattleQuantity: Number(categoria.cattleQuantity) || 0,
          prize: Number(categoria.prize) || 0,
        });
      }

      toast({
        title: "Sucesso",
        description: "Evento atualizado com sucesso!",
      });

      setIsEditModalOpen(false);
      setEditingEvent(null);
      setCategoriasDoEvento([]);
      setSelectedImage(null);
      setEventStaff([]);
      setFormData({
        name: "",
        prize: "",
        startAt: "",
        endAt: "",
        purchaseClosedAt: "",
        address: "",
        city: "",
        state: "",
        description: "",
        isActive: true,
        bannerUrl: "",
      });

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      onEventCreated?.();
    } catch (err: any) {
      console.error("Erro ao atualizar evento:", err);
      const msg = err?.response?.data?.message || "Não foi possível atualizar o evento";
      toast({
        title: "Erro",
        description: Array.isArray(msg) ? msg.join(", ") : msg,
        variant: "destructive",
      });
    }
  };

  const getCategoriaDisplayName = (categoria: CategoriaForm) => {
    if (categoria.category?.name) {
      return (
        getCategoryNameMap(categoria.category.name as CategoryNameEnum) ||
        categoria.category.name
      );
    }
    return `Categoria`;
  };

  return (
    <>
      <Card className="bg-card/80 backdrop-blur-sm border-2">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div>
              <CardTitle className="text-2xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Eventos
              </CardTitle>
              <CardDescription className="text-base">
                {totalEventos}{" "}
                {totalEventos === 1
                  ? "evento encontrado"
                  : "eventos encontrados"}
              </CardDescription>
            </div>
            <CriarEventoModal onEventCreated={onEventCreated} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar eventos por nome..."
                value={filtro}
                onChange={(e) => onFiltroChange(e.target.value)}
                className="pl-10 rounded-xl border-2 focus:border-primary/50 bg-background/50"
              />
            </div>

            <select
              value={filtroStatus}
              onChange={(e) => onFiltroStatusChange(e.target.value)}
              className="rounded-xl border-2 focus:border-primary/50 bg-background/50 px-4 py-2"
            >
              <option value="todos">Todos</option>
              {statusUnicos.map((status) => (
                <option key={status} value={status}>
                  {getEventStatusMap(status as EventStatusEnum)}
                </option>
              ))}
            </select>

            <select
              value={filtroCidade}
              onChange={(e) => onFiltroCidadeChange(e.target.value)}
              className="rounded-xl border-2 focus:border-primary/50 bg-background/50 px-4 py-2"
            >
              <option value="todos">Todas as cidades</option>
              {cidadesUnicas.map((cidade) => (
                <option key={cidade} value={cidade}>
                  {cidade}
                </option>
              ))}
            </select>

            <select
              value={filtroEstado}
              onChange={(e) => onFiltroEstadoChange(e.target.value)}
              className="rounded-xl border-2 focus:border-primary/50 bg-background/50 px-4 py-2"
            >
              <option value="todos">Todos os estados</option>
              {estadosUnicos.map((estado) => (
                <option key={estado} value={estado}>
                  {estado}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-lg font-medium">Carregando eventos...</p>
              </div>
            ) : eventos.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Nenhum evento encontrado</p>
                <p className="text-sm">Crie seu primeiro evento para começar</p>
              </div>
            ) : (
              eventos.map((evento) => (
                <Card
                  key={evento.id}
                  className="bg-card/80 backdrop-blur-sm border-2 hover:shadow-lg transition-all"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                          <Calendar className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-2">
                            {evento.name}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2 mb-2">
                            <Calendar className="h-4 w-4" />
                            {formatDate(evento.startAt)}
                            {evento.endAt && (
                              <>
                                <span>até</span>
                                {formatDate(evento.endAt)}
                              </>
                            )}
                          </CardDescription>
                          {evento.address && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              <span>
                                {evento.address}, {evento.city} - {evento.state}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-3 h-3 rounded-full ${getStatusColor(
                              evento.status
                            )}`}
                          ></div>
                          <span className="text-sm text-muted-foreground">
                            {getEventStatusMap(evento.status)}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl"
                          onClick={() => handleEditEvent(evento)}
                        >
                          <Pen className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-6 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Página {page} de {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => onPageChange(page - 1)}
                  className="rounded-xl"
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => onPageChange(page + 1)}
                  className="rounded-xl"
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              Editar Evento: {editingEvent?.name}
            </DialogTitle>
            <DialogDescription>
              Atualize as informações do evento e gerencie as categorias
            </DialogDescription>
          </DialogHeader>

          {loadingEvent ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Carregando dados do evento...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Banner do Evento</CardTitle>
                  <DialogDescription>
                    Atualize a imagem do banner do evento
                  </DialogDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="flex-1">
                      <Label className="text-sm font-medium mb-3 block">
                        Banner Atual
                      </Label>
                      <div className="relative h-48 w-full md:w-64 overflow-hidden rounded-lg border-2 bg-muted">
                        {formData.bannerUrl ? (
                          <>
                            <img
                              src={formData.bannerUrl}
                              alt={`Banner atual do evento ${formData.name}`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-2 left-2">
                              <Badge variant="secondary" className="text-xs">
                                Atual
                              </Badge>
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/15 to-secondary/15 flex items-center justify-center">
                            <div className="text-center">
                              <ImageOff className="h-12 w-12 text-primary/30 mx-auto mb-2" />
                              <p className="text-xs text-primary/50 font-medium">
                                Sem banner
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 space-y-4">
                      <Label className="text-sm font-medium">
                        Novo Banner (Opcional)
                      </Label>

                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageSelect}
                        accept="image/*"
                        className="hidden"
                      />

                      {selectedImage ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-green-600 flex items-center gap-2">
                              <Image className="h-4 w-4" />
                              Nova imagem selecionada
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={removeSelectedImage}
                              className="h-8 w-8 p-0 hover:bg-destructive/10"
                            >
                              <X className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>

                          <div className="relative h-32 w-full overflow-hidden rounded-lg border-2">
                            <img
                              src={selectedImage.preview}
                              alt="Preview do novo banner"
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <p className="text-xs text-muted-foreground">
                            {selectedImage.file.name} •
                            {(selectedImage.file.size / 1024 / 1024).toFixed(2)}
                            MB
                          </p>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={removeSelectedImage}
                            className="w-full"
                          >
                            Remover Nova Imagem
                          </Button>
                        </div>
                      ) : (
                        <div
                          onClick={triggerFileInput}
                          className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors group"
                        >
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                              <Upload className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">
                                Clique para selecionar novo banner
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                PNG, JPG, WEBP até 5MB
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="rounded-lg"
                            >
                              Selecionar Imagem
                            </Button>
                          </div>
                        </div>
                      )}

                      {formData.bannerUrl && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleRemoveBanner}
                          className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Remover Banner Atual
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Informações do Evento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="eventName">Nome do Evento</Label>
                      <Input
                        id="eventName"
                        value={formData.name}
                        onChange={(e) =>
                          handleInputChange("name", e.target.value)
                        }
                        placeholder="Nome do evento"
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="eventPrize">Premiação (R$)</Label>
                      <Input
                        id="eventPrize"
                        type="number"
                        value={formData.prize}
                        onChange={(e) =>
                          handleInputChange("prize", e.target.value)
                        }
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className="bg-background"
                        onBlur={(e) => {
                          if (e.target.value) {
                            const value = Number(e.target.value).toFixed(2);
                            handleInputChange("prize", value);
                          }
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="eventStart">Data de Início</Label>
                      <Input
                        id="eventStart"
                        type="date"
                        value={formData.startAt}
                        onChange={(e) =>
                          handleInputChange("startAt", e.target.value)
                        }
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="eventEnd">Data de Término</Label>
                      <Input
                        id="eventEnd"
                        type="date"
                        value={formData.endAt}
                        onChange={(e) =>
                          handleInputChange("endAt", e.target.value)
                        }
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="eventPurchaseClosedAt">
                        Data de Fechamento de Vendas
                      </Label>
                      <Input
                        id="eventPurchaseClosedAt"
                        type="date"
                        value={formData.purchaseClosedAt}
                        onChange={(e) =>
                          handleInputChange("purchaseClosedAt", e.target.value)
                        }
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="eventAddress">Endereço</Label>
                      <Input
                        id="eventAddress"
                        type="text"
                        value={formData.address}
                        onChange={(e) =>
                          handleInputChange("address", e.target.value)
                        }
                        placeholder="Endereço completo"
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="eventCity">Cidade</Label>
                      <Input
                        id="eventCity"
                        type="text"
                        value={formData.city}
                        onChange={(e) =>
                          handleInputChange("city", e.target.value)
                        }
                        placeholder="Cidade"
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state" className="text-sm font-medium">
                        Estado
                      </Label>
                      <Select
                        value={formData.state}
                        onValueChange={(value) =>
                          handleInputChange("state", value)
                        }
                      >
                        <SelectTrigger className="rounded-xl border-2 focus:border-primary/50">
                          <SelectValue placeholder="Selecione o estado" />
                        </SelectTrigger>
                        <SelectContent>
                          {BRstates.map((estado) => (
                            <SelectItem key={estado} value={estado}>
                              {estado}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="eventDescription">Descrição</Label>
                      <textarea
                        id="eventDescription"
                        value={formData.description}
                        onChange={(e) =>
                          handleInputChange("description", e.target.value)
                        }
                        placeholder="Descrição detalhada do evento"
                        rows={4}
                        className="w-full rounded-lg border-2 px-3 py-2 bg-background resize-none"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between sticky top-0 z-10 bg-card py-2">
                    <CardTitle>Categorias do Evento</CardTitle>
                    <Button onClick={addCategoria} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Adicionar Categoria
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {categoriasDoEvento.map((categoria, index) => (
                    <Card key={index} className="p-4 border-2">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-semibold">
                            {getCategoriaDisplayName(categoria)}
                          </h4>
                          {categoria.currentRunners !== undefined && (
                            <p className="text-sm text-muted-foreground">
                              {categoria.currentRunners} /{" "}
                              {categoria.maxRunners || 0} inscritos
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCategoria(index)}
                          className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`category-${index}`}>Categoria</Label>
                          <select
                            id={`category-${index}`}
                            value={categoria.categoryId}
                            onChange={(e) =>
                              updateCategoria(
                                index,
                                "categoryId",
                                e.target.value
                              )
                            }
                            className="w-full rounded-lg border-2 px-3 py-2 bg-background"
                          >
                            <option value="">Selecione uma categoria</option>
                            {categoriasDoEventoDisponiveis
                              .filter(
                                (cat) =>
                                  cat.id === categoria.categoryId ||
                                  !categoriasDoEvento.some(
                                    (c, i) =>
                                      i !== index && c.categoryId === cat.id
                                  )
                              )
                              .map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.name}
                                </option>
                              ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`price-${index}`}>Preço (R$)</Label>
                          <Input
                            id={`price-${index}`}
                            type="number"
                            value={categoria.price}
                            onChange={(e) =>
                              updateCategoria(index, "price", e.target.value)
                            }
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            className="bg-background"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`maxRunners-${index}`}>
                            Máximo de Participantes
                          </Label>
                          <Input
                            id={`maxRunners-${index}`}
                            type="number"
                            value={categoria.maxRunners}
                            onChange={(e) =>
                              updateCategoria(
                                index,
                                "maxRunners",
                                e.target.value
                              )
                            }
                            placeholder="0"
                            min="0"
                            className="bg-background"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`passwordLimit-${index}`}>
                            Limite de Senhas
                          </Label>
                          <Input
                            id={`passwordLimit-${index}`}
                            type="number"
                            value={categoria.passwordLimit}
                            onChange={(e) =>
                              updateCategoria(
                                index,
                                "passwordLimit",
                                e.target.value
                              )
                            }
                            placeholder="0"
                            min="0"
                            className="bg-background"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`cattleQuantity-${index}`}>
                            Qtd. de Boi
                          </Label>
                          <Input
                            id={`cattleQuantity-${index}`}
                            type="number"
                            value={categoria.cattleQuantity}
                            onChange={(e) =>
                              updateCategoria(
                                index,
                                "cattleQuantity",
                                e.target.value
                              )
                            }
                            placeholder="0"
                            min="0"
                            className="bg-background"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`prize-${index}`}>
                            Premiação (R$)
                          </Label>
                          <Input
                            id={`prize-${index}`}
                            type="number"
                            value={categoria.prize}
                            onChange={(e) =>
                              updateCategoria(
                                index,
                                "prize",
                                e.target.value
                              )
                            }
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            className="bg-background"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`startAt-${index}`}>
                            Início da Categoria
                          </Label>
                          <Input
                            id={`startAt-${index}`}
                            type="date"
                            value={categoria.startAt}
                            onChange={(e) =>
                              updateCategoria(index, "startAt", e.target.value)
                            }
                            className="bg-background"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`endAt-${index}`}>
                            Término da Categoria
                          </Label>
                          <Input
                            id={`endAt-${index}`}
                            type="date"
                            value={categoria.endAt}
                            onChange={(e) =>
                              updateCategoria(index, "endAt", e.target.value)
                            }
                            className="bg-background"
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Equipe do Evento
                    </CardTitle>
                    <Button
                      onClick={() => setStaffSectionOpen(!staffSectionOpen)}
                      variant="outline"
                      size="sm"
                    >
                      {staffSectionOpen ? "Ocultar" : "Mostrar"} Equipe
                    </Button>
                  </div>
                  <CardDescription>
                    Adicione juízes e locutores para este evento
                  </CardDescription>
                </CardHeader>

                {staffSectionOpen && (
                  <CardContent className="space-y-6">
                    {loadingStaff ? (
                      <div className="text-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Carregando equipe...
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label className="text-base font-semibold flex items-center gap-2">
                              <Gavel className="h-4 w-4" />
                              Juízes
                            </Label>
                            <Select
                              value=""
                              onValueChange={(userId) => {
                                if (userId) {
                                  handleAddStaff(userId, UserRoleEnum.JUDGE);
                                }
                              }}
                            >
                              <SelectTrigger className="w-64">
                                <SelectValue placeholder="Selecionar juiz..." />
                              </SelectTrigger>
                              <SelectContent>
                                {availableJudges
                                  .filter(
                                    (judge) =>
                                      !eventStaff.some(
                                        (staff) =>
                                          staff.userId === judge.id &&
                                          staff.role === UserRoleEnum.JUDGE
                                      )
                                  )
                                  .map((judge) => (
                                    <SelectItem key={judge.id} value={judge.id}>
                                      {judge.name} - {judge.email}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {eventStaff
                              .filter(
                                (staff) => staff.role === UserRoleEnum.JUDGE
                              )
                              .map((judge) => (
                                <Card key={judge.userId} className="p-3">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-medium">
                                        {judge.name}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        {judge.email}
                                      </p>
                                      {judge.phone && (
                                        <p className="text-sm text-muted-foreground">
                                          {judge.phone}
                                        </p>
                                      )}
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleRemoveStaff(judge.userId)
                                      }
                                      className="text-destructive hover:text-destructive/80"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </Card>
                              ))}
                            {eventStaff.filter(
                              (staff) => staff.role === UserRoleEnum.JUDGE
                            ).length === 0 && (
                              <div className="col-span-2 text-center py-4 text-muted-foreground">
                                <Gavel className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p>Nenhum juiz adicionado</p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label className="text-base font-semibold flex items-center gap-2">
                              <Mic className="h-4 w-4" />
                              Locutores
                            </Label>
                            <Select
                              value=""
                              onValueChange={(userId) => {
                                if (userId) {
                                  handleAddStaff(userId, UserRoleEnum.SPEAKER);
                                }
                              }}
                            >
                              <SelectTrigger className="w-64">
                                <SelectValue placeholder="Selecionar locutor..." />
                              </SelectTrigger>
                              <SelectContent>
                                {availablespeakers
                                  .filter(
                                    (speaker) =>
                                      !eventStaff.some(
                                        (staff) =>
                                          staff.userId === speaker.id &&
                                          staff.role === UserRoleEnum.SPEAKER
                                      )
                                  )
                                  .map((speaker) => (
                                    <SelectItem
                                      key={speaker.id}
                                      value={speaker.id}
                                    >
                                      {speaker.name} - {speaker.email}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {eventStaff
                              .filter(
                                (staff) => staff.role === UserRoleEnum.SPEAKER
                              )
                              .map((speaker) => (
                                <Card key={speaker.userId} className="p-3">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-medium">
                                        {speaker.name}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        {speaker.email}
                                      </p>
                                      {speaker.phone && (
                                        <p className="text-sm text-muted-foreground">
                                          {speaker.phone}
                                        </p>
                                      )}
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleRemoveStaff(speaker.userId)
                                      }
                                      className="text-destructive hover:text-destructive/80"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </Card>
                              ))}
                            {eventStaff.filter(
                              (staff) => staff.role === UserRoleEnum.SPEAKER
                            ).length === 0 && (
                              <div className="col-span-2 text-center py-4 text-muted-foreground">
                                <Mic className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p>Nenhum locutor adicionado</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                )}
              </Card>

              <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-background z-10 pb-2">
                <Button
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveEvent}
                  className="gap-2"
                  disabled={uploadingImage}
                >
                  {uploadingImage ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enviando imagem...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
