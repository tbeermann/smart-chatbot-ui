# Smart Elastic Chat

This repo is forked from [chatbot-ui](https://github.com/mckaywrigley/chatbot-ui).

This repository is highly experimental, so please do not expect compatibility when performing updates.

## [DEMO](https://smart-chatbot-ui.vercel.app/)

- Do not input personal information.
- Conversation, prompts, folders are stored in mongodb.
- Streaming response is not working in vercel environment.
- Plugins are not working for vercel timeout limitation.

## Additional Features

- SSO Auth(Google, GitHub)
- ChatGPT compatible plugins
- Python Interpreter Plugin
- Persitent storage(MongoDB)
- IME support

![Elastic Chat](./docs/screenshot_2023-05-08.png)

## Updates

- Elastic Chat will be updated over time.
- Expect frequent improvements.

**Recent updates:**

- [x] Python Interpreter (5/8/23)
- [x] Multiple Users with MongoDB Support (4/19/23)
- [x] Plugins(ChatGPT compatible) (4/17/23)
- [x] SSO Auth(email pattern matching only) (4/15/23)
- [x] Prompt templates (3/27/23)
- [x] Regenerate & edit responses (3/25/23)
- [x] Folders (3/24/23)
- [x] Search chat content (3/23/23)
- [x] Stop message generation (3/22/23)
- [x] Import/Export chats (3/22/23)
- [x] Custom system prompt (3/21/23)
- [x] Error handling (3/20/23)
- [x] GPT-4 support (access required) (3/20/23)
- [x] Search conversations (3/19/23)
- [x] Code syntax highlighting (3/18/23)
- [x] Toggle sidebar (3/18/23)
- [x] Conversation naming (3/18/23)
- [x] GitHub flavored markdown (3/18/23)
- [x] Add OpenAI API key in app (3/18/23)
- [x] Markdown support (3/17/23)

## Deploy

**Docker**

Setup enviroment variables:

```bash
cp .env.local.example .env.local
# specify OPENAI_API_KEY, MONGODB_URI, MONGO_INITDB_ROOT_USERNAME, MONGO_INITDB_ROOT_PASSWORD
vim .env.local
```

Run with docker-compose:

```shell
docker compose up -d
```

## Running Locally

**1. Clone Repo**

```bash
git clone https://github.com/dotneet/smart-chatbot-ui.git
```

**2. Install Dependencies**

```bash
npm i
```

**3. Provide OpenAI API Key**

Create a .env.local file in the root of the repo with your OpenAI API Key:

```bash
cp .env.local.example .env.local
# Specify OPENAI_API_KEY
vim .env.local
```

> You can set `OPENAI_API_HOST` where access to the official OpenAI host is restricted or unavailable, allowing users to configure an alternative host for their specific needs.

> Additionally, if you have multiple OpenAI Organizations, you can set `OPENAI_ORGANIZATION` to specify one.

**4. Run MongoDB**

```bash
docker compose -f docker-compose.dev.yml up -d
```

**5. Run App**

```bash
npm run dev
```

**6. Use it**

You should be able to start chatting.

## Configuration

When deploying the application, the following environment variables can be set:

| Environment Variable              | Default value                  | Description                                                                                                                               |
| --------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| OPENAI_API_KEY                    |                                | The default API key used for authentication with OpenAI                                                                                   |
| OPENAI_API_HOST                   | `https://api.openai.com`       | The base url, for Azure use `https://<endpoint>.openai.azure.com`                                                                         |
| OPENAI_API_TYPE                   | `openai`                       | The API type, options are `openai` or `azure`                                                                                             |
| OPENAI_API_VERSION                | `2023-03-15-preview`           | Only applicable for Azure OpenAI                                                                                                          |
| AZURE_DEPLOYMENT_ID_EMBEDDINGS    |                                | Specify model deployment ID used for embeddings. Needed when Azure OpenAI, Ref [Azure OpenAI API](https://learn.microsoft.com/zh-cn/azure/cognitive-services/openai/reference#completions) |
| OPENAI_ORGANIZATION               |                                | Your OpenAI organization ID                                                                                                               |
| DEFAULT_MODEL                     | `gpt-3.5-turbo`                | The default model to use on new conversations, for Azure use `gpt-35-turbo`                                                               |
| NEXT_PUBLIC_DEFAULT_SYSTEM_PROMPT | [see here](utils/app/const.ts) | The default system prompt to use on new conversations                                                                                     |
| GOOGLE_API_KEY                    |                                | See [Custom Search JSON API documentation][GCSE]                                                                                          |
| GOOGLE_CSE_ID                     |                                | See [Custom Search JSON API documentation][GCSE]                                                                                          |
| MONGODB_URI                       |                                | See [Official Document](https://www.mongodb.com/docs/manual/reference/connection-string/)                                                 |
| MONGODB_DB                        | `chatui`                       | MongoDB database name                                                                                                                     |
| NEXTAUTH_ENABLED                  | `false`                        | Enable SSO authentication. set 'true' or 'false'                                                                                          |
| NEXTAUTH_EMAIL_PATTERN            |                                | The email regex pattern granted access to chatbot-ui (ex `.+@example.com`)                                                                |
| NEXTAUTH_URL                      | `http://localhost:3000`        | NextAuth Settings. See [Official Document](https://next-auth.js.org/configuration/options)                                                |
| NEXTAUTH_SECRET                   |                                | NextAuth Settings. See [Official Document](https://next-auth.js.org/configuration/options)                                                |
| GITHUB_CLIENT_ID                  |                                | GitHub OAuth Client ID for NextAuth                                                                                                       |
| GITHUB_CLIENT_SECRET              |                                | GitHub OAuth Client Secret for NextAuth                                                                                                   |
| GOOGLE_CLIENT_ID                  |                                | Google OAuth Client ID for NextAuth                                                                                                       |
| GOOGLE_CLIENT_SECRET              |                                | Google OAuth Client Secret for NextAuth                                                                                                   |
| COGNITO_CLIENT_ID                 |                                | Cognito App Client ID                                                                                                                     |
| COGNITO_CLIENT_SECRET             |                                | Cognito App Client Secret                                                                                                                 |
| COGNITO_ISSUER                    |                                | Cognito Identity Provider Issuer                                                                                                          |
| AZURE_AD_CLIENT_ID                |                                | Azure AD Application (client) ID (see: [Quickstart AD](https://learn.microsoft.com/en-us/azure/active-directory/develop/))                |
| AZURE_AD_TENANT_ID                |                                | Azure AD Directory (tenant) ID                                                                                                            |
| AZURE_AD_CLIENT_SECRET            |                                | Azure AD Client secret value (Certificates & secrets > Client Secrets > New Client Secret > Value)                                        |

If you do not provide an OpenAI API key with `OPENAI_API_KEY`, users will have to provide their own key.
If you don't have an OpenAI API key, you can get one [here](https://platform.openai.com/account/api-keys).

## Plugin Settings

### ChatGPT compatible plugin

You can add a ChatGPT compatible plugin to `urls` field in `plugins.json`.

### Internal Tools

You can control the tools you want to use with the environment variable `PLUGINS_INTERNAL`.

#### Supported Internal Tools

- wikipedia_search
- google_search
- python_interpreter

#### Python Interpreter

_Recommended for use with GPT-4_

To enable python interpreter, you need to specify codeapi endpoint to `PYTHON_INTERPRETER_BACKEND` in `.env.local` and add `python_interpreter` to PLUGINS_INTERNAL.

```bash
# ex.
PLUGINS_INTERNAL=wikipedia_search,google_search,python_interpreter
PYTHON_INTERPRETER_BACKEND=http://localhost:8080/api/run
```

## Vercel

- streaming response is not supported in vercel.
- plugin executing fails because of the timeout limit is too short in free plan.

## Contact

If you have any questions, feel free to reach out to me on [Twitter](https://twitter.com/santa128bit).

[GCSE]: https://developers.google.com/custom-search/v1/overview
