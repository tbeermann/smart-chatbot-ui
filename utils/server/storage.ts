import { Conversation } from '@/types/chat';
import { FolderInterface } from '@/types/folder';
import { Prompt } from '@/types/prompt';
import { Settings } from '@/types/settings';

import { UserElasticsearch } from './storage-elastic';

import { MONGODB_DB } from '../app/const';

import { Collection, Db, MongoClient } from 'mongodb';

let _db: Db | null = null;


// This is called in the UserDb constructor
export async function getDb(): Promise<Db> {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set');
  }
  if (_db !== null) {
    return _db;
  }
  const client = await MongoClient.connect(process.env.MONGODB_URI);
  let db = client.db(MONGODB_DB);
  _db = db;
  return db;
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

export class UserDb {
  private _conversations: Collection<ConversationCollectionItem>;
  private _folders: Collection<FoldersCollectionItem>;
  private _prompts: Collection<PromptsCollectionItem>;
  private _settings: Collection<SettingsCollectionItem>;
  private _id: string;

  //private _userElasticserach: UserElasticsearch;

  constructor(_db: Db, private _userId: string) {
    // console.log("In constructor");
    this._conversations =
      _db.collection<ConversationCollectionItem>('conversations');
    this._folders = _db.collection<FoldersCollectionItem>('folders');
    this._prompts = _db.collection<PromptsCollectionItem>('prompts');
    this._settings = _db.collection<SettingsCollectionItem>('settings');
    this._id = _userId;
  }

  static async fromUserHash(userId: string): Promise<UserDb> {
    
    return new UserDb(await getDb(), userId);
  }

  async getConversations(): Promise<Conversation[]> {
    // # Elasticsearch
    const es = await UserElasticsearch.fromUserHash(this._userId);
    let e = await es.getConversations();
    return e;

    // # Mongo
    // return (
    //   await this._conversations
    //     .find({ userId: this._userId })
    //     .sort({ _id: -1 })
    //     .toArray()
    // ).map((item) => item.conversation);

  }

  async saveConversation(conversation: Conversation) {
    // # Elasticsearch
    const es = await UserElasticsearch.fromUserHash(this._userId);
    await es.saveConversation(conversation);
    return true;

    // # Mongo
    // return this._conversations.updateOne(
    //   { userId: this._userId, 'conversation.id': conversation.id },
    //   { $set: { conversation } },
    //   { upsert: true },
    // );
  }

  async saveConversations(conversations: Conversation[]) {
    console.log("saveConversationS  =  " + conversations);
    for (const conversation of conversations) {
      await this.saveConversation(conversation);
    }
  }

  async removeConversation(id: string) {
    // # Elasticsearch
    const es =  await UserElasticsearch.fromUserHash(this._userId);
    es.removeConversation(id);
    return true;

    // # Mongo
    // this._conversations.deleteOne({
    //   userId: this._userId,
    //   'conversation.id': id,
    // });
  }

  async removeAllConversations() {
    // # Elasicsearch
    const es =  await UserElasticsearch.fromUserHash(this._userId);
    es.removeAllConversations();

    // # Mongo
    this._conversations.deleteMany({ userId: this._userId });
  }

  async getFolders(): Promise<FolderInterface[]> {
    // # Elasticsearch
    const es =  await UserElasticsearch.fromUserHash(this._userId);
    let f =  es.getFolders();
    return f;

    // # Mongo
    // const items = await this._folders
    //   .find({ userId: this._userId })
    //   .sort({ 'folder.name': 1 })
    //   .toArray();
    // return items.map((item) => item.folder);
  }

  async saveFolder(folder: FolderInterface) {
    // # Elasticsearh
    const es =  await UserElasticsearch.fromUserHash(this._userId);
    await es.saveFolder(folder);
    
    // # Mongo
    // return this._folders.updateOne(
    //   { userId: this._userId, 'folder.id': folder.id },
    //   { $set: { folder } },
    //   { upsert: true },
    // );
  }

  async saveFolders(folders: FolderInterface[]) {
   // console.log("saveFolders  =  " + folders);
    for (const folder of folders) {
      await this.saveFolder(folder);
    }
  }

  /**
   * TODO:  Issue - Removed folders does not remove folder id from
   * conversation object (conversation.foldeId).  Needs to be set to null 
   * @param id 
   */
  async removeFolder(id: string) {
    // # Elasticsearch
    const es =  await UserElasticsearch.fromUserHash(this._userId);
    await es.removeFolder(id);

    // # Mongo

    // return this._folders.deleteOne({
    //   userId: this._userId,
    //   'folder.id': id,
    // });
  }

  async removeAllFolders(type: string) {
    // # Elastic
    console.log("Remove All Folders Not implemented ..... type =  " + type);

    // # Mongo
    return this._folders.deleteMany({
      userId: this._userId,
      'folder.type': type,
    });
  }

  async getPrompts(): Promise<Prompt[]> {
    // # Elasticsearch
    const es =  await UserElasticsearch.fromUserHash(this._userId);
    let p =  es.getPrompts();
    return p;

    // # Mongo
    // const items = await this._prompts
    //   .find({ userId: this._userId })
    //   .sort({ 'prompt.name': 1 })
    //   .toArray();

    // return items.map((item) => item.prompt);
  }

  async savePrompt(prompt: Prompt) {
    // # Elastic
    const es =  await UserElasticsearch.fromUserHash(this._userId);
    await es.savePrompt(prompt);


    // # Mongo
    // return this._prompts.updateOne(
    //   { userId: this._userId, 'prompt.id': prompt.id },
    //   { $set: { prompt } },
    //   { upsert: true },
    // );
  }

  async savePrompts(prompts: Prompt[]) {
    for (const prompt of prompts) {
      await this.savePrompt(prompt);
    }
  }

  async removePrompt(id: string) {
    // # Elastic
    const es =  await UserElasticsearch.fromUserHash(this._userId);
    await es.removePrompt(id);

    // # Mongo
    // return this._prompts.deleteOne({
    //   userId: this._userId,
    //   'prompt.id': id,
    // });
  }

  async getSettings(): Promise<Settings> {
    // # Elastic
    const es = await UserElasticsearch.fromUserHash(this._userId);
    let s = await es.getSettings();

    

    return s;

    // # Mongo
    // const item = await this._settings.findOne({ userId: this._userId });
    // if (item) {
    //   return item.settings;
    // }

    // // Default values if nothing found
    // return {
    //   userId: this._userId,
    //   theme: 'dark',
    //   defaultTemperature: 1.0,
    // };


  }

  async saveSettings(settings: Settings) {
    settings.userId = this._userId;

    // # Elastic
    const es =  await UserElasticsearch.fromUserHash(this._userId);
    await es.saveSettings(settings);


    // # Mongo
    // return this._settings.updateOne(
    //   { userId: this._userId },
    //   { $set: { settings } },
    //   { upsert: true },
    // );
  }
}
