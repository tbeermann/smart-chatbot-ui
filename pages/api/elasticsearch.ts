import { NextApiRequest, NextApiResponse } from 'next';

import { ensureHasValidSession } from '@/utils/server/auth';
import { getTiktokenEncoding } from '@/utils/server/tiktoken';
import { cleanSourceText } from '@/utils/server/webpage';

import { Message } from '@/types/chat';
import { ElasticsearchBody, ElasticsearchSource } from '@/types/elasticsearch';
import { Client } from '@elastic/elasticsearch'

import { Tiktoken } from 'tiktoken/lite/init';
import { Readability } from '@mozilla/readability';
import endent from 'endent';
import jsdom, { JSDOM } from 'jsdom';
import path from 'node:path';
import { getOpenAIApi } from '@/utils/server/openai';
import { ObjectEncodingOptions } from 'node:fs';


//TEMP
let ELASTIC_CLOUD_ID = '';
let ELASTIC_API_KEY = '';


export class EsreQueries {
  private _client: Client;
  private _encoding: Tiktoken | null = null;
  private _decoder:TextDecoder | null = null;

  constructor(encoding: Tiktoken, decoder: TextDecoder) {
    this._encoding = encoding;
    this._decoder = decoder;

    this._client = new Client({
      cloud: { id: ELASTIC_CLOUD_ID },
      auth: { apiKey: ELASTIC_API_KEY }
    })

  }

  async queryElasticsearch(params:any) {
    // Dummy Test Query
    const result= await this._client.search<Document>({
      index: 'production',
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

   async  assembleSources(data:any) {
   
    //let encodedText = []
    let finalText = ''

    data.forEach(element => {

      
      let sourceText = element!.title + " " + element!.message;
     // 400 tokens per source
      let encodedText = this._encoding!.encode(sourceText);
      if (encodedText.length > 400) {
        encodedText = encodedText.slice(0, 400);
        let text = this._decoder!.decode(this._encoding!.decode(encodedText))
        finalText += text;
      } else {
        finalText += sourceText
      }
      
    });

    return finalText;

    
  } 

}

const handler = async (req: NextApiRequest, res: NextApiResponse<any>) => {
  // Vercel Hack
  // https://github.com/orgs/vercel/discussions/1278
  // eslint-disable-next-line no-unused-vars
  const vercelFunctionHack = path.resolve('./public', '');

  if (!(await ensureHasValidSession(req, res))) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const textDecoder = new TextDecoder();
  let encoding: Tiktoken | null = null;

  try {
    const { messages, key, model, elasticCloudID: googleAPIKey, elasticApiKey: googleCSEId } =
      req.body as ElasticsearchBody;

    encoding = await getTiktokenEncoding(model.id);

    // userMessage is the typed queston from the user in the app
    const userMessage = messages[messages.length - 1];

    // Need this?
    const query = encodeURIComponent(userMessage.content.trim());


    const elasticQuery = new EsreQueries(encoding, textDecoder);


    const elasticsearchData: any = await elasticQuery.queryElasticsearch(null);

    const elasticSources: any = await elasticQuery.assembleSources(elasticsearchData);


    const answerPrompt = endent`
    Provide me with the information I requested. Use the sources to provide an accurate response. Respond in markdown format. Cite the sources you used as a markdown link as you use them at the end of each sentence by number of the source (ex: [[1]](link.com)). Provide an accurate response and then stop. Today's date is ${new Date().toLocaleDateString()}.

    Example Input:
    What's the weather in San Francisco today?

    Example Sources:
    [Weather in San Francisco](https://www.google.com/search?q=weather+san+francisco)

    Example Response:
    It's 70 degrees and sunny in San Francisco today. [[1]](https://www.google.com/search?q=weather+san+francisco)

    Input:
    ${userMessage.content.trim()}

    Sources:
    ${elasticSources}

    Response:
    `;

    console.log( 'Prompt with Elastic data  ........................................  ');
    console.log( '');

    console.log(answerPrompt);
    console.log( '');
    console.log( 'END Prompt with Elastic data  ....................................   ');

    const answerMessage: Message = { role: 'user', content: answerPrompt };
    const openai = getOpenAIApi(model.azureDeploymentId);
    const answerRes = await openai.createChatCompletion({
      model: model.id,
      messages: [
        {
          role: 'system',
          content: `Use the sources to provide an accurate response. Respond in markdown format. Cite the sources you used as [1](link), etc, as you use them. Maximum 4 sentences.`,
        },
        answerMessage,
      ],
      max_tokens: 1000,
      temperature: 1,
      stream: false,
    })

    const { choices: choices2 } = await answerRes.data;
    const answer = choices2[0].message!.content;

    res.status(200).json({ answer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error' });
  } finally {
    if (encoding !== null) {
      encoding.free();
    }
  }
};

export default handler;
