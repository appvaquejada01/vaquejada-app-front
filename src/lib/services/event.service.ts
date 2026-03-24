import { api } from "@/api/api-connection";
import { Runner } from "@/types/api";
import { CreateEventDto, UploadBannerResponse } from "@/types/dtos/event.dto";

export async function listEvents() {
  try {
    const response = await api.get("/events");
    return response.data;
  } catch (error) {
    throw new Error("Erro ao listar eventos");
  }
}

export async function createEvent(eventData: CreateEventDto) {
  try {
    const response = await api.post("/events", eventData);
    return response.data;
  } catch (error) {
    throw new Error("Erro ao criar evento");
  }
}

export const createEventWithBanner = async (formData: FormData) => {
  const response = await api.post("/events/with-banner", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    timeout: 30000, // 30 segundos para uploads
  });
  return response.data;
};

export async function getEventById(eventId: string) {
  try {
    const response = await api.get(`/events/${eventId}`);
    return response.data;
  } catch (error) {
    throw new Error("Erro ao obter evento");
  }
}

export async function getEventCategories(eventId: string) {
  try {
    const response = await api.get(`/event-categories`, {
      params: { eventId },
    });
    return response.data;
  } catch (error) {
    throw new Error("Erro ao obter categorias do evento");
  }
}

export async function updateEvent(
  eventId: string,
  eventData: Partial<CreateEventDto>
) {
  try {
    const response = await api.put(`/events/${eventId}`, eventData);
    return response.data;
  } catch (error) {
    throw new Error("Erro ao atualizar evento");
  }
}

export async function createEventCategory(eventCategoryData: {
  eventId: string;
  categoryId: string;
  price: number;
  passwordLimit: number;
  startAt: string;
  endAt: string;
  maxRunners: number;
  cattleQuantity?: number;
  prize?: number;
  initialPassword?: number;
  finalPassword?: number;
}) {
  try {
    const response = await api.post("/event-categories", eventCategoryData);
    return response.data;
  } catch (error) {
    throw new Error("Erro ao criar categoria do evento");
  }
}

export async function updateEventCategory(
  eventCategoryId: string,
  eventCategoryData: Partial<{
    eventId: string;
    categoryId: string;
    passwordLimit: number;
    price: number;
    startAt: string;
    endAt: string;
    maxRunners: number;
    cattleQuantity: number;
    prize: number;
  }>
) {
  try {
    const response = await api.put(
      `/event-categories/${eventCategoryId}`,
      eventCategoryData
    );
    return response.data;
  } catch (error) {
    throw new Error("Erro ao atualizar categoria do evento");
  }
}

export async function deleteEventCategory(
  eventId: string,
  eventCategoryId: string
) {
  try {
    await api.delete(`/event-categories/${eventCategoryId}/${eventId}`);
  } catch (error) {
    throw new Error("Erro ao deletar categoria do evento");
  }
}

export const uploadEventBanner = async (
  eventId: string,
  formData: FormData
): Promise<UploadBannerResponse> => {
  try {
    const response = await api.put(
      `/events/${eventId}/upload-banner`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Erro no upload do banner:", error);
    throw error;
  }
};

export const deleteEventBanner = async (eventId: string) => {
  try {
    await api.delete(`/events/${eventId}/delete-banner`);
  } catch (error) {
    console.error("Erro ao deletar o banner:", error);
    throw error;
  }
};

export const getEventRunners = async (eventId: string): Promise<Runner[]> => {
  const response = await api.get(`/events/${eventId}/runners`);
  return response.data;
};

export const submitVote = async (
  eventId: string,
  runnerId: string,
  approved: boolean
): Promise<void> => {
  const response = await api.post(`/events/${eventId}/vote`, {
    runnerId,
    approved,
  });
  return response.data;
};
