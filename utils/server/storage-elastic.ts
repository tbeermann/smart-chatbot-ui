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
  
  _es = client;
  return client;
}

// const client = new Client({
//   cloud: { id: ELASTIC_CLOUD_ID },
//   auth: { apiKey: base64EncodedKey }
// })

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
    // console.log("--------------------------------------");
    // console.log("saveConversation IN ELASTIC  =  " + conversation);
    // console.log(JSON.stringify(conversation, null, 4));
    // console.log("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$");
    
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
    console.log("DELETE Everything for USER ID " + this._userId);
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
    })

  }

}

async function run () {
  // Let's start by indexing some data
  await _es.index({
    index: 'game-of-thrones',
    document: {
      character: 'Ned Stark',
      quote: 'Winter is coming.'
    }
  })

  await client.index({
    index: 'game-of-thrones',
    document: {
      character: 'Daenerys Targaryen',
      quote: 'I am the blood of the dragon.'
    }
  })

  await client.index({
    index: 'game-of-thrones',
    document: {
      character: 'Tyrion Lannister',
      quote: 'A mind needs books like a sword needs a whetstone.'
    }
  })

  // here we are forcing an index refresh, otherwise we will not
  // get any result in the consequent search
  await client.indices.refresh({ index: 'game-of-thrones' })

  // Let's search!
  const result= await client.search<Document>({
    index: 'game-of-thrones',
    query: {
      match: { quote: 'winter' }
    }
  })

  console.log(result.hits.hits)
}

//run().catch(console.log)