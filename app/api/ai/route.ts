import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google AI client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { task, content, action, messages, conversationId } = body;
    
    // Handle first approach (previously using AI SDK)
    if (task) {
      let systemPrompt = "";
      let userPrompt = "";
      
      switch (task) {
        case "sentiment":
          systemPrompt = "You are a sentiment analysis expert. Analyze the sentiment of the given text and respond with exactly one word: 'positive', 'negative', or 'neutral'.";
          userPrompt = `Analyze the sentiment of this message: "${content}"`;
          break;
        
        case "simplify":
          systemPrompt = "You are an expert at simplifying technical content. Explain the given text in simple terms that anyone can understand.";
          userPrompt = `Simplify this technical message for a non-technical audience: "${content}"`;
          break;
        
        case "summarize":
          systemPrompt = "You are a conversation summarization expert. Provide a concise summary of the conversation.";
          userPrompt = `Summarize this conversation in 2-3 sentences: ${content}`;
          break;
          
        case "analyze_file":
          systemPrompt = "You are a file content analysis expert. Analyze the provided file content and provide insights about it.";
          userPrompt = `Analyze this file content and provide insights, key points, and a summary: ${content}`;
          break;
        
        default:
          return new Response(JSON.stringify({ error: "Invalid task" }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
      }
      
      // Use Google Generative AI model instead of AI SDK
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      
      // Generate content with system prompt included in the chat
      const chat = model.startChat({
        history: [
          {
            role: 'user',
            parts: [{ text: systemPrompt }],
          },
          {
            role: 'model',
            parts: [{ text: 'I understand. I will follow these instructions.' }],
          },
        ],
        generationConfig: {
          maxOutputTokens: 1000,
        },
      });
      
      const result = await chat.sendMessage(userPrompt);
      const text = result.response.text();
      
      return new Response(JSON.stringify({ result: text }), {
        headers: { "Content-Type": "application/json" }
      });
    }
    
    // Handle GoogleGenerativeAI approach (second code snippet)
    else if (action) {
      // Prepare the conversation content for the AI
      const conversationText = messages
        .map((msg: any) => `${msg.profiles?.full_name || 'User'}: ${msg.content}`)
        .join('\n');
      
      let systemPrompt = '';
      let prompt = '';
      
      if (action === 'summarize') {
        systemPrompt = 'You are an AI assistant that summarizes conversations concisely. Focus on key points and action items.';
        prompt = `Please summarize the following conversation in a concise paragraph:\n\n${conversationText}`;
      } else if (action === 'simplify') {
        systemPrompt = 'You are an AI assistant that translates technical discussions into simple language.';
        prompt = `Please translate the following conversation into simpler, non-technical language:\n\n${conversationText}`;
      } else {
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
      }
      
      // Use the Google Generative AI model
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      
      // Generate content with system prompt included in the chat
      const chat = model.startChat({
        history: [
          {
            role: 'user',
            parts: [{ text: systemPrompt }],
          },
          {
            role: 'model',
            parts: [{ text: 'I understand. I will follow these instructions.' }],
          },
        ],
      });
      
      const result = await chat.sendMessage(prompt);
      const text = result.response.text();
      
      // Return the generated text
      return NextResponse.json({ 
        result: text,
        conversationId
      });
    } 
    
    // If neither task nor action is provided
    else {
      return new Response(JSON.stringify({ error: "Missing required parameters" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    
  } catch (error: any) {
    console.error('AI processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process with AI', message: error.message },
      { status: 500 }
    );
  }
}