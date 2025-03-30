// Helper functions for sentiment analysis

/**
 * Determines if a message needs simplification based on content
 * @param content The message content to check
 * @returns Boolean indicating if simplification is recommended
 */
export function needsSimplification(content: string): boolean {
    // Check if message is longer than 5 words
    const wordCount = content.split(/\s+/).length
    if (wordCount <= 5) return false
  
    // Check for technical terms or complex language
    const technicalTerms = [
      "algorithm",
      "implementation",
      "functionality",
      "interface",
      "component",
      "architecture",
      "framework",
      "infrastructure",
      "configuration",
      "deployment",
      "integration",
      "optimization",
      "refactoring",
      "dependency",
      "middleware",
      "protocol",
      "authentication",
      "authorization",
      "encryption",
      "serialization",
    ]
  
    // Count technical terms in the message
    const contentLower = content.toLowerCase()
    const technicalTermCount = technicalTerms.filter((term) => contentLower.includes(term)).length
  
    // Suggest simplification if there are technical terms or the message is long
    return technicalTermCount > 0 || wordCount > 20
  }
  
  /**
   * Gets the appropriate icon and color for a sentiment
   * @param sentiment The sentiment value (positive, negative, neutral)
   * @returns Object with icon name and color class
   */
  export function getSentimentDisplay(sentiment: string): {
    icon: string
    color: string
    label: string
  } {
    switch (sentiment.toLowerCase()) {
      case "positive":
        return {
          icon: "thumbs-up",
          color: "text-green-500",
          label: "Positive",
        }
      case "negative":
        return {
          icon: "thumbs-down",
          color: "text-red-500",
          label: "Negative",
        }
      default:
        return {
          icon: "meh",
          color: "text-gray-500",
          label: "Neutral",
        }
    }
  }
  
  