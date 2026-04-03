import { Judge, Runner } from "../api";
import {
  CategoryNameEnum,
  EventStatusEnum,
  JudgeVoteEnum,
} from "../enums/api-enums";

export interface JudgeVoteRequest {
  judgeId: string;
  eventId: string;
  passwordId: string;
  vote: JudgeVoteEnum;
  cattleNumber?: number;
  comments?: string;
}

export interface JudgeVoteResponse {
  id: string;
  judgeId: string;
  eventId: string;
  passwordId: string;
  vote: JudgeVoteEnum;
  cattleNumber?: number;
  comments?: string;
  createdAt: string;
}

export interface EventVotesSummary {
  eventId: string;
  activeJudges: number;
  validVotes: number;
  nullVotes: number;
  tvVotes: number;
  didNotRunVotes: number;
  passwordVotes: PasswordVotes[];
}

export interface PasswordVotes {
  passwordId: string;
  votes: JudgeVoteInfo[];
}

export interface JudgeVoteInfo {
  judgeId: string;
  judgeName: string;
  vote: JudgeVoteEnum;
  votedAt: string;
}

export interface SpeakerEvent {
  id: string;
  name: string;
  description: string;
  location: string;
  startAt: string;
  endAt: string;
  status: EventStatusEnum;
  bannerUrl?: string;
  cattlePerPassword?: number;
  useAbvaqRules?: boolean;
  customRules?: string;
  judges: Judge[];
  runners: Runner[];
  createdAt: string;
}

export interface SpeakerEventsResponse {
  events: SpeakerEvent[];
  total: number;
}
export interface SpeakerVoteSummaryResponse {
  eventId: string;
  eventName: string;
  eventDate: Date;
  runners: RunnerVoteSummaryResponse[];
}

export interface RunnerVoteSummaryResponse {
  userId: string;
  runnerName: string;
  runnerCity: string;
  runnerState: string;
  passwords: PasswordVoteSummaryResponse[];
  totalPoints: number;
  validVotes: number;
  nullVotes: number;
  tvVotes: number;
  didNotRunVotes: number;
}

export interface PasswordVoteSummaryResponse {
  passwordId: string;
  passwordNumber: string;
  passwordPrice: number;
  categoryName: CategoryNameEnum;
  votes: JudgeVoteDetailResponse[];
  passwordPoints: number;
  passwordStatus: string;
}

export interface JudgeVoteDetailResponse {
  scoreId: string;
  judgeId: string;
  judgeName: string;
  vote: string;
  points: number;
  comments?: string;
  votedAt: Date;
}
