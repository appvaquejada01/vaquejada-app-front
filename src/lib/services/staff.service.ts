import { api } from "@/api/api-connection";
import { JudgeEventsResponse } from "@/types/api";
import {
  JudgeVoteRequest,
  JudgeVoteResponse,
  SpeakerEvent,
  SpeakerVoteSummaryResponse,
} from "@/types/dtos/staff.dto";

export const addJudgeToEvent = async (
  eventId: string,
  judgeId: string
): Promise<void> => {
  const response = await api.post(`/staff/judge/${eventId}/${judgeId}`);
  return response.data;
};

export const addSpeakerToEvent = async (
  eventId: string,
  speakerId: string
): Promise<void> => {
  const response = await api.post(`/staff/speaker/${eventId}/${speakerId}`);
  return response.data;
};

export const listStaffByEvent = async (eventId: string) => {
  const response = await api.get(`/staff/event/${eventId}`);
  return response.data;
};

export const removeJudgeFromEvent = async (
  eventId: string,
  judgeId: string
): Promise<void> => {
  const response = await api.delete(`/staff/judge/${eventId}/${judgeId}`);
  return response.data;
};

export const removeSpeakerFromEvent = async (
  eventId: string,
  speakerId: string
): Promise<void> => {
  const response = await api.delete(`/staff/speaker/${eventId}/${speakerId}`);
  return response.data;
};

export const listJudgeEvents = async (
  judgeId: string
): Promise<JudgeEventsResponse> => {
  const response = await api.get(`/staff/${judgeId}/events`);
  return response.data;
};

export const submitJudgeVote = async (data: JudgeVoteRequest) => {
  const response = await api.post(`/staff/judge/vote`, data);
  return response.data;
};

export const getJudgeVotesByEvent = async (
  eventId: string,
  judgeId: string
): Promise<SpeakerVoteSummaryResponse> => {
  const response = await api.get(`/staff/judge/votes/${judgeId}/${eventId}`);
  return response.data;
};

export const updateJudgeVote = async (
  voteId: string,
  data: Partial<JudgeVoteRequest>
): Promise<JudgeVoteResponse> => {
  const response = await api.put(`/staff/judge/vote/${voteId}`, data);
  return response.data;
};

export const listSpeakerEvents = async (
  speakerId: string
): Promise<SpeakerEvent[]> => {
  const response = await api.get(`/staff/speaker/${speakerId}/events`);
  return response.data;
};

export const getEventVotesSummary = async (
  eventId: string
): Promise<SpeakerVoteSummaryResponse> => {
  const response = await api.get(`/speaker/vote-summary/${eventId}`);
  return response.data;
};
