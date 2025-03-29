import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google AI client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { action, messages, conversationId } = await req.json();
    
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
    
  } catch (error: any) {
    console.error('AI processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process with AI', message: error.message },
      { status: 500 }
    );
  }
}