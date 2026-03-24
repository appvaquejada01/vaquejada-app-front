import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Calendar,
  Plus,
  MapPin,
  FileText,
  Globe,
  Upload,
  X,
  Image,
  BookOpen,
  Users,
  Gavel,
  Mic,
  Trash2,
  Tag,
  Search,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  createEventWithBanner,
  createEvent,
  createEventCategory,
} from "@/lib/services/event.service";
import {
  EventStatusEnum,
  UserRoleEnum,
  CategoryNameEnum,
  UserNatureEnum,
} from "@/types/enums/api-enums";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BRstates } from "@/shared/br-states";
import { Card } from "@/components/ui/card";
import { listUsers, createFullUser } from "@/lib/services/user.service";
import {
  addJudgeToEvent,
  addSpeakerToEvent,
} from "@/lib/services/staff.service";
import { listCategories, createCategory } from "@/lib/services/category.service";
import { GetUserResponse } from "@/types/api";
import { getCategoryNameMap } from "@/types/enums/enum-maps";

interface CriarEventoModalProps {
  onEventCreated?: () => void;
  trigger?: React.ReactNode;
}

interface EventCategoryForm {
  categoryId: string;
  categoryName: string;
  price: string;
  maxRunners: string;
  passwordLimit: string;
  cattleQuantity: string;
  prize: string;
  initialPassword: string;
  finalPassword: string;
  startAt: string;
  endAt: string;
}

interface NewStaffForm {
  name: string;
  email: string;
  cpf: string;
  phone: string;
  password: string;
}

const emptyStaffForm: NewStaffForm = {
  name: "",
  email: "",
  cpf: "",
  phone: "",
  password: "",
};

const loadGoogleMapsScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      reject(new Error("No API key"));
      return;
    }

    if ((window as any).google?.maps?.places) {
      resolve();
      return;
    }

    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      const interval = setInterval(() => {
        if ((window as any).google?.maps?.places) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
      setTimeout(() => {
        clearInterval(interval);
        reject(new Error("Timeout"));
      }, 10000);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });
};

export const CriarEventoModal = ({
  onEventCreated,
  trigger,
}: CriarEventoModalProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    prize: "",
    description: "",
    address: "",
    city: "",
    state: "",
    startAt: "",
    endAt: "",
    purchaseClosedAt: "",
    status: EventStatusEnum.SCHEDULED,
    bannerUrl: "",
    isPublic: true,
    cattlePerPassword: "",
    useAbvaqRules: true,
    customRules: "",
  });

  const [selectedImage, setSelectedImage] = useState<{
    file: File;
    preview: string;
  } | null>(null);

  const [availableJudges, setAvailableJudges] = useState<GetUserResponse[]>([]);
  const [availableSpeakers, setAvailableSpeakers] = useState<
    GetUserResponse[]
  >([]);
  const [selectedJudges, setSelectedJudges] = useState<GetUserResponse[]>([]);
  const [selectedSpeakers, setSelectedSpeakers] = useState<GetUserResponse[]>(
    []
  );

  // Google Places
  const addressInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [googleLoaded, setGoogleLoaded] = useState(false);

  // Create Staff
  const [showCreateJudge, setShowCreateJudge] = useState(false);
  const [showCreateSpeaker, setShowCreateSpeaker] = useState(false);
  const [creatingStaff, setCreatingStaff] = useState(false);
  const [newJudgeForm, setNewJudgeForm] = useState<NewStaffForm>({
    ...emptyStaffForm,
  });
  const [newSpeakerForm, setNewSpeakerForm] = useState<NewStaffForm>({
    ...emptyStaffForm,
  });

  // Categories
  const [availableCategories, setAvailableCategories] = useState<
    { id: string; name: string }[]
  >([]);
  const [eventCategories, setEventCategories] = useState<EventCategoryForm[]>(
    []
  );
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);

  useEffect(() => {
    if (open) {
      loadAvailableStaff();
      loadCategories();
    }
  }, [open]);

  // Google Places: load script
  useEffect(() => {
    loadGoogleMapsScript()
      .then(() => setGoogleLoaded(true))
      .catch(() => {});
  }, []);

  // Google Places: initialize autocomplete
  useEffect(() => {
    if (!open || !googleLoaded || !addressInputRef.current || autocompleteRef.current) return;

    const google = (window as any).google;
    if (!google?.maps?.places) return;

    const autocomplete = new google.maps.places.Autocomplete(
      addressInputRef.current,
      {
        types: ["address"],
        componentRestrictions: { country: "br" },
        fields: ["address_components", "formatted_address"],
      }
    );

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.address_components) return;

      let route = "";
      let streetNumber = "";
      let neighborhood = "";
      let city = "";
      let state = "";

      for (const component of place.address_components) {
        const types: string[] = component.types;
        if (types.includes("route")) {
          route = component.long_name;
        }
        if (types.includes("street_number")) {
          streetNumber = component.long_name;
        }
        if (
          types.includes("sublocality_level_1") ||
          types.includes("sublocality")
        ) {
          neighborhood = component.long_name;
        }
        if (types.includes("administrative_area_level_2")) {
          city = component.long_name;
        }
        if (types.includes("administrative_area_level_1")) {
          state = component.short_name;
        }
      }

      let address = route;
      if (streetNumber) address += `, ${streetNumber}`;
      if (neighborhood) address += ` - ${neighborhood}`;

      if (!address && place.formatted_address) {
        address = place.formatted_address;
      }

      setFormData((prev) => ({
        ...prev,
        address,
        city,
        state,
      }));
    });

    autocompleteRef.current = autocomplete;
  }, [open, googleLoaded]);

  // Fix z-index for Google Places dropdown inside dialog
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = ".pac-container { z-index: 10000 !important; }";
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Reset autocomplete ref when dialog closes
  useEffect(() => {
    if (!open) {
      autocompleteRef.current = null;
    }
  }, [open]);

  const loadAvailableStaff = async () => {
    try {
      const [judges, speakers] = await Promise.all([
        listUsers({ role: UserRoleEnum.JUDGE }),
        listUsers({ role: UserRoleEnum.SPEAKER }),
      ]);
      setAvailableJudges(Array.isArray(judges) ? judges : []);
      setAvailableSpeakers(Array.isArray(speakers) ? speakers : []);
    } catch {
      // Falha ao carregar staff
    }
  };

  const loadCategories = async () => {
    try {
      const response = await listCategories();
      if (response.data && Array.isArray(response.data)) {
        setAvailableCategories(
          response.data.map((cat: any) => ({
            id: cat.category?.id || cat.id,
            name: getCategoryNameMap(cat.name as CategoryNameEnum, cat.description),
          }))
        );
      } else if (Array.isArray(response)) {
        setAvailableCategories(
          response.map((cat: any) => ({
            id: cat.category?.id || cat.id,
            name: getCategoryNameMap(cat.name as CategoryNameEnum, cat.description),
          }))
        );
      }
    } catch {
      setAvailableCategories([]);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione uma imagem válida",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Imagem muito grande",
        description: "A imagem deve ter no máximo 5MB",
        variant: "destructive",
      });
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setSelectedImage({ file, preview: previewUrl });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeSelectedImage = () => {
    if (selectedImage?.preview) {
      URL.revokeObjectURL(selectedImage.preview);
    }
    setSelectedImage(null);
  };

  const handleCreateStaff = async (
    role: UserRoleEnum.JUDGE | UserRoleEnum.SPEAKER
  ) => {
    const form = role === UserRoleEnum.JUDGE ? newJudgeForm : newSpeakerForm;
    const label = role === UserRoleEnum.JUDGE ? "Juiz" : "Locutor";

    if (!form.name || !form.email || !form.cpf || !form.phone || !form.password) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos para criar o " + label.toLowerCase(),
        variant: "destructive",
      });
      return;
    }

    setCreatingStaff(true);
    try {
      const newUser = await createFullUser({
        name: form.name,
        email: form.email,
        password: form.password,
        cpf: form.cpf,
        phone: form.phone,
        role,
        nature: UserNatureEnum.MALE,
        city: "",
        state: "",
        isActive: true,
      });

      const userResponse: GetUserResponse = {
        id: newUser.id,
        name: form.name,
        email: form.email,
        cpf: form.cpf,
        phone: form.phone,
        role,
        nature: UserNatureEnum.MALE,
        city: "",
        state: "",
        isActive: true,
      };

      if (role === UserRoleEnum.JUDGE) {
        setSelectedJudges((prev) => [...prev, userResponse]);
        setAvailableJudges((prev) => [...prev, userResponse]);
        setNewJudgeForm({ ...emptyStaffForm });
        setShowCreateJudge(false);
      } else {
        setSelectedSpeakers((prev) => [...prev, userResponse]);
        setAvailableSpeakers((prev) => [...prev, userResponse]);
        setNewSpeakerForm({ ...emptyStaffForm });
        setShowCreateSpeaker(false);
      }

      toast({
        title: `${label} criado com sucesso!`,
        description: `${form.name} foi criado e adicionado ao evento.`,
      });
    } catch (error: any) {
      const msg =
        error?.response?.data?.message || `Erro ao criar ${label.toLowerCase()}`;
      toast({
        title: `Erro ao criar ${label.toLowerCase()}`,
        description: msg,
        variant: "destructive",
      });
    } finally {
      setCreatingStaff(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Digite o nome da nova categoria",
        variant: "destructive",
      });
      return;
    }

    setCreatingCategory(true);
    try {
      const response = await createCategory({
        name: CategoryNameEnum.CUSTOM,
        description: newCategoryName.trim(),
      });

      const newCat = {
        id: response.id,
        name: newCategoryName.trim(),
      };
      setAvailableCategories((prev) => [...prev, newCat]);
      setNewCategoryName("");
      setShowCreateCategory(false);
      toast({
        title: "Categoria criada!",
        description: `A categoria "${newCategoryName.trim()}" foi criada com sucesso.`,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao criar categoria",
        description: error?.response?.data?.message || "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setCreatingCategory(false);
    }
  };

  // Categories
  const addEventCategory = () => {
    setEventCategories((prev) => [
      ...prev,
      {
        categoryId: "",
        categoryName: "",
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

  const removeEventCategory = (index: number) => {
    setEventCategories((prev) => prev.filter((_, i) => i !== index));
  };

  const updateEventCategoryField = (
    index: number,
    field: keyof EventCategoryForm,
    value: string
  ) => {
    setEventCategories((prev) =>
      prev.map((cat, i) => (i === index ? { ...cat, [field]: value } : cat))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.name || formData.name.length < 3) {
        toast({
          title: "Nome muito curto",
          description: "O nome do evento deve ter pelo menos 3 caracteres",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (!formData.description) {
        toast({
          title: "Descrição obrigatória",
          description: "Por favor, adicione uma descrição para o evento",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (formData.description.length > 1000) {
        toast({
          title: "Descrição muito longa",
          description: "A descrição deve ter no máximo 1000 caracteres",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (!formData.startAt || !formData.endAt || !formData.purchaseClosedAt) {
        toast({
          title: "Datas obrigatórias",
          description: "Por favor, preencha todas as datas",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const startDate = new Date(formData.startAt);
      const endDate = new Date(formData.endAt);
      const purchaseClosedDate = new Date(formData.purchaseClosedAt);

      if (startDate >= endDate) {
        toast({
          title: "Datas inválidas",
          description: "A data de início deve ser anterior à data de término",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (purchaseClosedDate > endDate) {
        toast({
          title: "Data de inscrição inválida",
          description:
            "A data limite para inscrições não pode ser após o término do evento",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "Não autenticado",
          description: "Por favor, faça login novamente",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      let response;

      if (selectedImage) {
        setUploadingImage(true);

        const formDataToSend = new FormData();
        formDataToSend.append("name", formData.name);
        formDataToSend.append("description", formData.description);
        formDataToSend.append(
          "startAt",
          `${formData.startAt}T12:00:00.000Z`
        );
        formDataToSend.append("endAt", `${formData.endAt}T12:00:00.000Z`);
        formDataToSend.append(
          "purchaseClosedAt",
          `${formData.purchaseClosedAt}T12:00:00.000Z`
        );
        formDataToSend.append("status", formData.status);
        formDataToSend.append("isPublic", formData.isPublic.toString());

        if (formData.prize) {
          formDataToSend.append(
            "prize",
            formData.prize.replace(/[^\d,]/g, "").replace(",", ".")
          );
        }
        if (formData.address)
          formDataToSend.append("address", formData.address);
        if (formData.city) formDataToSend.append("city", formData.city);
        if (formData.state) formDataToSend.append("state", formData.state);

        if (formData.cattlePerPassword) {
          formDataToSend.append(
            "cattlePerPassword",
            formData.cattlePerPassword
          );
        }
        formDataToSend.append(
          "useAbvaqRules",
          formData.useAbvaqRules.toString()
        );
        if (!formData.useAbvaqRules && formData.customRules) {
          formDataToSend.append("customRules", formData.customRules);
        }

        formDataToSend.append("banner", selectedImage.file);
        response = await createEventWithBanner(formDataToSend);
      } else {
        const eventData = {
          name: formData.name,
          description: formData.description,
          prize: formData.prize
            ? formData.prize.replace(/[^\d,]/g, "").replace(",", ".")
            : undefined,
          address: formData.address || undefined,
          city: formData.city || undefined,
          state: formData.state || undefined,
          startAt: `${formData.startAt}T12:00:00.000Z`,
          endAt: `${formData.endAt}T12:00:00.000Z`,
          purchaseClosedAt: `${formData.purchaseClosedAt}T12:00:00.000Z`,
          status: formData.status,
          isPublic: formData.isPublic,
          cattlePerPassword: formData.cattlePerPassword
            ? parseInt(formData.cattlePerPassword)
            : undefined,
          useAbvaqRules: formData.useAbvaqRules,
          customRules: !formData.useAbvaqRules
            ? formData.customRules
            : undefined,
        };
        response = await createEvent(eventData);
      }

      if (response) {
        const eventId = response.id;

        if (eventId) {
          // Add judges and speakers
          const staffPromises: Promise<void>[] = [];
          for (const judge of selectedJudges) {
            staffPromises.push(addJudgeToEvent(eventId, judge.id));
          }
          for (const speaker of selectedSpeakers) {
            staffPromises.push(addSpeakerToEvent(eventId, speaker.id));
          }
          try {
            await Promise.all(staffPromises);
          } catch {
            toast({
              title: "Aviso",
              description:
                "Evento criado, mas houve erro ao adicionar alguns membros da equipe.",
              variant: "destructive",
            });
          }

          // Create event categories
          const validCategories = eventCategories.filter(
            (cat) => cat.categoryId && cat.price
          );
          if (validCategories.length > 0) {
            const categoryPromises = validCategories.map((cat) =>
              createEventCategory({
                eventId,
                categoryId: cat.categoryId,
                price: Number(cat.price),
                maxRunners: Number(cat.maxRunners) || 0,
                passwordLimit: Number(cat.passwordLimit) || 0,
                startAt:
                  cat.startAt ? `${cat.startAt}T12:00:00.000Z` : `${formData.startAt}T12:00:00.000Z`,
                endAt: cat.endAt ? `${cat.endAt}T12:00:00.000Z` : `${formData.endAt}T12:00:00.000Z`,
              })
            );
            try {
              await Promise.all(categoryPromises);
            } catch {
              toast({
                title: "Aviso",
                description:
                  "Evento criado, mas houve erro ao adicionar algumas categorias.",
                variant: "destructive",
              });
            }
          }
        }

        toast({
          title: "Evento criado com sucesso!",
          description: selectedImage
            ? "Banner enviado e evento criado."
            : "Seu evento foi criado.",
        });

        setOpen(false);
        resetForm();

        if (onEventCreated) {
          onEventCreated();
        }
      }
    } catch (error: any) {
      let errorMessage = "Ocorreu um erro ao criar o evento. Tente novamente.";

      if (error.response?.status === 413) {
        errorMessage =
          "Arquivo de imagem muito grande. Tente uma imagem menor.";
      } else if (error.response?.status === 415) {
        errorMessage = "Tipo de arquivo não suportado. Use JPG, PNG ou WEBP.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Erro ao criar evento",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setUploadingImage(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      prize: "",
      description: "",
      address: "",
      city: "",
      state: "",
      startAt: "",
      endAt: "",
      purchaseClosedAt: "",
      status: EventStatusEnum.SCHEDULED,
      bannerUrl: "",
      isPublic: true,
      cattlePerPassword: "",
      useAbvaqRules: true,
      customRules: "",
    });

    if (selectedImage?.preview) {
      URL.revokeObjectURL(selectedImage.preview);
    }
    setSelectedImage(null);
    setSelectedJudges([]);
    setSelectedSpeakers([]);
    setEventCategories([]);
    setShowCreateJudge(false);
    setShowCreateSpeaker(false);
    setNewJudgeForm({ ...emptyStaffForm });
    setNewSpeakerForm({ ...emptyStaffForm });
  };

  const getMinDate = () => {
    return new Date().toISOString().split("T")[0];
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const renderStaffForm = (
    role: UserRoleEnum.JUDGE | UserRoleEnum.SPEAKER
  ) => {
    const form = role === UserRoleEnum.JUDGE ? newJudgeForm : newSpeakerForm;
    const setForm =
      role === UserRoleEnum.JUDGE ? setNewJudgeForm : setNewSpeakerForm;
    const setShow =
      role === UserRoleEnum.JUDGE ? setShowCreateJudge : setShowCreateSpeaker;
    const label = role === UserRoleEnum.JUDGE ? "Juiz" : "Locutor";

    return (
      <Card className="p-4 border-2 border-primary/20 bg-primary/5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold">Novo {label}</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setShow(false);
              setForm({ ...emptyStaffForm });
            }}
            className="h-7 w-7 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Nome *</Label>
            <Input
              placeholder="Nome completo"
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              className="h-9 text-sm rounded-lg"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Email *</Label>
            <Input
              type="email"
              placeholder="email@exemplo.com"
              value={form.email}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, email: e.target.value }))
              }
              className="h-9 text-sm rounded-lg"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">CPF *</Label>
            <Input
              placeholder="000.000.000-00"
              value={form.cpf}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, cpf: e.target.value }))
              }
              className="h-9 text-sm rounded-lg"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Telefone *</Label>
            <Input
              placeholder="(00) 00000-0000"
              value={form.phone}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, phone: e.target.value }))
              }
              className="h-9 text-sm rounded-lg"
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label className="text-xs">Senha *</Label>
            <Input
              type="password"
              placeholder="Senha de acesso"
              value={form.password}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, password: e.target.value }))
              }
              className="h-9 text-sm rounded-lg"
            />
          </div>
        </div>

        <Button
          type="button"
          size="sm"
          className="mt-3 rounded-lg"
          onClick={() => handleCreateStaff(role)}
          disabled={creatingStaff}
        >
          {creatingStaff ? (
            <>
              <div className="w-3 h-3 border-2 border-background border-t-transparent rounded-full animate-spin mr-2" />
              Criando...
            </>
          ) : (
            <>
              <Plus className="h-3 w-3 mr-1" />
              Criar e Adicionar
            </>
          )}
        </Button>
      </Card>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="rounded-xl bg-primary hover:bg-primary/90 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Novo Evento
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Calendar className="h-5 w-5 text-primary" />
            Criar Novo Evento
          </DialogTitle>
          <DialogDescription>
            Preencha as informações do seu evento de vaquejada
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Informações Básicas
              </h3>

              {/* Nome do Evento */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Nome do Evento *
                </Label>
                <Input
                  id="name"
                  placeholder="Ex: Vaquejada de Primavera 2024"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                  minLength={3}
                  maxLength={200}
                  className="rounded-xl border-2 focus:border-primary/50"
                />
                <p className="text-xs text-muted-foreground">
                  Mínimo 3 caracteres, máximo 200 caracteres
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prize" className="text-sm font-medium">
                  Premiação
                </Label>
                <Input
                  id="prize"
                  placeholder="Ex: R$ 10.000,00"
                  value={formData.prize}
                  onChange={(e) => {
                    let value = e.target.value.replace(/\D/g, "");
                    value = (Number(value) / 100).toFixed(2);
                    const masked = value
                      .replace(".", ",")
                      .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
                    handleInputChange("prize", masked ? `R$ ${masked}` : "");
                  }}
                  minLength={3}
                  maxLength={200}
                  className="rounded-xl border-2 focus:border-primary/50"
                  inputMode="numeric"
                />
              </div>

              {/* Descrição */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Descrição do Evento *
                </Label>
                <Textarea
                  id="description"
                  placeholder="Descreva detalhes do evento, estrutura, atrações, regras..."
                  rows={4}
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  required
                  maxLength={1000}
                  className="rounded-xl border-2 focus:border-primary/50"
                />
                <p className="text-xs text-muted-foreground">
                  {formData.description.length}/1000 caracteres
                </p>
              </div>

              {/* Upload de Banner */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Banner do Evento (Opcional)
                </Label>
                <p className="text-xs text-muted-foreground">
                  Formato retrato recomendado - PNG, JPG, WEBP até 5MB
                </p>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  accept="image/*"
                  className="hidden"
                />

                {selectedImage ? (
                  <div className="relative group">
                    <div className="border-2 border-dashed border-primary/20 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-green-600 flex items-center gap-2">
                          <Image className="h-4 w-4" />
                          Imagem selecionada (Retrato)
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
                      <div className="flex justify-center">
                        <div className="relative w-48 h-64 bg-muted rounded-lg overflow-hidden border-2">
                          <img
                            src={selectedImage.preview}
                            alt="Preview do banner"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        {selectedImage.file.name} -{" "}
                        {(selectedImage.file.size / 1024 / 1024).toFixed(2)}MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={triggerFileInput}
                    className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors group"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Upload className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          Clique para fazer upload do banner
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Formato retrato - PNG, JPG, WEBP até 5MB
                        </p>
                      </div>
                      <div className="flex items-center justify-center gap-4 mt-2">
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-16 h-20 border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center">
                            <div className="w-8 h-10 bg-primary/10 rounded" />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            Recomendado
                          </span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-20 h-16 border border-muted-foreground/20 rounded-lg flex items-center justify-center">
                            <div className="w-10 h-8 bg-muted rounded" />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            Paisagem
                          </span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-lg mt-2"
                      >
                        Selecionar Imagem
                      </Button>
                    </div>
                  </div>
                )}

                {!selectedImage && (
                  <div className="space-y-2 pt-2">
                    <Label htmlFor="bannerUrl" className="text-sm font-medium">
                      Ou insira a URL do Banner (Opcional)
                    </Label>
                    <Input
                      id="bannerUrl"
                      type="url"
                      placeholder="https://exemplo.com/banner.jpg"
                      value={formData.bannerUrl}
                      onChange={(e) =>
                        handleInputChange("bannerUrl", e.target.value)
                      }
                      className="rounded-xl border-2 focus:border-primary/50"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Localização com Google Places */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Localização
              </h3>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium">
                  Endereço (Opcional)
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="address"
                    ref={addressInputRef}
                    placeholder={
                      googleLoaded
                        ? "Busque o endereço pelo Google..."
                        : "Rua, número, bairro"
                    }
                    value={formData.address}
                    onChange={(e) =>
                      handleInputChange("address", e.target.value)
                    }
                    maxLength={500}
                    className="rounded-xl border-2 focus:border-primary/50 pl-10"
                  />
                </div>
                {googleLoaded && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Busca via Google Places ativada - cidade e estado serão
                    preenchidos automaticamente
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm font-medium">
                    Cidade (Opcional)
                  </Label>
                  <Input
                    id="city"
                    placeholder="Nome da cidade"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    maxLength={100}
                    className="rounded-xl border-2 focus:border-primary/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state" className="text-sm font-medium">
                    Estado (Opcional)
                  </Label>
                  <Select
                    value={formData.state}
                    onValueChange={(value) => handleInputChange("state", value)}
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
              </div>

              {/* Mapa do Google */}
              {(formData.address || formData.city) && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Localização no Mapa
                  </Label>
                  <div className="rounded-xl overflow-hidden border-2 border-muted">
                    <iframe
                      title="Localização do evento"
                      width="100%"
                      height="250"
                      style={{ border: 0 }}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(
                        [formData.address, formData.city, formData.state]
                          .filter(Boolean)
                          .join(", ")
                      )}&z=15&ie=UTF8&iwloc=&output=embed`}
                    />
                  </div>
                  <div className="flex justify-end">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        [formData.address, formData.city, formData.state]
                          .filter(Boolean)
                          .join(", ")
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      <MapPin className="h-3 w-3" />
                      Abrir no Google Maps
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Datas */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Datas
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startAt" className="text-sm font-medium">
                    Data de Início *
                  </Label>
                  <Input
                    id="startAt"
                    type="date"
                    value={formData.startAt}
                    onChange={(e) =>
                      handleInputChange("startAt", e.target.value)
                    }
                    required
                    min={getMinDate()}
                    className="rounded-xl border-2 focus:border-primary/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endAt" className="text-sm font-medium">
                    Data de Término *
                  </Label>
                  <Input
                    id="endAt"
                    type="date"
                    value={formData.endAt}
                    onChange={(e) => handleInputChange("endAt", e.target.value)}
                    required
                    min={formData.startAt || getMinDate()}
                    className="rounded-xl border-2 focus:border-primary/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="purchaseClosedAt"
                    className="text-sm font-medium"
                  >
                    Fim das Inscrições *
                  </Label>
                  <Input
                    id="purchaseClosedAt"
                    type="date"
                    value={formData.purchaseClosedAt}
                    onChange={(e) =>
                      handleInputChange("purchaseClosedAt", e.target.value)
                    }
                    required
                    min={getMinDate()}
                    max={formData.endAt}
                    className="rounded-xl border-2 focus:border-primary/50"
                  />
                </div>
              </div>
            </div>

            {/* Configurações */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                Configurações
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-medium">
                    Status do Evento *
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: EventStatusEnum) =>
                      handleInputChange("status", value)
                    }
                  >
                    <SelectTrigger className="rounded-xl border-2 focus:border-primary/50">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={EventStatusEnum.SCHEDULED}>
                        Agendado
                      </SelectItem>
                      <SelectItem value={EventStatusEnum.LIVE}>
                        Ao Vivo
                      </SelectItem>
                      <SelectItem value={EventStatusEnum.CANCELLED}>
                        Cancelado
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="isPublic" className="text-sm font-medium">
                    Visibilidade *
                  </Label>
                  <Select
                    value={formData.isPublic ? "public" : "private"}
                    onValueChange={(value) =>
                      handleInputChange("isPublic", value === "public")
                    }
                  >
                    <SelectTrigger className="rounded-xl border-2 focus:border-primary/50">
                      <SelectValue placeholder="Selecione a visibilidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Público</SelectItem>
                      <SelectItem value="private">Privado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Equipe do Evento */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Equipe do Evento
              </h3>

              {/* Juízes */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Gavel className="h-4 w-4" />
                    Juízes
                  </Label>
                  <div className="flex items-center gap-2">
                    <Select
                      value=""
                      onValueChange={(userId) => {
                        const judge = availableJudges.find(
                          (j) => j.id === userId
                        );
                        if (
                          judge &&
                          !selectedJudges.some((j) => j.id === userId)
                        ) {
                          setSelectedJudges((prev) => [...prev, judge]);
                        }
                      }}
                    >
                      <SelectTrigger className="w-52 rounded-xl border-2 focus:border-primary/50">
                        <SelectValue placeholder="Selecionar juiz..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableJudges
                          .filter(
                            (j) => !selectedJudges.some((s) => s.id === j.id)
                          )
                          .map((judge) => (
                            <SelectItem key={judge.id} value={judge.id}>
                              {judge.name} - {judge.email}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      onClick={() => setShowCreateJudge(!showCreateJudge)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Novo
                    </Button>
                  </div>
                </div>

                {showCreateJudge && renderStaffForm(UserRoleEnum.JUDGE)}

                {selectedJudges.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {selectedJudges.map((judge) => (
                      <Card key={judge.id} className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{judge.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {judge.email}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setSelectedJudges((prev) =>
                                prev.filter((j) => j.id !== judge.id)
                              )
                            }
                            className="text-destructive hover:text-destructive/80 h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Nenhum juiz selecionado
                  </p>
                )}
              </div>

              {/* Locutores */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Mic className="h-4 w-4" />
                    Locutores
                  </Label>
                  <div className="flex items-center gap-2">
                    <Select
                      value=""
                      onValueChange={(userId) => {
                        const speaker = availableSpeakers.find(
                          (s) => s.id === userId
                        );
                        if (
                          speaker &&
                          !selectedSpeakers.some((s) => s.id === userId)
                        ) {
                          setSelectedSpeakers((prev) => [...prev, speaker]);
                        }
                      }}
                    >
                      <SelectTrigger className="w-52 rounded-xl border-2 focus:border-primary/50">
                        <SelectValue placeholder="Selecionar locutor..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSpeakers
                          .filter(
                            (s) =>
                              !selectedSpeakers.some(
                                (sel) => sel.id === s.id
                              )
                          )
                          .map((speaker) => (
                            <SelectItem key={speaker.id} value={speaker.id}>
                              {speaker.name} - {speaker.email}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      onClick={() => setShowCreateSpeaker(!showCreateSpeaker)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Novo
                    </Button>
                  </div>
                </div>

                {showCreateSpeaker && renderStaffForm(UserRoleEnum.SPEAKER)}

                {selectedSpeakers.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {selectedSpeakers.map((speaker) => (
                      <Card key={speaker.id} className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">
                              {speaker.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {speaker.email}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setSelectedSpeakers((prev) =>
                                prev.filter((s) => s.id !== speaker.id)
                              )
                            }
                            className="text-destructive hover:text-destructive/80 h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Nenhum locutor selecionado
                  </p>
                )}
              </div>
            </div>

            {/* Categorias do Evento */}
            <div className="space-y-4">
              <div className="flex items-center justify-between sticky top-0 z-10 bg-background py-2">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Tag className="h-4 w-4 text-primary" />
                  Categorias do Evento
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={addEventCategory}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar Categoria
                </Button>
              </div>

              {/* Criar nova categoria */}
              {!showCreateCategory ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-primary"
                  onClick={() => setShowCreateCategory(true)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Criar nova categoria personalizada
                </Button>
              ) : (
                <Card className="p-4 border-2 border-primary/20 bg-primary/5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold">Nova Categoria</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowCreateCategory(false);
                        setNewCategoryName("");
                      }}
                      className="h-7 w-7 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nome da categoria (ex: Amador Regional)"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="h-9 text-sm rounded-lg flex-1"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleCreateCategory}
                      disabled={creatingCategory}
                      className="rounded-lg"
                    >
                      {creatingCategory ? "Criando..." : "Criar"}
                    </Button>
                  </div>
                </Card>
              )}

              {eventCategories.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Nenhuma categoria adicionada. Você pode adicionar categorias
                  agora ou depois de criar o evento.
                </p>
              )}

              {eventCategories.map((cat, index) => (
                <Card key={index} className="p-4 border-2">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-semibold text-sm">
                      {cat.categoryName || `Categoria ${index + 1}`}
                    </h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEventCategory(index)}
                      className="text-destructive hover:text-destructive/80 h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Categoria *</Label>
                      <Select
                        value={cat.categoryId}
                        onValueChange={(value) => {
                          updateEventCategoryField(index, "categoryId", value);
                          const found = availableCategories.find(
                            (c) => c.id === value
                          );
                          if (found) {
                            updateEventCategoryField(
                              index,
                              "categoryName",
                              found.name
                            );
                          }
                        }}
                      >
                        <SelectTrigger className="rounded-lg border-2 h-9 text-sm">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCategories.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Preço (R$) *</Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={cat.price}
                        onChange={(e) =>
                          updateEventCategoryField(
                            index,
                            "price",
                            e.target.value
                          )
                        }
                        min="0"
                        step="0.01"
                        className="h-9 text-sm rounded-lg"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Máx. Participantes</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={cat.maxRunners}
                        onChange={(e) =>
                          updateEventCategoryField(
                            index,
                            "maxRunners",
                            e.target.value
                          )
                        }
                        min="0"
                        className="h-9 text-sm rounded-lg"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Limite de Senhas</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={cat.passwordLimit}
                        onChange={(e) =>
                          updateEventCategoryField(
                            index,
                            "passwordLimit",
                            e.target.value
                          )
                        }
                        min="0"
                        className="h-9 text-sm rounded-lg"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Qtd. de Boi</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={cat.cattleQuantity}
                        onChange={(e) =>
                          updateEventCategoryField(
                            index,
                            "cattleQuantity",
                            e.target.value
                          )
                        }
                        min="0"
                        className="h-9 text-sm rounded-lg"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Premiação (R$)</Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={cat.prize}
                        onChange={(e) =>
                          updateEventCategoryField(
                            index,
                            "prize",
                            e.target.value
                          )
                        }
                        min="0"
                        step="0.01"
                        className="h-9 text-sm rounded-lg"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Início</Label>
                      <Input
                        type="date"
                        value={cat.startAt}
                        onChange={(e) =>
                          updateEventCategoryField(
                            index,
                            "startAt",
                            e.target.value
                          )
                        }
                        className="h-9 text-sm rounded-lg"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Término</Label>
                      <Input
                        type="date"
                        value={cat.endAt}
                        onChange={(e) =>
                          updateEventCategoryField(
                            index,
                            "endAt",
                            e.target.value
                          )
                        }
                        className="h-9 text-sm rounded-lg"
                      />
                    </div>
                  </div>
                </Card>
              ))}

              {eventCategories.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl w-full"
                  onClick={addEventCategory}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar Outra Categoria
                </Button>
              )}
            </div>

            {/* Regras do Evento */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                Regras do Evento
              </h3>

              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="useAbvaqRules"
                      checked={formData.useAbvaqRules}
                      onCheckedChange={(checked) =>
                        handleInputChange("useAbvaqRules", checked === true)
                      }
                    />
                    <div className="space-y-1">
                      <Label
                        htmlFor="useAbvaqRules"
                        className="text-sm font-medium cursor-pointer"
                      >
                        Usar regras da ABVAQ
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Aplicar as regras oficiais da Associação Brasileira de
                        Vaquejada
                      </p>
                    </div>
                  </div>

                  {formData.useAbvaqRules && (
                    <div className="ml-7 p-3 bg-primary/5 rounded-xl border border-primary/20">
                      <p className="text-sm text-muted-foreground">
                        As regras oficiais da ABVAQ serão aplicadas a este
                        evento.{" "}
                        <a
                          href="https://abvaq.com.br/regulamento"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline font-medium"
                        >
                          Ver regulamento completo
                        </a>
                      </p>
                    </div>
                  )}

                  {!formData.useAbvaqRules && (
                    <div className="ml-7 space-y-2">
                      <Label
                        htmlFor="customRules"
                        className="text-sm font-medium"
                      >
                        Regras Personalizadas *
                      </Label>
                      <Textarea
                        id="customRules"
                        placeholder="Descreva as regras específicas deste evento..."
                        rows={4}
                        value={formData.customRules}
                        onChange={(e) =>
                          handleInputChange("customRules", e.target.value)
                        }
                        className="rounded-xl border-2 focus:border-primary/50"
                        required={!formData.useAbvaqRules}
                      />
                      <p className="text-xs text-muted-foreground">
                        Insira as regras que serão aplicadas neste evento
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                resetForm();
              }}
              className="rounded-xl border-2"
              disabled={loading || uploadingImage}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || uploadingImage}
              className="rounded-xl bg-primary hover:bg-primary/90"
            >
              {loading || uploadingImage ? (
                <>
                  <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin mr-2" />
                  {uploadingImage ? "Enviando imagem..." : "Criando..."}
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Evento
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
