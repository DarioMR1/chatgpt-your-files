"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePipeline } from "@/lib/hooks/use-pipeline";
import { cn } from "@/lib/utils";
import { Database } from "@/supabase/functions/_lib/database";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useChat } from "ai/react";
import { useEffect, useState } from "react";

// Definir nuestra propia interfaz Message que sea compatible con la de la librería ai/react
interface Message {
  id: string;
  role: "user" | "assistant" | "system" | "function";
  content: string;
}

export default function ChatPage() {
  const supabase = createClientComponentClient<Database>();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState<boolean>(false);

  const generateEmbedding = usePipeline(
    "feature-extraction",
    "Supabase/gte-small"
  );

  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      api: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/chat`,
    });

  const isReady = !!generateEmbedding;

  // Fetch suggestions when the conversation changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!isReady || messages.length === 0) return;

      setLoadingSuggestions(true);

      try {
        const lastMessage = messages[messages.length - 1];

        // Generate embedding for the context
        const output = await generateEmbedding(lastMessage.content, {
          pooling: "mean",
          normalize: true,
        });

        const embedding = JSON.stringify(Array.from(output.data));

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          return;
        }

        // Request suggestions from our modified endpoint
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/chat`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              messages: [lastMessage],
              embedding,
              requestSuggestions: true,
            }),
          }
        );

        const data = await response.json();
        if (data.suggestions && Array.isArray(data.suggestions)) {
          setSuggestions(data.suggestions);
        }
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      } finally {
        setLoadingSuggestions(false);
      }
    };

    // Solo llamar a fetchSuggestions cuando hay un mensaje del usuario
    if (messages.length > 0 && messages[messages.length - 1].role === "user") {
      fetchSuggestions();
    }
  }, [messages, isReady, generateEmbedding, supabase]);

  const handleSuggestionClick = (suggestion: string) => {
    // Set the input to the suggestion
    handleInputChange({
      target: { value: suggestion },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  return (
    <div className="max-w-6xl flex flex-col items-center w-full h-full">
      <div className="flex flex-col w-full gap-6 grow my-2 sm:my-10 p-4 sm:p-8 sm:border sm:border-primary/20 rounded-lg overflow-y-auto">
        <div className="border-primary/20 rounded-lg flex flex-col justify-start gap-4 pr-2 grow overflow-y-scroll">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "rounded-xl px-4 py-2 max-w-lg",
                message.role === "user"
                  ? "self-end bg-primary text-primary-foreground"
                  : "self-start bg-accent text-accent-foreground"
              )}
            >
              {message.content}
            </div>
          ))}
          {isLoading && (
            <div className="self-start m-6 text-primary before:text-primary after:text-primary dot-pulse" />
          )}
          {messages.length === 0 && (
            <div className="self-stretch flex flex-col grow items-center justify-center">
              <svg
                className="opacity-20 fill-primary mb-6"
                width="150px"
                height="150px"
                version="1.1"
                viewBox="0 0 100 100"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g>
                  <path d="m77.082 39.582h-29.164c-3.543 0-6.25 2.707-6.25 6.25v16.668c0 3.332 2.707 6.25 6.25 6.25h20.832l8.332 8.332v-8.332c3.543 0 6.25-2.918 6.25-6.25v-16.668c0-3.5391-2.707-6.25-6.25-6.25z" />
                  <path d="m52.082 25h-29.164c-3.543 0-6.25 2.707-6.25 6.25v16.668c0 3.332 2.707 6.25 6.25 6.25v8.332l8.332-8.332h6.25v-8.332c0-5.832 4.582-10.418 10.418-10.418h10.418v-4.168c-0.003907-3.543-2.7109-6.25-6.2539-6.25z" />
                </g>
              </svg>
              <h2 className="text-xl font-semibold text-primary mb-2">
                Asistente de Ventas Sumagro
              </h2>
              <p className="text-center text-secondary-foreground max-w-md mb-4">
                Haz preguntas sobre los productos Sumagro, sus aplicaciones,
                beneficios y características para ayudarte en tus ventas.
              </p>
            </div>
          )}
        </div>

        {/* Suggested Questions Section */}
        {suggestions.length > 0 && (
          <div className="flex flex-col space-y-2 mb-2">
            <h3 className="text-sm font-medium text-primary">
              Preguntas sugeridas:
            </h3>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-sm px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-left"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading state for suggestions */}
        {loadingSuggestions && messages.length > 0 && !suggestions.length && (
          <div className="flex justify-center">
            <div className="text-xs text-primary opacity-70">
              Generando sugerencias...
            </div>
          </div>
        )}

        <form
          className="flex items-center space-x-2 gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!generateEmbedding) {
              throw new Error("Unable to generate embeddings");
            }

            const output = await generateEmbedding(input, {
              pooling: "mean",
              normalize: true,
            });

            const embedding = JSON.stringify(Array.from(output.data));

            const {
              data: { session },
            } = await supabase.auth.getSession();

            if (!session) {
              return;
            }

            handleSubmit(e, {
              options: {
                headers: {
                  authorization: `Bearer ${session.access_token}`,
                },
                body: {
                  embedding,
                },
              },
            });

            // Clear suggestions when sending a message
            setSuggestions([]);
          }}
        >
          <Input
            type="text"
            autoFocus
            placeholder="Pregunta sobre productos Sumagro..."
            value={input}
            onChange={handleInputChange}
            className="border-primary/30 focus-visible:ring-primary"
          />
          <Button
            type="submit"
            disabled={!isReady || isLoading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Enviar
          </Button>
        </form>
      </div>
    </div>
  );
}
