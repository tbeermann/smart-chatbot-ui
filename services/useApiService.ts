import { useCallback } from 'react';

import { useFetch } from '@/hooks/useFetch';

import {
  PlanningRequest,
  PlanningResponse,
  Plugin,
  PluginResult,
  RunPluginRequest,
} from '@/types/agent';
import { ChatBody, Conversation, Message } from '@/types/chat';

export type PlanningRequestProps = PlanningRequest;

const useApiService = () => {
  const fetchService = useFetch();

  const chat = useCallback(
    (
      params: { body: ChatBody; conversation: Conversation },
      signal?: AbortSignal,
    ) => {
      return fetchService.post<Message>(`/api/chat`, {
        body: params.body,
        headers: {
          'Content-Type': 'application/json',
        },
        signal,
        rawResponse: true,
      });
    },
    [fetchService],
  );

  const googleSearch = useCallback(
    (
      params: { body: ChatBody; conversation: Conversation },
      signal?: AbortSignal,
    ) => {
      return fetchService.post<Message>(`/api/google`, {
        body: params.body,
        headers: {
          'Content-Type': 'application/json',
        },
        signal,
        rawResponse: true,
      });
    },
    [fetchService],
  );

  const elasticsearch = useCallback(
    (
      params: { body: ChatBody; conversation: Conversation },
      signal?: AbortSignal,
    ) => {
      return fetchService.post<Message>(`/api/elasticsearch`, {
        body: params.body,
        headers: {
          'Content-Type': 'application/json',
        },
        signal,
        rawResponse: true,
      });
    },
    [fetchService],
  );

  const planning = useCallback(
    (params: PlanningRequestProps, signal?: AbortSignal) => {
      return fetchService.post<PlanningResponse>(`/api/planning`, {
        body: params,
        headers: {
          'Content-Type': 'application/json',
        },
        signal,
      });
    },
    [fetchService],
  );

  const planningConv = useCallback(
    (params: PlanningRequestProps, signal?: AbortSignal) => {
      return fetchService.post<PlanningResponse>(`/api/planningconv`, {
        body: params,
        headers: {
          'Content-Type': 'application/json',
        },
        signal,
      });
    },
    [fetchService],
  );

  const runPlugin = useCallback(
    (params: RunPluginRequest, signal?: AbortSignal) => {
      return fetchService.post<PluginResult>(`/api/runplugin`, {
        body: params,
        headers: {
          'Content-Type': 'application/json',
        },
        signal,
      });
    },
    [fetchService],
  );

  const getPlugins = useCallback(
    (signal?: AbortSignal) => {
      return fetchService.post<Plugin[]>(`/api/plugins`, {
        headers: {
          'Content-Type': 'application/json',
        },
        signal,
      });
    },
    [fetchService],
  );

  return {
    chat,
    googleSearch,
    elasticsearch,
    planning,
    planningConv,
    runPlugin,
    getPlugins,
  };
};

export default useApiService;
