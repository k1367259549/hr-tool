# AI API Setup

Version: V1.1  
System: HR Daily AI

---

## 1. Where To Put The API Key

Put the OpenAI API key in the backend `.env` file:

```env
OPENAI_API_KEY=your_api_key_here
```

Do not put the key in UI code, browser storage, GitHub workflow files, or committed documentation.

---

## 2. Configure `.env`

Copy `.env.example` to `.env`, then fill in the backend values:

```env
DATABASE_URL=postgresql://postgres:postgres@db:5432/hr_daily
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-4.1
OPENAI_TEMPERATURE=0.2
OPENAI_MAX_TOKENS=2000
```

Required:

- `OPENAI_API_KEY`

Optional:

- `OPENAI_MODEL`
- `OPENAI_TEMPERATURE`
- `OPENAI_MAX_TOKENS`

If optional values are omitted, the application uses backend defaults.

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

If `OPENAI_API_KEY` is empty or missing, AI features return a clear error and the app should not crash.

Fix:

1. Add `OPENAI_API_KEY` to `.env`.
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

---

## 6. Security Warnings

- Never commit `.env`.
- Never expose `OPENAI_API_KEY` to frontend code.
- Never paste API keys into browser inputs.
- Never log API keys.
- Rotate the key immediately if it is accidentally exposed.
