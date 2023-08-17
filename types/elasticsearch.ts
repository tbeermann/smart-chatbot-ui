import { ChatBody, Message } from './chat';

export interface ElasticsearchBody extends ChatBody {
  elasticCloudId: string;
  elasticApiKey: string;
  elasticQuery: string;
}

export interface ElasticsearchResponse {
  message: Message;
}

export interface ElasticsearchSource {
  title: string;
  link: string;
  displayLink: string;
  snippet: string;
  image: string;
  text: string;
}
