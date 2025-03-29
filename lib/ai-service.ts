import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai"
import { ERROR_CODES } from "@/types/error.types"
import { handleError } from "@/lib/error-handler"

// Initialize the Gemini API with your API key
// Make sure this environment variable is properly set in your .env.local file
const API_KEY = process.env.GOOGLE_AI_API_KEY
if (!API_KEY) {
  console.error("WARNING: Missing GOOGLE_AI_API_KEY environment variable")
}
const genAI = new GoogleGenerativeAI(API_KEY ?? process.env.GOOGLE_AI_API_KEY ?? "")

// Safety settings
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
]

export async function summarizeConversation(messages: any[]) {
  if (!messages || messages.length === 0) {
    return "No messages to summarize."
  }

  try {
    // Format messages for the AI
    const formattedMessages = messages.map((msg) => `${msg.sender_name || "User"}: ${msg.content}`).join("\n")

    // Get the generative model - using the correct model name "gemini-2.0-flash"
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      safetySettings,
    })

    // Generate content
    const result = await model.generateContent(
      `Summarize the following conversation in 3-5 key points:\n\n${formattedMessages}`,
    )

    const response = await result.response
    const text = response.text()

    return text
  } catch (error) {
    console.error("Raw error summarizing conversation:", error)
    const handledError = handleError(error)
    console.error("Error summarizing conversation:", handledError)

    if (handledError.code === ERROR_CODES.UNKNOWN_ERROR) {
      return "Failed to generate summary due to an unknown error. Please try again."
    } else if (handledError.code === ERROR_CODES.AI_CONTENT_FILTERED) {
      return "Content was filtered due to safety policies. Please ensure the conversation adheres to community guidelines."
    } else if (handledError.code === ERROR_CODES.AI_RATE_LIMIT_EXCEEDED) {
      return "AI service is currently busy. Please try again in a few moments."
    }

    return "Failed to generate summary. Please try again."
  }
}

export async function simplifyTechnicalContent(content: string) {
  if (!content) {
    return "No content to simplify."
  }

  try {
    // Get the generative model - using the correct model name "gemini-2.0-flash"
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      safetySettings,
    })

    // Generate content
    const result = await model.generateContent(
      `Translate the following technical content into simple, non-technical language that anyone can understand:\n\n${content}`,
    )

    const response = await result.response
    const text = response.text()

    return text
  } catch (error) {
    console.error("Raw error simplifying content:", error)
    const handledError = handleError(error)
    console.error("Error simplifying content:", handledError)

    if (handledError.code === ERROR_CODES.UNKNOWN_ERROR) {
      return "Failed to simplify content due to an unknown error. Please try again."
    } else if (handledError.code === ERROR_CODES.AI_CONTENT_FILTERED) {
      return "Content was filtered due to safety policies. Please ensure the text adheres to community guidelines."
    } else if (handledError.code === ERROR_CODES.AI_RATE_LIMIT_EXCEEDED) {
      return "AI service is currently busy. Please try again in a few moments."
    }

    return "Failed to simplify content. Please try again."
  }
}

export async function analyzeSentiment(content: string) {
  if (!content) {
    return { sentiment: "neutral", urgency: "low" }
  }

  try {
    // Get the generative model - using the correct model name "gemini-2.0-flash"
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      safetySettings,
    })

    // Generate content
    const result = await model.generateContent(
      `Analyze the sentiment and urgency of the following message. Return a JSON object with "sentiment" (positive, negative, or neutral) and "urgency" (high, medium, or low):\n\n${content}`,
    )

    const response = await result.response
    const text = response.text()

    // Extract JSON from the response
    const jsonMatch = text.match(/\{.*\}/s)
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0])
      } catch (e) {
        console.error("Failed to parse JSON:", e)
        return { sentiment: "neutral", urgency: "low" }
      }
    }

    return { sentiment: "neutral", urgency: "low" }
  } catch (error) {
    console.error("Raw error analyzing sentiment:", error)
    const handledError = handleError(error)
    console.error("Error analyzing sentiment:", handledError)
    return { sentiment: "neutral", urgency: "low" }
  }
}

export async function generateAIResponse(prompt: string, context?: string) {
  if (!prompt) {
    return "No prompt provided."
  }

  try {
    // Get the generative model - using the correct model name "gemini-2.0-flash"
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      safetySettings,
    })

    // Prepare the full prompt with context if provided
    const fullPrompt = context ? `Context: ${context}\n\nPrompt: ${prompt}` : prompt

    // Generate content
    const result = await model.generateContent(fullPrompt)
    const response = await result.response
    const text = response.text()

    return text
  } catch (error) {
    console.error("Raw error generating AI response:", error)
    const handledError = handleError(error)
    console.error("Error generating AI response:", handledError)

    if (handledError.code === ERROR_CODES.UNKNOWN_ERROR) {
      return "Failed to generate a response due to an unknown error. Please try again."
    } else if (handledError.code === ERROR_CODES.AI_CONTENT_FILTERED) {
      return "Content was filtered due to safety policies. Please ensure your prompt adheres to community guidelines."
    } else if (handledError.code === ERROR_CODES.AI_RATE_LIMIT_EXCEEDED) {
      return "AI service is currently busy. Please try again in a few moments."
    }

    return "Failed to generate a response. Please try again."
  }
}