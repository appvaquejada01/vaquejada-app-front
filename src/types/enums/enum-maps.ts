import {
  UserRoleEnum,
  EventStatusEnum,
  CategoryNameEnum,
  SubscriptionStatusEnum,
  UserNatureEnum,
} from "./api-enums";

const categoryNameMap: Record<CategoryNameEnum, string> = {
  [CategoryNameEnum.AMATEUR]: "Amador",
  [CategoryNameEnum.PROFESSIONAL]: "Profissional",
  [CategoryNameEnum.MASTER]: "Master",
  [CategoryNameEnum.FEMALE]: "Feminino",
  [CategoryNameEnum.JUNIOR]: "Júnior",
  [CategoryNameEnum.INTERMEDIARY]: "Intermediário",
  [CategoryNameEnum.DERBY]: "Derby",
  [CategoryNameEnum.ASPIRANT]: "Aspirante",
  [CategoryNameEnum.YOUNG]: "Jovem",
  [CategoryNameEnum.CUSTOM]: "Personalizada",
};

export const getCategoryNameMap = (categoria: CategoryNameEnum, description?: string) => {
  if (categoria === CategoryNameEnum.CUSTOM && description) {
    return description;
  }
  return categoryNameMap[categoria] ?? categoria;
};

const eventStatusMap: Record<EventStatusEnum, string> = {
  [EventStatusEnum.LIVE]: "Ao Vivo",
  [EventStatusEnum.SCHEDULED]: "Agendado",
  [EventStatusEnum.CANCELLED]: "Cancelado",
  [EventStatusEnum.FINISHED]: "Finalizado",
};

export const getEventStatusMap = (status: EventStatusEnum) => {
  return eventStatusMap[status] ?? status;
};

const subscriptionStatusMap: Record<SubscriptionStatusEnum, string> = {
  [SubscriptionStatusEnum.CONFIRMED]: "Confirmado",
  [SubscriptionStatusEnum.PENDING]: "Pendente",
  [SubscriptionStatusEnum.CANCELLED]: "Cancelado",
};

export const getSubscriptionStatusMap = (status: SubscriptionStatusEnum) => {
  return subscriptionStatusMap[status] ?? status;
};

export const roleMap: Record<UserRoleEnum, string> = {
  [UserRoleEnum.ADMIN]: "Administrador",
  [UserRoleEnum.ORGANIZER]: "Organizador",
  [UserRoleEnum.RUNNER]: "Corredor",
  [UserRoleEnum.USER]: "Usuário",
  [UserRoleEnum.JUDGE]: "Juiz",
  [UserRoleEnum.SPEAKER]: "Locutor",
};

export const getRoleMap = (role: UserRoleEnum) => {
  return roleMap[role] ?? role;
};

export const natureMap: Record<UserNatureEnum, string> = {
  [UserNatureEnum.MALE]: "Masculino",
  [UserNatureEnum.FEMALE]: "Feminino",
  [UserNatureEnum.OTHER]: "Outro",
};

export const getNatureMap = (nature: UserNatureEnum) => {
  return natureMap[nature] ?? nature;
};
