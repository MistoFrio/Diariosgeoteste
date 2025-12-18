type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

function getApiKey(): string {
  const key = (import.meta as any).env.VITE_GROQ_API_KEY as string | undefined;
  if (!key) throw new Error('Chave da API não configurada. Verifique as configurações do sistema.');
  return key;
}

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.1-8b-instant';

export async function chatComplete(messages: ChatMessage[], options?: { model?: string; temperature?: number; maxTokens?: number }): Promise<string> {
  const apiKey = getApiKey();
  const resp = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: options?.model ?? DEFAULT_MODEL,
      messages,
      temperature: options?.temperature ?? 0.2,
      max_tokens: options?.maxTokens ?? 400,
    }),
  });
  if (!resp.ok) {
    let msg = `Groq ${resp.status}`;
    try {
      const err = await resp.json();
      msg = err?.error?.message || msg;
    } catch {}
    throw new Error(msg);
  }
  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content;
  return (content as string) ?? '';
}

export async function summarizeText(text: string): Promise<string> {
  const system: ChatMessage = {
    role: 'system',
    content: 'Você resume textos técnicos de diários de obra em 120-180 palavras, PT-BR, objetivo e claro.',
  };
  const user: ChatMessage = { role: 'user', content: `Resuma:
${text}` };
  return chatComplete([system, user]);
}


