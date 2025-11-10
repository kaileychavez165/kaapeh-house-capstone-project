import axios from 'axios';
import Constants from 'expo-constants';

// Azure OpenAI Configuration
// Access environment variables through expo-constants
const AZURE_OPENAI_ENDPOINT = Constants.expoConfig?.extra?.azureOpenAIEndpoint || '';
const AZURE_OPENAI_KEY = Constants.expoConfig?.extra?.azureOpenAIKey || '';
const AZURE_OPENAI_DEPLOYMENT_NAME = Constants.expoConfig?.extra?.azureOpenAIDeploymentName || '';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface AzureOpenAIResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
  }>;
}

/**
 * Send a chat message to Azure OpenAI and get a response
 * @param messages - Array of chat messages (conversation history)
 * @returns The assistant's response text
 */
export async function sendChatMessage(messages: ChatMessage[]): Promise<string> {
  try {
    if (!AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_KEY || !AZURE_OPENAI_DEPLOYMENT_NAME) {
      throw new Error('Azure OpenAI configuration is missing. Please check your environment variables.');
    }

    const url = `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT_NAME}/chat/completions?api-version=2024-02-15-preview`;

    console.log('🤖 Sending request to Azure OpenAI...');

    const response = await axios.post<AzureOpenAIResponse>(
      url,
      {
        messages: messages,
        max_tokens: 800,
        temperature: 0.7,
        top_p: 0.95,
        frequency_penalty: 0,
        presence_penalty: 0,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'api-key': AZURE_OPENAI_KEY,
        },
        timeout: 30000, // 30 second timeout
      }
    );

    if (response.data.choices && response.data.choices.length > 0) {
      const assistantMessage = response.data.choices[0].message.content;
      console.log('✅ Received response from Azure OpenAI');
      return assistantMessage;
    } else {
      throw new Error('No response from Azure OpenAI');
    }
  } catch (error) {
    console.error('❌ Error calling Azure OpenAI:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.response) {
        console.error('Response error:', error.response.status, error.response.data);
        throw new Error(`Azure OpenAI API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        throw new Error('No response from Azure OpenAI. Please check your network connection.');
      }
    }
    
    throw new Error('Failed to get response from chatbot. Please try again.');
  }
}

/**
 * Create a system prompt for the Kaapeh House chatbot
 */
export function getSystemPrompt(): string {
  return `You are Kaapi, a friendly and helpful AI assistant for Kaapeh House, a coffee shop and café. 

IMPORTANT: Your name is Kaapi. Always remember and use this name when introducing yourself or referring to yourself in conversations.

Your role is to:

1. Help customers with menu recommendations based on their preferences
2. Answer questions about coffee drinks, ingredients, and preparation methods
3. Provide information about the café (hours, location, etc.)
4. Assist with order-related questions
5. Be warm, welcoming, and enthusiastic about coffee
6. Always introduce yourself as Kaapi when greeting customers or starting conversations

Key guidelines:
- Keep responses concise and friendly
- Use emojis occasionally to add warmth (☕️, 😊, 🍵, etc.)
- If you don't know something specific about the café, be honest and suggest they ask staff
- Always prioritize customer satisfaction and helpfulness
- Recommend popular items when appropriate
- Remember: Your name is Kaapi - use it consistently!

Remember: You represent Kaapeh House, so maintain a professional yet friendly tone!`;
}

