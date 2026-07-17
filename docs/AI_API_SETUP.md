# AI API Setup

Version: V1.1  
System: HR Daily AI

---

## 1. Where To Put The API Key

Put the AI API key in the backend `.env` file only.

For the official OpenAI provider:

```env
OPENAI_API_KEY=your_api_key_here
```

For an OpenAI-compatible relay provider:

```env
AI_PROVIDER=openai-compatible
AI_BASE_URL=https://your-relay.example.com/v1
AI_API_KEY=your_relay_token_here
AI_MODEL=your_model_name
AI_ENDPOINT_MODE=chat-completions
```

Do not put the key in UI code, browser storage, GitHub workflow files, or committed documentation.

---

## 2. Configure `.env`

Copy `.env.example` to `.env`, then fill in the backend values:

```env
DATABASE_URL=postgresql://postgres:postgres@db:5432/hr_daily
AI_PROVIDER=openai
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-4.1
OPENAI_TEMPERATURE=0.2
OPENAI_MAX_TOKENS=2000
```

Official OpenAI required:

- `OPENAI_API_KEY`

Official OpenAI optional:

- `AI_PROVIDER=openai`
- `OPENAI_MODEL`
- `OPENAI_BASE_URL`
- `OPENAI_TEMPERATURE`
- `OPENAI_MAX_TOKENS`

OpenAI-compatible relay required:

- `AI_PROVIDER=openai-compatible`
- `AI_BASE_URL`
- `AI_API_KEY`
- `AI_MODEL`

Use the relay provider's OpenAI-compatible `/v1` endpoint when possible:

```env
AI_BASE_URL=https://your-relay.example.com/v1
```

For simple relay root URLs, the backend will normalize an empty path such as `https://your-relay.example.com` to `https://your-relay.example.com/v1`.

Some relay providers require OpenAI variable names. In that case this form is also supported:

```env
AI_PROVIDER=openai-compatible
OPENAI_BASE_URL=https://your-relay.example.com/v1
OPENAI_API_KEY=your_relay_token_here
OPENAI_MODEL=your_model_name
```

If optional values are omitted, the application uses backend defaults.

Optional reliability settings:

- `AI_TIMEOUT_MS=60000` controls the provider request timeout in milliseconds.
- `AI_MAX_RETRIES=2` controls provider retry attempts after transient failures.

Relay endpoint mode defaults to `chat-completions`, which sends requests to the
OpenAI-compatible `/v1/chat/completions` endpoint. For a relay that explicitly
supports the Responses API instead, set `AI_ENDPOINT_MODE=responses`; this sends
requests to `/v1/responses`. The application does not automatically switch
endpoints after an error.

For slower relay providers or larger models, increase `AI_TIMEOUT_MS` in `.env`, then restart Docker. Do not hardcode provider-specific timing inside workflow code.

---

## 3. Restart Docker After Editing `.env`

After changing `.env`, restart the containers:

```bash
docker compose down
docker compose up --build
```

To view logs:

```bash
docker compose logs -f
```

---

## 4. Verify AI Status

Open the Settings page:

```text
/settings
```

Check the AI Configuration section:

- `AI Provider` should show the selected provider.
- `Base URL` should show either the configured relay URL or the OpenAI default status.
- `AI Model` should show the configured model.
- `API Key` should show configured.
- `AI Status` should show ready.

You can also call:

```text
GET /api/settings/status
```

The API returns safe status only:

```json
{
  "ai": {
    "provider": "openai",
    "baseUrl": "OpenAI default",
    "model": "gpt-4.1",
    "apiKeyConfigured": true,
    "status": "ready"
  }
}
```

The real API key is never returned.

---

## 5. Common Errors

### Missing API Key

If the active provider API key is empty or missing, AI features return a clear error and the app should not crash.

Fix:

1. Add `OPENAI_API_KEY` for `AI_PROVIDER=openai`, or `AI_API_KEY` for `AI_PROVIDER=openai-compatible`.
2. Restart the app or Docker containers.
3. Verify `/settings`.

### Missing Relay Base URL

If `AI_PROVIDER=openai-compatible` and no relay base URL is configured, AI features return a clear error.

Fix:

1. Add `AI_BASE_URL=https://your-relay.example.com/v1` to `.env`.
2. Restart the app or Docker containers.
3. Verify `/settings`.

### Wrong `.env` Location

The `.env` file must be in the project root.

### Docker Still Uses Old Values

Restart Docker after editing `.env`:

```bash
docker compose down
docker compose up --build
```

### Invalid Model Or Token Settings

If optional AI settings are invalid, remove them and let the backend defaults apply.

### AI Generation Timeout

If AI generation times out, the UI should show a retryable error instead of freezing.

Fix:

1. Verify the provider is reachable from Docker.
2. Confirm the configured model is available from the provider.
3. Increase `AI_TIMEOUT_MS` in `.env` if the provider is slow.
4. Restart Docker and retry the workflow.

---

## 6. Security Warnings

- Never commit `.env`.
- Never expose `OPENAI_API_KEY` or `AI_API_KEY` to frontend code.
- Never paste API keys into browser inputs.
- Never log API keys.
- Rotate the key immediately if it is accidentally exposed.
