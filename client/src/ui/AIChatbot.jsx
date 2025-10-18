import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { toast } from 'react-toastify';

const ChatContainer = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
`;

const ChatToggleButton = styled.button`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #3498db;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: #2980b9;
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(52, 152, 219, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
`;

const ChatModal = styled.div`
  position: fixed;
  bottom: 90px;
  right: 20px;
  width: 350px;
  height: 500px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  z-index: 1001;
  border: 1px solid #e0e0e0;
`;

const ChatHeader = styled.div`
  background: #3498db;
  color: white;
  padding: 16px;
  border-radius: 12px 12px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ChatTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }
`;

const ChatBody = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const MessagesContainer = styled.div`
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #f8f9fa;
`;

const Message = styled.div`
  display: flex;
  justify-content: ${props => props.isUser ? 'flex-end' : 'flex-start'};
  margin-bottom: 8px;
`;

const MessageBubble = styled.div`
  max-width: 80%;
  padding: 12px 16px;
  border-radius: 18px;
  background: ${props => props.isUser ? '#007bff' : '#e9ecef'};
  color: ${props => props.isUser ? 'white' : '#333'};
  font-size: 14px;
  line-height: 1.6;
  word-wrap: break-word;
  white-space: pre-wrap;

  strong {
    font-weight: 600;
  }

  br {
    margin-bottom: 8px;
  }
`;

const InputContainer = styled.div`
  padding: 16px;
  border-top: 1px solid #e0e0e0;
  background: white;
  border-radius: 0 0 12px 12px;
`;

const InputWrapper = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const MessageInput = styled.input`
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 24px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: #007bff;
  }
`;

const SendButton = styled.button`
  background: #007bff;
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover:not(:disabled) {
    background: #0056b3;
  }

  &:disabled {
    background: #6c757d;
    cursor: not-allowed;
  }
`;

const WelcomeMessage = styled.div`
  text-align: center;
  color: #666;
  font-style: italic;
  padding: 20px;
`;

const ErrorMessage = styled.div`
  background: #f8d7da;
  color: #721c24;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  margin: 8px 0;
`;

const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  // Only user/assistant messages, do not pre-populate with assistant
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    // Add user message
    const newMessages = [...messages, { text: userMessage, isUser: true }];
    setMessages(newMessages);

    try {
      // Call backend AI chat endpoint
  const response = await fetch('https://server.livelymoss-d77e8dd3.westus2.azurecontainerapps.io/user/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JSON.parse(localStorage.getItem('token'))}`
        },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: messages.map(msg => ({
            role: msg.isUser ? 'user' : 'assistant',
            content: msg.text
          }))
        })
      });

      const data = await response.json();

      if (data.success) {
        // Add AI response
        setMessages([...newMessages, { text: data.response, isUser: false }]);
      } else {
        throw new Error(data.error || 'Failed to get AI response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      setError(error.message);
      setMessages([...newMessages, {
        text: 'Sorry, I encountered an error. Please try again later.',
        isUser: false
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    // Do not pre-populate with assistant message; show welcome in UI only
  };

  return (
    <ChatContainer>
      <ChatToggleButton onClick={toggleChat}>
        {isOpen ? '✕' : '🤖'}
      </ChatToggleButton>

      {isOpen && (
        <ChatModal>
          <ChatHeader>
            <ChatTitle>AI Assistant</ChatTitle>
            <CloseButton onClick={toggleChat}>
              ×
            </CloseButton>
          </ChatHeader>

          <ChatBody>
            <MessagesContainer>
              {messages.length === 0 && (
                <WelcomeMessage>
                  Hello! I'm your AI assistant. How can I help you with ClubVerse today?
                </WelcomeMessage>
              )}
              {messages.map((message, index) => (
                <Message key={index} isUser={message.isUser}>
                  <MessageBubble
                    isUser={message.isUser}
                    dangerouslySetInnerHTML={!message.isUser ? { __html: message.text } : undefined}
                  >
                    {message.isUser ? message.text : null}
                  </MessageBubble>
                </Message>
              ))}
              {isLoading && (
                <Message isUser={false}>
                  <MessageBubble isUser={false}>
                    Thinking...
                  </MessageBubble>
                </Message>
              )}
              {error && (
                <ErrorMessage>
                  {error}
                </ErrorMessage>
              )}
              <div ref={messagesEndRef} />
            </MessagesContainer>

            <InputContainer>
              <InputWrapper>
                <MessageInput
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  disabled={isLoading}
                />
                <SendButton
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputMessage.trim()}
                >
                  ➤
                </SendButton>
              </InputWrapper>
            </InputContainer>
          </ChatBody>
        </ChatModal>
      )}
    </ChatContainer>
  );
};

export default AIChatbot;
