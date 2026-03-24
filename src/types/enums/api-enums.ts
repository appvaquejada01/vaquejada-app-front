export enum UserNatureEnum {
  MALE = "male",
  FEMALE = "female",
  OTHER = "other",
}

export enum UserRoleEnum {
  ADMIN = "admin",
  ORGANIZER = "organizer",
  RUNNER = "runner",
  JUDGE = "judge",
  SPEAKER = "speaker",
  USER = "user",
}

export enum EventStatusEnum {
  SCHEDULED = "scheduled",
  LIVE = "live",
  FINISHED = "finished",
  CANCELLED = "cancelled",
}

export enum PasswordStatusEnum {
  AVAILABLE = "available",
  USED = "used",
  RESERVED = "reserved",
  PENDING   = "pending",
}

export enum CategoryNameEnum {
  PROFESSIONAL = "professional",
  AMATEUR = "amateur",
  JUNIOR = "junior",
  FEMALE = "feminine",
  INTERMEDIARY = "intermediary",
  DERBY = "derby",
  ASPIRANT = "aspirant",
  MASTER = "master",
  YOUNG = "young",
  CUSTOM = "custom",
}

export enum SubscriptionStatusEnum {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  CANCELLED = "cancelled",
}

export enum JudgeVoteEnum {
  VALID = "valeu_o_boi",
  NULL = "nulo",
  TV = "tv",
  DID_NOT_RUN = "boi_nao_quis_correr",
}
