// utils/groqService.ts
import OpenAI from "openai";
import { User } from "../models/User";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatContext {
  role: User["role"];
  userId: number;
  userName: string;
  userEmail?: string;
  applications?: any[];
  jobs?: any[];
}

export class GroqService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.GROQ_API_KEY!,
      baseURL: "https://api.groq.com/openai/v1",
    });
  }

  async chat(
    message: string,
    context: ChatContext,
    history: ChatMessage[] = [],
  ): Promise<string> {
    try {
      const systemPrompt = this.getSystemPrompt(context);

      const completion = await this.client.chat.completions.create({
        model: "llama-3.1-8b-instant", // or llama-3.1-8b-instant
        temperature: 0.7,
        max_tokens: 2048,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          ...history.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          {
            role: "user",
            content: message,
          },
        ],
      });

      return completion.choices[0]?.message?.content ?? "";
    } catch (error) {
      console.error("Groq Chat Error:", error);
      throw new Error("AI chat failed");
    }
  }

  private getSystemPrompt(context: ChatContext): string {
    const basePrompt = `
You are an intelligent ATS (Applicant Tracking System) assistant.

Current user: ${context.userName} (${context.role})
Current date: ${new Date().toLocaleDateString()}

IMPORTANT INSTRUCTIONS:
- Be helpful, friendly, and professional
- Keep responses concise (2–3 paragraphs max)
- Use bullet points for lists
- When the user asks to perform actions (match jobs, rank candidates, generate descriptions),
  instruct them to use the relevant feature buttons in the UI
- You may explain concepts and workflows
- DO NOT invent data; only use what is provided in context
`;

    if (context.role === "candidate") {
      return `
${basePrompt}

ROLE: Candidate Assistant

You help job candidates with:
- Understanding application status
- Interview preparation (tips, common questions)
- Resume and career advice
- Explaining the hiring process

User's active applications: ${context.applications?.length || 0}

Available UI features:
- "Find Matching Jobs"
- Application status dashboard
- Job applications

Be encouraging, clear, and supportive.
`;
    }

    if (context.role === "hr") {
      return `
${basePrompt}

ROLE: HR Assistant

You help HR professionals with:
- Candidate evaluation guidance
- Interview best practices
- Recruitment strategy
- ATS feature usage

Active jobs managed: ${context.jobs?.length || 0}

Available UI features:
- "AI Rank Candidates"
- "AI Generate Job Description"
- Candidate profile review

Be professional and data-driven.
`;
    }

    if (context.role === "admin") {
      return `
${basePrompt}

ROLE: Admin Assistant

You help system administrators with:
- Platform analytics
- User management
- System optimization
- Reporting and compliance
- Technical troubleshooting

Be precise, technical, and concise.
`;
    }

    return basePrompt;
  }
}
