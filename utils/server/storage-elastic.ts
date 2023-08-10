import { Conversation } from '@/types/chat';
import { FolderInterface } from '@/types/folder';
import { Prompt } from '@/types/prompt';
import { Settings } from '@/types/settings';

import { ELASTIC_CLOUD_ID } from '../app/const';

import { Client } from '@elastic/elasticsearch'
import { ConversationComponent } from '@/components/Chatbar/components/Conversation';
import { foregroundColorNames } from 'chalk';
import { IconFolder } from '@tabler/icons-react';

let base64EncodedKey = process.env.ELASTIC_API_KEY || '';

let _es: Client | null = null;

// This is called in the UserDb constructor
export async function getEs(): Promise<Client> {
  if (!base64EncodedKey) {
    throw new Error('ELASTIC_API_KEY is not set');
  }
  if (_es !== null) {
    return _es
  }
  const client = new Client({
    cloud: { id: ELASTIC_CLOUD_ID },
    auth: { apiKey: base64EncodedKey }
  })

  checkIndicesExist(client);
  
  _es = client;
  return client;
}

export async function checkIndicesExist(client:Client) {
  await client.indices
    .create({ index: 'conversations' })
    .catch(err => {  console.log('conversation index exists') });

  await client.indices
    .create({ index: 'settings' })
    .catch(err => {  console.log('settings index exits') });

  await client.indices
    .create({ index: 'prompts' })
    .catch(err => {  console.log('prompts index exists') });

    await client.indices
    .create({ index: 'folders' })
    .catch(err => {  console.log('folders index exists') });
}



export interface ConversationCollectionItem {
  userId: string;
  conversation: Conversation;
}
export interface PromptsCollectionItem {
  userId: string;
  prompt: Prompt;
}

export interface FoldersCollectionItem {
  userId: string;
  folder: FolderInterface;
}

export interface SettingsCollectionItem {
  userId: string;
  settings: Settings;
}

interface Document {
  character: string
  quote: string
}

export class UserElasticsearch {
  private _conversations: Array<ConversationCollectionItem>;
  private _folders: Array<FoldersCollectionItem>;
  private _prompts: Array<PromptsCollectionItem>;
  private _settings: Array<SettingsCollectionItem>;
  private _elastic: Client;

  constructor(_es: Client, private _userId:string) {
    //console.log('Elasticsearch Constructor');
    this._elastic = _es
    this._conversations = new Array();
    this._folders = new Array();
    this._prompts = new Array();;
    this._settings = new Array();;

  }

  static async fromUserHash(userId: string): Promise<UserElasticsearch> {
    //console.log("CREATING ELASTCSEARHH");
    return new UserElasticsearch(await getEs(), userId)
  }

  async getConversations(): Promise<Conversation[]> {
    const result= await this._elastic.search<Document>({
      index: 'conversations',
      "query": {"match_all": {}}
    }).catch(err => {
      console.error(err)
    })

    let a = [];

    if (result) {
      let h = result.hits.hits;
      for (let x = 0; x < h.length; x++) {
        let d = h[x];
        let source = d._source;
        a.push(source);
      }
    }

    return a;
  }

  async saveConversation(conversation: Conversation) {
    
    // Not working
    conversation.user_id = this.userId;

    await this._elastic.index({
      index: 'conversations',
      id: conversation.id,
      document: conversation
    })
  }

  async removeConversation(id: string) {

    console.log("REMOVE FROM ELASTIC Conversation : " + id);

    this._elastic.delete({
      index: "conversations",
      id: id
    }).catch(err => {
      console.error(err)
    })
  }

  async removeAllConversations() {
    console.log("NOT IMPLEMENTED  Remove All Conversations from Elasticsearch by user_id " + this._userId);
  }


  async getFolders(): Promise<FolderInterface[]> {

    const result= await this._elastic.search<Document>({
      index: 'folders',
      "query": {"match_all": {}}
    }).catch(err => {
      console.error(err)
    })

    let f = [];

    if (result) {
      let h = result.hits.hits;
      for (let x = 0; x < h.length; x++) {
        let d = h[x];
        let source = d._source;
        f.push(source);
      }
    }

    return f;

  }

  async saveFolder(folder: FolderInterface) {
    console.log("Save Elastic FOLDERS");

    await this._elastic.index({
      index: 'folders',
      id: folder.id,
      document: folder
    })

    return true;
 
  }

  async removeFolder(id: string) {
    this._elastic.delete({
      index: "folders",
      id: id
    }).catch(err => {
      console.error(err)
    });
  }

  async removeAllFolders(type: string) {
    // # Elastic
    console.log("Remove All Folders Not implemented ..... type =  " + type);

    // # Mongo
    // return this._folders.deleteMany({
    //   userId: this._userId,
    //   'folder.type': type,
    // });
  }

  async getPrompts(): Promise<Prompt[]> {

    const result= await this._elastic.search<Document>({
      index: 'prompts',
      "query": {"match_all": {}}
    }).catch(err => {
      console.error(err)
    })

    let p = [];

    if (result) {
      let h = result.hits.hits;
      for (let x = 0; x < h.length; x++) {
        let d = h[x];
        let source = d._source;
        p.push(source);
      }
    }

    return p;

  }

  async savePrompt(prompt: Prompt) {
    console.log("Save Elastic PROMPTS");

    await this._elastic.index({
      index: 'prompts',
      id: prompt.id,
      document: prompt
    })

    return true;

  }

  async removePrompt(id: string) {
    console.log("Elastic remove PROMPT # " + id);
    this._elastic.delete({
      index: "prompts",
      id: id
    }).catch(err => {
      console.error(err)
    });
  }

  async getSettings(): Promise<Settings> {
    console.log(" Elastic get CHAT UI settings")
    let user_id = this._userId;

    const result= await this._elastic.search<Document>({
      index: 'settings',
      "query": {"match_all": {}}
    }).catch(err => {
      console.error(err)
    })

    let settings = {
      userId: this._userId,
      theme: 'dark',
      defaultTemperature: 1.0,
    }

    // There should only be one of these per user
    // Users not fully implemented

    if (result) {
      let h = result.hits.hits;
      if (h.length > 0) {
        settings = h[0]._source;
      }
      
    }

    return settings;
  }

  async saveSettings(settings: Settings) {
    console.log("Save Elastic Chat UI Settings");

    await this._elastic.index({
      index: 'settings',
      id: settings.userId,
      document: settings
    })

    return true;
  }
}

