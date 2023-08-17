import { useContext } from 'react';
import { useTranslation } from 'react-i18next';

import { Plugin } from '@/types/agent';
import { ChatBody, Conversation, Message } from '@/types/chat';
import { ChatMode } from '@/types/chatmode';

import HomeContext from '@/pages/api/home/home.context';

import { useChatModeRunner } from './chatmode/useChatModeRunner';
import useConversations from './useConversations';

export const useMesseageSender = () => {
  const {
    state: { selectedConversation, apiKey },
  } = useContext(HomeContext);

  const [conversations, _] = useConversations();
  const chatModeSelector = useChatModeRunner(conversations);

  return async (
    message: Message,
    deleteCount = 0,
    chatMode: ChatMode | null = null,
    plugins: Plugin[] = [],
  ) => {
    if (!selectedConversation) {
      return;
    }
    const conversation = selectedConversation;
    let updatedConversation: Conversation;
    if (deleteCount) {
      const updatedMessages = [...conversation.messages];
      for (let i = 0; i < deleteCount; i++) {
        updatedMessages.pop();
      }
      updatedConversation = {
        ...conversation,
        messages: [...updatedMessages, message],
      };
    } else {
      updatedConversation = {
        ...conversation,
        messages: [...conversation.messages, message],
      };
    }
    const chatBody: ChatBody = {
      model: updatedConversation.model,
      messages: updatedConversation.messages,
      key: apiKey,
      elasticQuery: conversation.elasticQuery,
      prompt: conversation.prompt,
      temperature: conversation.temperature,
    };
    const chatModeRunner = chatModeSelector(chatMode);
    chatModeRunner.run({
      body: chatBody,
      conversation: updatedConversation,
      message,
      selectedConversation,
      plugins,
    });
  };
};

export default useMesseageSender;
