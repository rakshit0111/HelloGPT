"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MessageSquare, Plus, Send, User, Bot, Menu, X, Settings, History, Trash2, Edit3 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface ChatSession {
  id: string
  title: string
  timestamp: Date
  messages: Message[]
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Save current chat session when messages change
  useEffect(() => {
    if (messages.length > 0) {
      const userMessages = messages.filter(msg => msg.role === "user")
      if (userMessages.length > 0) {
        const title = userMessages[0].content.slice(0, 50) + (userMessages[0].content.length > 50 ? "..." : "")
        
        if (currentChatId) {
          // Update existing chat
          setChatSessions(prev => prev.map(session => 
            session.id === currentChatId 
              ? { ...session, messages, timestamp: new Date() }
              : session
          ))
        } else {
          // Create new chat
          const newChatId = Date.now().toString()
          const newSession: ChatSession = {
            id: newChatId,
            title,
            timestamp: new Date(),
            messages
          }
          setChatSessions(prev => [newSession, ...prev])
          setCurrentChatId(newChatId)
        }
      }
    }
  }, [messages, currentChatId])

  const sendMessage = async (messageContent: string) => {
    if (!messageContent.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageContent.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setError(null)

    // Create abort controller for this request
    abortControllerRef.current = new AbortController()

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Create assistant message
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])

      // Read the stream
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split("\n")

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6)
              if (data === "[DONE]") {
                break
              }

              try {
                const parsed = JSON.parse(data)
                if (parsed.content) {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessage.id ? { ...msg, content: msg.content + parsed.content } : msg,
                    ),
                  )
                }
              } catch (e) {
                // Ignore parsing errors for malformed chunks
              }
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.log("Request aborted")
      } else {
        console.error("Chat error:", error)
        setError(error.message || "An error occurred while sending the message")
      }
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    await sendMessage(input)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px"
    }
  }

  useEffect(() => {
    adjustTextareaHeight()
  }, [input])

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion)
    setTimeout(() => sendMessage(suggestion), 100)
  }

  const retryLastMessage = () => {
    if (messages.length >= 2) {
      const lastUserMessage = messages[messages.length - 2]
      if (lastUserMessage.role === "user") {
        // Remove the last assistant message and retry
        setMessages((prev) => prev.slice(0, -1))
        sendMessage(lastUserMessage.content)
      }
    }
  }

  const startNewChat = () => {
    setMessages([])
    setInput("")
    setError(null)
    setCurrentChatId(null)
  }

  const loadChatSession = (sessionId: string) => {
    const session = chatSessions.find(s => s.id === sessionId)
    if (session) {
      setMessages(session.messages)
      setCurrentChatId(sessionId)
      setError(null)
      setSidebarOpen(false) // Close sidebar on mobile
    }
  }

  const deleteChatSession = (sessionId: string) => {
    setChatSessions(prev => prev.filter(s => s.id !== sessionId))
    if (currentChatId === sessionId) {
      startNewChat()
    }
  }

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date()
    const diffInHours = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 1) {
      return "Just now"
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`
    } else if (diffInHours < 48) {
      return "Yesterday"
    } else {
      return `${Math.floor(diffInHours / 24)} days ago`
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-80 bg-gray-900 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <span className="text-white font-semibold">HelloGPT</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden text-gray-400 hover:text-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* New Chat Button */}
          <div className="p-4">
            <Button
              className="w-full bg-gray-800 hover:bg-gray-700 text-white border border-gray-600"
              onClick={startNewChat}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          </div>

          {/* Chat History */}
          <ScrollArea className="flex-1 px-4">
            <div className="space-y-2">
              <h3 className="text-gray-400 text-sm font-medium mb-3">Chat History</h3>
              {chatSessions.length === 0 ? (
                <div className="text-gray-500 text-sm text-center py-8">
                  No chat history yet.<br />
                  Start a conversation to see your chats here.
                </div>
              ) : (
                chatSessions.map((session) => (
                  <div
                    key={session.id}
                    className={cn(
                      "group flex items-center justify-between p-3 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors",
                      currentChatId === session.id ? "bg-gray-800" : ""
                    )}
                    onClick={() => loadChatSession(session.id)}
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <History className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-white text-sm truncate">{session.title}</p>
                        <p className="text-gray-400 text-xs">{formatTimestamp(session.timestamp)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0 text-gray-400 hover:text-red-400"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteChatSession(session.id)
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Sidebar Footer */}
          
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b">
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            <span className="font-semibold">ChatClone</span>
          </div>
          <div className="w-10" />
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="text-red-600">⚠️</div>
                    <div>
                      <p className="text-red-800 font-medium">Error occurred</p>
                      <p className="text-red-600 text-sm">{error}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={retryLastMessage}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    Retry
                  </Button>
                </div>
              </div>
            )}

            {messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-blue-100 p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <MessageSquare className="h-12 w-12 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">How can I help you today?</h2>
                <p className="text-gray-600 mb-8">Start a conversation with your AI assistant</p>

                {/* Suggestion Cards */}
                <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                  <Card
                    className="p-4 hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-blue-200"
                    onClick={() => handleSuggestionClick("Help me write a creative story about space exploration")}
                  >
                    <h3 className="font-medium text-gray-900 mb-2">Creative Writing</h3>
                    <p className="text-sm text-gray-600">Help me write a story or poem</p>
                  </Card>
                  <Card
                    className="p-4 hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-blue-200"
                    onClick={() => handleSuggestionClick("Review this code and suggest improvements")}
                  >
                    <h3 className="font-medium text-gray-900 mb-2">Code Review</h3>
                    <p className="text-sm text-gray-600">Review and improve my code</p>
                  </Card>
                  <Card
                    className="p-4 hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-blue-200"
                    onClick={() => handleSuggestionClick("Explain quantum computing in simple terms")}
                  >
                    <h3 className="font-medium text-gray-900 mb-2">Explain Concepts</h3>
                    <p className="text-sm text-gray-600">Break down complex topics</p>
                  </Card>
                  <Card
                    className="p-4 hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-blue-200"
                    onClick={() => handleSuggestionClick("Help me solve this problem step by step")}
                  >
                    <h3 className="font-medium text-gray-900 mb-2">Problem Solving</h3>
                    <p className="text-sm text-gray-600">Help me solve challenges</p>
                  </Card>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex items-start space-x-4",
                    message.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  {message.role === "assistant" && (
                    <Avatar className="h-8 w-8 bg-blue-600 flex-shrink-0">
                      <AvatarFallback>
                        <Bot className="h-4 w-4 text-white" />
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div
                    className={cn(
                      "max-w-3xl rounded-2xl px-4 py-3",
                      message.role === "user"
                        ? "bg-blue-600 text-white ml-12"
                        : "bg-white border border-gray-200 mr-12",
                    )}
                  >
                    <div className="prose prose-sm max-w-none">
                      <p
                        className={cn("whitespace-pre-wrap", message.role === "user" ? "text-white" : "text-gray-900")}
                      >
                        {message.content}
                      </p>
                    </div>
                  </div>

                  {message.role === "user" && (
                    <Avatar className="h-8 w-8 bg-gray-600 flex-shrink-0">
                      <AvatarFallback>
                        <User className="h-4 w-4 text-white" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-start space-x-4">
                <Avatar className="h-8 w-8 bg-blue-600 flex-shrink-0">
                  <AvatarFallback>
                    <Bot className="h-4 w-4 text-white" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 mr-12">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                    <span className="text-gray-500 text-sm">AI is thinking...</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={stopGeneration}
                      className="text-gray-500 hover:text-gray-700 ml-2"
                    >
                      Stop
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t bg-white p-4">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={onSubmit} className="relative">
              <div className="flex items-end space-x-3">
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value)
                      adjustTextareaHeight()
                    }}
                    onKeyPress={handleKeyPress}
                    placeholder="Message ChatClone..."
                    className="w-full resize-none rounded-2xl border border-gray-300 px-4 py-3 pr-12 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[50px] max-h-[200px]"
                    rows={1}
                    disabled={isLoading}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!input.trim() || isLoading}
                    className="absolute right-2 bottom-2 h-8 w-8 p-0 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </form>
            <p className="text-xs text-gray-500 text-center mt-2">
              ChatClone can make mistakes. Consider checking important information.
            </p>
          </div>
        </div>
      </div>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  )
}