import { createClient } from '@supabase/supabase-js';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { codeBlock } from 'common-tags';
import OpenAI from 'openai';
import { Database } from '../_lib/database.ts';

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
});

// These are automatically injected
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (!supabaseUrl || !supabaseAnonKey) {
    return new Response(
      JSON.stringify({
        error: 'Missing environment variables.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const authorization = req.headers.get('Authorization');

  if (!authorization) {
    return new Response(
      JSON.stringify({ error: `No authorization header passed` }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        authorization,
      },
    },
    auth: {
      persistSession: false,
    },
  });

  const { messages, embedding, requestSuggestions = false } = await req.json();

  const { data: documents, error: matchError } = await supabase
    .rpc('match_document_sections', {
      embedding,
      match_threshold: 0.8,
    })
    .select('content')
    .limit(5);

  if (matchError) {
    console.error(matchError);

    return new Response(
      JSON.stringify({
        error: 'There was an error reading your documents, please try again.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const injectedDocs =
    documents && documents.length > 0
      ? documents.map(({ content }) => content).join('\n\n')
      : 'No documents found';

  console.log(injectedDocs);

  // Check if we need to generate suggestions instead of a regular chat response
  if (requestSuggestions) {
    // Get the last message for context
    const lastMessage = messages[messages.length - 1];

    const suggestionPrompt: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: codeBlock`
          Eres un asistente especializado en agricultura regenerativa y productos Sumagro.
          Tu tarea es generar 3-4 preguntas recomendadas para vendedores,
          basándote en el contexto de la conversación y en la documentación disponible.
          Las preguntas deben ser específicas, útiles para vendedores y relacionadas con:
          1. Características y beneficios de productos Sumagro (PSD, Fertimás, Darkmix, Explotion)
          2. Aplicaciones para diferentes cultivos
          3. Ventajas competitivas
          4. Casos de éxito y testimonios
          5. Detalles técnicos que ayuden en el proceso de venta

          Estructura tu respuesta como una lista numerada JSON con este formato exacto:
          ["¿Pregunta 1?", "¿Pregunta 2?", "¿Pregunta 3?", "¿Pregunta 4?"]
        `,
      },
      {
        role: 'user',
        content: codeBlock`
          Basándote en los siguientes documentos y en el contexto de la conversación,
          genera 3-4 preguntas recomendadas para ayudar a los vendedores a obtener información útil.
          
          Contexto de la conversación:
          ${lastMessage.content}
          
          Documentos disponibles:
          ${injectedDocs}
          
          Recuerda responder solo con el formato JSON especificado.
        `,
      },
    ];

    const suggestionsResponse = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo-0125',
      messages: suggestionPrompt,
      max_tokens: 256,
      temperature: 0.7,
    });

    // Extract and parse suggestions
    let suggestions;
    try {
      suggestions = JSON.parse(suggestionsResponse.choices[0].message.content || '[]');
    } catch (e) {
      // If parsing fails, try to extract suggestions from the text
      const content = suggestionsResponse.choices[0].message.content || '';
      suggestions = content.match(/["'](.+?)["']/g)?.map(m => m.replace(/["']/g, '')) || [];
    }

    return new Response(
      JSON.stringify({ suggestions }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  // Regular chat response
  const completionMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
    [
      {
        role: 'system',
        content: codeBlock`
        Eres un asistente especializado en agricultura regenerativa y productos Sumagro.
        Tu objetivo es ayudar a los vendedores con información precisa sobre productos,
        aplicaciones y beneficios para diferentes cultivos.

        Usa un tono profesional pero amigable, y siempre busca dar detalles técnicos
        que puedan ser útiles en el proceso de venta.

        Debes usar solo la información de los documentos proporcionados.
        Si la pregunta no está relacionada con estos documentos o la información
        no está disponible, di: "Lo siento, no tengo información sobre eso, pero puedo 
        ayudarte con detalles sobre nuestros productos como PSD, Fertimás, Darkmix y Explotion."

        Al final de cada respuesta, cuando sea apropiado, sugiere una pregunta de seguimiento
        relacionada con el tema que podría ser útil para el vendedor.
        `,
      },
      {
        role: 'user',
        content: codeBlock`
        Documentos disponibles:
        ${injectedDocs}
      `,
      },
      ...messages,
    ];

  const completionStream = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo-0125',
    messages: completionMessages,
    max_tokens: 1024,
    temperature: 0.2,
    stream: true,
  });

  const stream = OpenAIStream(completionStream);
  return new StreamingTextResponse(stream, { headers: corsHeaders });
});
