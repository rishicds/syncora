import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '')

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { task, content, action, messages, conversationId } = body

    // Get the generative model (using gemini-pro as it's more widely available)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    // Handle first approach (task-based processing)
    if (task) {
      let prompt = ""

      switch (task) {
        case "sentiment":
          prompt = `You are a sentiment analysis expert. Analyze the sentiment of the given text and respond with exactly one word: 'positive', 'negative', or 'neutral'.
          
          Message to analyze: "${content}"`
          break

        case "simplify":
          prompt = `You are an expert at simplifying technical content. Explain the given text in simple, conversational terms that anyone can understand. Do not use markdown formatting. Use everyday language and analogies where appropriate.
          
          Technical content to simplify: "${content}"`
          break

        case "summarize":
          prompt = `You are a conversation summarization expert. Provide a concise summary of the conversation in conversational language without using markdown.
          
          Conversation to summarize: ${content}`
          break

        case "analyze_file":
          prompt = `You are a file content analysis expert. Analyze the provided file content and provide insights about it in conversational language without using markdown.
          
          File content to analyze: ${content}`
          break

        default:
          return NextResponse.json({ error: "Invalid task" }, { status: 400 })
      }

      // Generate content with Google's Gemini API
      const result = await model.generateContent(prompt)
      const text = result.response.text()

      return NextResponse.json({ result: text })
    }

    // Handle conversation actions
    else if (action) {
      // Prepare the conversation content for the AI
      const conversationText = messages
        .map((msg: any) => `${msg.profiles?.full_name || "User"}: ${msg.content}`)
        .join("\n")

      let prompt = ""

      if (action === "summarize") {
        prompt = `You are an AI assistant that summarizes conversations concisely in conversational language. Focus on key points and action items. Do not use markdown formatting.
        
        Please summarize the following conversation in a concise paragraph:
        
        ${conversationText}`
      } else if (action === "simplify") {
        prompt = `You are an AI assistant that translates technical discussions into simple language. Use conversational tone and avoid markdown formatting.
        
        Please translate the following conversation into simpler, non-technical language:
        
        ${conversationText}`
      } else {
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
      }

      // Generate content with Google's Gemini API
      const result = await model.generateContent(prompt)
      const text = result.response.text()

      // Return the generated text
      return NextResponse.json({
        result: text,
        conversationId,
      })
    }

    // If neither task nor action is provided
    else {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }
  } catch (error: any) {
    console.error("AI processing error:", error)
    return NextResponse.json(
      { error: "Failed to process with AI", message: error.message },
      { status: 500 }
    )
  }
}