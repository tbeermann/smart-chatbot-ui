import { useContext } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useMutation } from 'react-query';

import useApiService from '@/services/useApiService';

import { HomeUpdater } from '@/utils/app/homeUpdater';

import {
  ChatModeRunner,
  ChatModeRunnerParams,
  Conversation,
} from '@/types/chat';

import HomeContext from '@/pages/api/home/home.context';

import useConversations from '../useConversations';

export function useElasticsearchMode(conversations: Conversation[]): ChatModeRunner {
  const { t: errT } = useTranslation('error');
  const {
    state: { chatModeKeys },
    dispatch: homeDispatch,
  } = useContext(HomeContext);
  const apiService = useApiService();
  const [_, conversationsAction] = useConversations();
  const updater = new HomeUpdater(homeDispatch);
  const mutation = useMutation({
    mutationFn: async (params: ChatModeRunnerParams) => {
      return apiService.elasticsearch(params);
    },
    onMutate: async (variables) => {
      console.log(variables);
      variables.body.elasticCloudID = chatModeKeys
        .find((key) => key.chatModeId === 'elasticsearch')
        ?.requiredKeys.find((key) => key.key === 'ELASTIC_CLOUD_ID')?.value;
      variables.body.elasticApiKey = chatModeKeys
        .find((key) => key.chatModeId === 'elasticsearch')
        ?.requiredKeys.find((key) => key.key === 'ELASTIC_API_KEY')?.value;
      homeDispatch({
        field: 'selectedConversation',
        value: variables.conversation,
      });
      homeDispatch({ field: 'loading', value: true });
      homeDispatch({ field: 'messageIsStreaming', value: true });
    },
    async onSuccess(response: any, variables, context) {
      let { conversation: updatedConversation, selectedConversation } =
        variables;

      const { answer } = await response.json();
      updatedConversation = updater.addMessage(updatedConversation, {
        role: 'assistant',
        content: answer,
      });
      const updatedConversations: Conversation[] = conversations.map(
        (conversation) => {
          if (conversation.id === selectedConversation.id) {
            return updatedConversation;
          }
          return conversation;
        },
      );
      if (updatedConversations.length === 0) {
        updatedConversations.push(updatedConversation);
      }
      await conversationsAction.updateAll(updatedConversations);
      homeDispatch({ field: 'loading', value: false });
      homeDispatch({ field: 'messageIsStreaming', value: false });
    },
    onError: async (error) => {
      homeDispatch({ field: 'loading', value: false });
      homeDispatch({ field: 'messageIsStreaming', value: false });
      if (error instanceof Response) {
        const json = await error.json();
        toast.error(errT(json.error || json.message || 'error'));
      } else {
        toast.error(error?.toString() || 'error');
      }
    },
  });

  return {
    run: (params: ChatModeRunnerParams) => {
      mutation.mutate(params);
    },
  };
}
