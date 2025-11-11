import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Session } from '@supabase/supabase-js';
import { sendChatMessage, getSystemPrompt, getMenuContext } from '../../services/azureOpenAIService';

interface ChatBotProps {
  session: Session | null;
}

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatHistoryMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
//message to display while loading
// coffee related messages lol
const LOADING_MESSAGES = [
  'Brewing thoughts...',
  'Grinding the beans...',
  'Steaming up an answer...',
  'Pulling your espresso shot...',
  'Frothing up a response...',
  'Tamping down the details...',
];

export default function ChatBotScreen({ session }: ChatBotProps) {
  const navigation = useNavigation();
  const scrollViewRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm Kaapi, your Kaapeh House assistant! ☕️ How can I help you today?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatHistoryMessage[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  const getNextLoadingMessageIndex = useCallback((currentIndex: number) => {
    if (LOADING_MESSAGES.length <= 1) {
      return 0;
    }

    return (currentIndex + 1) % LOADING_MESSAGES.length;
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;

    if (isLoading) {
      setLoadingMessageIndex((prev) => getNextLoadingMessageIndex(prev));

      interval = setInterval(() => {
        setLoadingMessageIndex((prev) => getNextLoadingMessageIndex(prev));
      }, 1500);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isLoading, getNextLoadingMessageIndex]);

  // Fetch menu items and initialize chat history with menu context
  useEffect(() => {
    const initializeChat = async () => {
      try {
        console.log('📋 Fetching menu items for AI context...');
        const menuContext = await getMenuContext();
        const systemPrompt = getSystemPrompt(menuContext);
        setChatHistory([
          { role: 'system', content: systemPrompt },
        ]);
        console.log('✅ Chat initialized with menu context');
      } catch (error) {
        console.error('❌ Error initializing chat with menu context:', error);
        // Fallback to system prompt without menu context
        setChatHistory([
          { role: 'system', content: getSystemPrompt() },
        ]);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeChat();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSendMessage = async () => {
    if (inputText.trim() === '' || isLoading || isInitializing) return;

    const userMessageText = inputText.trim();
    setInputText('');
    setIsLoading(true);

    // Add user message to UI
    const userMessage: Message = {
      id: Date.now().toString(),
      text: userMessageText,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // Update chat history with user message
    const updatedHistory: ChatHistoryMessage[] = [
      ...chatHistory,
      { role: 'user', content: userMessageText },
    ];

    try {
      // Call Azure OpenAI
      console.log('🤖 Sending message to Azure OpenAI...');
      const aiResponse = await sendChatMessage(updatedHistory);

      // Add bot response to UI
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);

      // Update chat history with assistant response
      setChatHistory([
        ...updatedHistory,
        { role: 'assistant', content: aiResponse },
      ]);

      console.log('✅ Message sent and response received');
    } catch (error) {
      console.error('❌ Error sending message:', error);
      
      // Show error message in chat
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        text: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment. 😔",
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);

      // Show alert with more details
      if (error instanceof Error) {
        Alert.alert('Connection Error', error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = (message: Message) => (
    <View
      key={message.id}
      style={[
        styles.messageContainer,
        message.isUser ? styles.userMessage : styles.botMessage,
      ]}
    >
      {!message.isUser && (
        <View style={styles.botAvatar}>
          <MaterialCommunityIcons name="robot" size={20} color="#FFFFFF" />
        </View>
      )}
      <View
        style={[
          styles.messageBubble,
          message.isUser ? styles.userBubble : styles.botBubble,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            message.isUser ? styles.userText : styles.botText,
          ]}
        >
          {message.text}
        </Text>
      </View>
      {message.isUser && (
        <View style={styles.userAvatar}>
          <MaterialCommunityIcons name="account" size={20} color="#FFFFFF" />
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2B2B2B" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Chat with Kaapi ☕</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Messages Area */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => renderMessage(message))}
          {isLoading && (
            <View style={styles.loadingMessageContainer}>
              <View style={styles.botAvatar}>
                <MaterialCommunityIcons name="robot" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.loadingBubble}>
                <ActivityIndicator size="small" color="#acc18a" />
                <Text style={styles.loadingText}>
                  {LOADING_MESSAGES[loadingMessageIndex]}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type your message..."
            placeholderTextColor="#999"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton, 
              (inputText.trim() === '' || isLoading || isInitializing) && styles.sendButtonDisabled
            ]}
            onPress={handleSendMessage}
            disabled={inputText.trim() === '' || isLoading || isInitializing}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <MaterialCommunityIcons
                name="send"
                size={24}
                color={inputText.trim() === '' ? '#CCCCCC' : '#FFFFFF'}
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2B2B2B',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    paddingBottom: 16,
    backgroundColor: '#2B2B2B',
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    backgroundColor: '#F5F1E8',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
    flexGrow: 1,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  botMessage: {
    justifyContent: 'flex-start',
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#acc18a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2B2B2B',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  messageBubble: {
    maxWidth: '70%',
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: '#acc18a',
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#FFFFFF',
  },
  botText: {
    color: '#2B2B2B',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F1E8',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: '#2B2B2B',
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#acc18a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  loadingMessageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#666666',
    fontStyle: 'italic',
  },
});

