import { ChatMode, ChatModeID } from '@/types/chatmode';

export const getEndpoint = (plugin: ChatMode | null) => {
  if (!plugin) {
    return 'api/chat';
  }

  if (plugin.id === ChatModeID.GOOGLE_SEARCH) {
    return 'api/google';
  }

  if (plugin.id === ChatModeID.ELASTIC_SEARCH) {
    return 'api/elasticsearch';
  }

  return 'api/chat';
};

export const watchRefToAbort = async <R>(
  ref: React.MutableRefObject<boolean>,
  fn: (controller: AbortController) => Promise<R>,
): Promise<R> => {
  const controller = new AbortController();
  let interval: any | null = null;
  try {
    interval = setInterval(() => {
      if (ref.current === true) {
        ref.current = false;
        controller.abort();
        if (interval) {
          clearInterval(interval);
          interval = null;
        }
      }
    }, 200);
    return await fn(controller);
  } finally {
    if (interval) {
      clearInterval(interval);
    }
  }
};
