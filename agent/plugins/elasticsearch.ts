import { OPENAI_API_HOST } from '@/utils/app/const';
import {
  chunkTextByTokenSize,
  extractTextFromHtml,
  getSimilarChunks as getChunksSortedBySimilarity,
  sliceByTokenSize,
} from '@/utils/server/webpage';

import { Action, Plugin } from '@/types/agent';
import { Message } from '@/types/chat';
import { GoogleSource } from '@/types/google';

import { ELASTIC_CLOUD_ID } from '@/utils/app/const';
import { Client } from '@elastic/elasticsearch'

import { TaskExecutionContext } from './executor';

import chalk from 'chalk';
import endent from 'endent';
import { getOpenAIApi } from '@/utils/server/openai';

export default {
  nameForModel: 'elasticsearch',
  nameForHuman: 'Elasticsearch',
  descriptionForHuman: 'Elasticsearch Relevance Engine (ESRE) .',
  descriptionForModel:
    "useful for when you need to provide your own relevant data to your question.  ESRE provides superior relevance",
  displayForUser: true,
  execute: async (
    context: TaskExecutionContext,
    action: Action,
  ): Promise<string> => {
    const encoding = await context.getEncoding();
    const query = action.pluginInput;
    const encodedQuery = encodeURIComponent(query.trim());
    const apiKey = process.env.GOOGLE_API_KEY;
    const cseId = process.env.GOOGLE_CSE_ID;
    const url = `https://customsearch.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cseId}&q=${encodedQuery}&num=3`;
    console.log('fetch:' + url);
    
    const googleRes = await fetch(url);

    const googleData = await googleRes.json();
    const sources: GoogleSource[] = googleData.items.map((item: any) => ({
      title: item.title,
      link: item.link,
      displayLink: item.displayLink,
      snippet: item.snippet,
      image: item.pagemap?.cse_image?.[0]?.src,
      text: '',
    }));

    const sourcesWithText: any = await Promise.all(
      sources.map(async (source) => {
        try {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timed out')), 5000),
          );

          const res = (await Promise.race([
            fetch(source.link),
            timeoutPromise,
          ])) as any;

          const html = await res.text();
          const wholeText = extractTextFromHtml(html);
          const text = sliceByTokenSize(encoding, wholeText, 0, 2000);
          const sortedChunks = await getChunksSortedBySimilarity(
            encoding,
            query,
            text,
            500
          );
          if (sortedChunks.length === 0) {
            return null;
          }
          return {
            ...source,
            text: sortedChunks[0],
          } as GoogleSource;
        } catch (error) {
          console.error(error);
          return null;
        }
      }),
    );

    const filteredSources: GoogleSource[] = sourcesWithText.filter(Boolean);
    let sourceTexts: string[] = [];
    let tokenSizeTotal = 0;
    for (const source of filteredSources) {
      const text = endent`
      ${source.title} (${source.link}):
      ${source.text}
      `;
      const tokenSize = encoding.encode(text).length;
      if (tokenSizeTotal + tokenSize > 2000) {
        break;
      }
      sourceTexts.push(text);
      tokenSizeTotal += tokenSize;
    }

    const answerPrompt = endent`
    Answer the following questions as best you can. Use the sources to provide an accurate response. Respond in markdown format. Cite the sources you used as a markdown link as you use them at the end of each sentence by number of the source (ex: [[1]](link.com)). Provide an accurate response and then stop. Today's date is ${new Date().toLocaleDateString()}.

    Example Input:
    What's the weather in San Francisco today?

    Example Sources:
    [Weather in San Francisco](https://www.google.com/search?q=weather+san+francisco)

    Example Response:
    It's 70 degrees and sunny in San Francisco today. [[1]](https://www.google.com/search?q=weather+san+francisco)

    Input:
    ${query.trim()}

    Sources:
    ${sourceTexts}

    Response:
    `;

    if (context.verbose) {
      console.log(chalk.greenBright('LLM Start(google plugin)'));
      console.log(answerPrompt);
      console.log('');
    }

    const answerMessage: Message = { role: 'user', content: answerPrompt };
    const model = context.model;
    const openai = getOpenAIApi(model.azureDeploymentId)
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
      temperature: 0,
      stream: false,
    })

    const answer = answerRes.data.choices[0].message!.content!;
    encoding.free();

    if (context.verbose) {
      console.log(chalk.greenBright('LLM END(google plugin)'));
      console.log(answer);
      console.log('');
    }

    return answer;
  },
} as Plugin;
