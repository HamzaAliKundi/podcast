import { GoogleGenerativeAI } from "@google/generative-ai";

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = import.meta.env.VITE_GEMINI_API;
    if (!apiKey) {
      throw new Error("Missing Gemini API key");
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
  }

  async generateContent(prompt: string, context: any) {
    try {
      // Extract metadata safely
      const metadata = context?.metadata || {};
      const sourceType = context?.type || "unknown";
      const transcriptText =
        context?.transcript?.raw || "No transcript available.";

      const contextString = `Transcript: ${transcriptText.substring(
        0,
        1000
      )}...`;

      //       // Build context string
      //       const contextString = `
      // Source Type: ${sourceType}
      // Title: ${metadata.title || "Untitled"}
      // Description: ${metadata.description || "No description"}
      // ${metadata.channelTitle ? `Channel: ${metadata.channelTitle}` : ""}
      // ${
      //   metadata.statistics?.viewCount
      //     ? `Views: ${metadata.statistics.viewCount}`
      //     : ""
      // }
      // ${metadata.duration ? `Duration: ${metadata.duration} seconds` : ""}
      // ${metadata.tags?.length > 0 ? `Tags: ${metadata.tags.join(", ")}` : ""}
      // ${
      //   metadata.keywords?.length > 0
      //     ? `Keywords: ${metadata.keywords.join(", ")}`
      //     : ""
      // }
      // ${metadata.publishedAt ? `Published: ${metadata.publishedAt}` : ""}
      // ${
      //   metadata.transcript
      //     ? `Transcript: ${transcriptText.substring(0, 1000)}...`
      //     : ""
      // }
      //       `.trim();

      // Create the complete prompt
      const fullPrompt = `
Context Information:
${contextString}

Task:
${prompt}

Requirements:
- Professional and engaging tone
- Well-structured content with clear sections
- SEO-optimized naturally
- Include relevant examples and data
- Add clear calls to action
- Maintain original message and context
- Format with proper paragraphs and spacing
- Include relevant statistics and metrics
- Add industry insights and trends
- Optimize for readability and engagement

Please provide the content in a clear, readable format.
      `.trim();

      const result = await this.model.generateContent({
        contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
      });

      const response = await result.response;
      console.log("Resposne from generate content", response.text());
      return response.text();
    } catch (error) {
      console.error("Content generation error:", error);
      throw new Error(`Content generation failed: ${error.message}`);
    }
  }

  async generateSocialPosts(content: string) {
    try {
      const prompt = `
Create social media posts based on this content:
${content.substring(0, 1000)}...

Create exactly 2 posts in this exact format (do not include backticks or json markers):
[
  {
    "platform": "twitter",
    "content": "Your tweet content with #hashtags (max 280 chars)"
  },
  {
    "platform": "linkedin",
    "content": "Your professional LinkedIn post (max 1000 chars)"
  }
]

Important:
- Keep Twitter post under 280 characters
- Keep LinkedIn post under 1000 characters
- Do not use backticks or json markers
- Use proper JSON format
- Escape quotes properly
- Do not truncate content
`.trim();

      const result = await this.model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      const response = await result.response;
      const text = response.text().trim();

      try {
        // Clean up the response to ensure valid JSON
        const cleanJson = text.replace(/```json\n|\n```|```/g, "").trim();
        const parsed = JSON.parse(cleanJson);

        // Validate the structure
        if (!Array.isArray(parsed) || parsed.length !== 2) {
          throw new Error("Invalid social posts format");
        }

        // Validate each post
        parsed.forEach((post) => {
          if (!post.platform || !post.content) {
            throw new Error("Invalid post format");
          }
          if (post.platform === "twitter" && post.content.length > 280) {
            post.content = post.content.substring(0, 277) + "...";
          }
          if (post.platform === "linkedin" && post.content.length > 1000) {
            post.content = post.content.substring(0, 997) + "...";
          }
        });

        return parsed;
      } catch (parseError) {
        console.error("Failed to parse social posts:", text);
        throw new Error("Invalid social posts format");
      }
    } catch (error) {
      console.error("Social posts generation error:", error);
      throw new Error(`Failed to generate social posts: ${error.message}`);
    }
  }

  async generateNewsletter(content: string, context: any) {
    try {
      const metadata = context?.metadata || {};

      const prompt = `
Create an email newsletter based on this content:
${content.substring(0, 1000)}...

Source Information:
Title: ${metadata.title || "Untitled"}
Type: ${context.type || "Unknown"}
${metadata.channelTitle ? `Channel: ${metadata.channelTitle}` : ""}

Requirements:
- Start with "Subject: [Your subject line]"
- Clear introduction and value proposition
- Well-structured sections with headers
- Key takeaways and insights
- Relevant statistics and data points
- Industry context and trends
- Strong call to action
- Email-friendly formatting with proper spacing
- Keep under 2000 characters total
`.trim();

      const result = await this.model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      const response = await result.response;
      const text = response.text();

      // Ensure the newsletter isn't too long
      if (text.length > 2000) {
        return text.substring(0, 1997) + "...";
      }

      return text;
    } catch (error) {
      console.error("Newsletter generation error:", error);
      throw new Error(`Failed to generate newsletter: ${error.message}`);
    }
  }

  async chatCompletion(
    messages: Array<{ role: string; content: string }>,
    context: any
  ) {
    try {
      const contextString = `
You are an AI assistant helping with content transformation. The current context is:
Source Type: ${context?.type || "unknown"}
Title: ${context?.metadata?.title || "Untitled"}
      `.trim();

      const formattedMessages = [
        { role: "system", parts: [{ text: contextString }] },
        ...messages.map((msg) => ({
          role: msg.role,
          parts: [{ text: msg.content }],
        })),
      ];

      const result = await this.model.generateContent({
        contents: formattedMessages,
      });

      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Chat completion error:", error);
      throw new Error(`Chat completion failed: ${error.message}`);
    }
  }
  // transcripttt function
  // First, let's update the videoTranscriptionStructured method in the GeminiService class

  async videoTranscriptionStructured(content: string) {
    try {
      const contextString = `
    You are an AI assistant analyzing a YouTube video transcript. 
    Your task is to generate a structured breakdown of the video, identifying key discussions and approaches.
    
    Format your response as HTML with proper semantic markup. Use h1, h2, h3 tags for headings, p tags for paragraphs,
    ul/li for lists, and span tags with appropriate classes for timestamps or speakers if present.
    
    **Output should include:**
    1. A main heading (h1) with a suitable title based on content
    2. A section (h2) for "Main Topics Discussed" with a list (ul/li) of major topics
    3. A section (h2) for "Key Discussions" with structured paragraphs and subheadings (h3)
    4. A section (h2) for "Approach & Style" explaining how information is presented
    5. A section (h2) for "Important Insights" with key takeaways
    6. A section (h2) for "Conclusion" summarizing the overall message
    
    Use appropriate HTML classes for styling (e.g., class="timestamp" for timestamps, class="speaker" for speakers,
    class="highlight" for important quotes or facts). Make the HTML clean, valid, and well-formatted.
    
    Here is the transcript:
    ${content}
    `;

      const result = await this.model.generateContent({
        contents: [{ role: "user", parts: [{ text: contextString }] }],
      });

      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("HTML transcript generation error:", error);
      throw new Error(`HTML transcript generation failed: ${error.message}`);
    }
  }
}
