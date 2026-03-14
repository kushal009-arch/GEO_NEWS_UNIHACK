import Groq from "groq-sdk";

const groq = new Groq({ 
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true 
});

export async function askAssistant(question: string, contextData: any = null): Promise<string> {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: "You are a helpful geopolitics AI Command Assistant for the GeoNews application. Answer questions based on the map and news data provided in the context." 
        },
        { 
          role: "user", 
          content: `Context: ${JSON.stringify(contextData || {})}\n\nQuestion: ${question}` 
        }
      ],
      model: "llama3-8b-8192", 
    });
    return chatCompletion.choices[0]?.message?.content || "No response";
  } catch (error) {
    console.error("Groq API error:", error);
    return "Sorry, I am unable to connect to the AI service right now.";
  }
}
