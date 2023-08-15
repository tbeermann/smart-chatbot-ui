import { Plugin } from './agent';
import { OpenAIModelSchema } from './openai';

import * as z from 'zod';

export const RoleSchema = z.union([z.literal('system'), z.literal('assistant'), z.literal('user')]);

export type Role = z.infer<typeof RoleSchema>;

export const MessageSchema = z.object({
  role: RoleSchema,
  content: z.string(),
});

export type Message = z.infer<typeof MessageSchema>;

export const ChatBodySchema = z.object({
  model: OpenAIModelSchema,
  messages: z.array(MessageSchema),
  key: z.string(),
  prompt: z.string(),
  temperature: z.number(),
  elasticCloudId: z.string().optional(),
  elasticApiKey: z.string().optional(),
  googleAPIKey: z.string().optional(),
  googleCSEId: z.string().optional(),
});

export type ChatBody = z.infer<typeof ChatBodySchema>;

export interface ChatModeRunner {
  run: (params: ChatModeRunnerParams) => void;
}

export interface ChatModeRunnerParams {
  body: ChatBody;
  message: Message;
  conversation: Conversation;
  selectedConversation: Conversation;
  plugins: Plugin[];
}

export const ConversationSchema = z.object({
  id: z.string(),
  name: z.string(),
  messages: z.array(MessageSchema),
  model: OpenAIModelSchema,
  prompt: z.string(),
  temperature: z.number(),
  timestamp: z.string(),
  folderId: z.string().nullable(),
});

export const ConversationSchemaArray = z.array(ConversationSchema);

export type Conversation = z.infer<typeof ConversationSchema>;
