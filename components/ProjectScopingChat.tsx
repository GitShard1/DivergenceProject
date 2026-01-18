'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Loader2, X } from 'lucide-react'
import styles from './ProjectScopingChat.module.css'

interface Message {
  type: 'user' | 'assistant' | 'system' | 'error'
  content: string
}

interface ProjectScopingChatProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  projectName: string
  projectGoal: string
  projectDueDate: string
}

export default function ProjectScopingChat({ 
  isOpen, 
  onClose, 
  projectId,
  projectName,
  projectGoal,
  projectDueDate
}: ProjectScopingChatProps) {
  const [confidence, setConfidence] = useState(0)
  const [userInput, setUserInput] = useState('')
  const [chatHistory, setChatHistory] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [threadId, setThreadId] = useState<string | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatHistory])

  // Initialize scoping when modal opens
  useEffect(() => {
    if (isOpen && !threadId) {
      initializeScoping()
    }
  }, [isOpen])

  const initializeScoping = async () => {
    setIsLoading(true)
    
    try {
      const response = await fetch('http://localhost:8000/api/projects/create-ai-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName,
          goal: projectGoal,
          dueDate: projectDueDate,
          mode: "solo",
          teamMembers: [],
          repoOption: "new",
          existingRepoUrl: null
        })
      })
      
      const data = await response.json()
      
      // Save thread ID
      setThreadId(data.thread_id)
      
      // Set initial confidence
      setConfidence(Math.round(data.confidence * 100))
      
      // Add first AI question
      setChatHistory([{ 
        type: 'assistant', 
        content: data.question
      }])
      
    } catch (error) {
      console.error('Error initializing scoping:', error)
      setChatHistory([{ 
        type: 'error', 
        content: 'Failed to start scoping. Please try again.' 
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!userInput.trim() || isLoading || !threadId) return

    const userMessage = userInput.trim()
    setUserInput('')
    
    // Add user message to history
    setChatHistory(prev => [...prev, { type: 'user', content: userMessage }])
    
    setIsLoading(true)

    try {
      // Call continue scoping endpoint
      const response = await fetch('http://localhost:8000/api/projects/continue-scoping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          thread_id: threadId,
          message: userMessage
        })
      })
      
      const data = await response.json()
      
      // Update confidence
      setConfidence(Math.round(data.confidence * 100))
      
      // Check if complete
      if (data.complete) {
        setIsComplete(true)
        setChatHistory(prev => [...prev, { 
          type: 'system', 
          content: '🎉 Scoping complete! Ready to generate your project breakdown.' 
        }])
      } else {
        // Add AI's next question
        setChatHistory(prev => [...prev, { 
          type: 'assistant', 
          content: data.question
        }])
      }
      
    } catch (error) {
      console.error('Error:', error)
      setChatHistory(prev => [...prev, { 
        type: 'error', 
        content: 'Sorry, something went wrong. Please try again.' 
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleGenerateBreakdown = async () => {
    // TODO: Add task generation endpoint call here
    alert('Task generation coming next!')
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      
      <div className={styles.container}>
        <div className={styles.modal}>
          
          {/* Header */}
          <div className={styles.header}>
            <div>
              <h2 className={styles.title}>Scoping: {projectName}</h2>
              <p className={styles.subtitle}>AI-powered project planning</p>
            </div>
            <button onClick={onClose} className={styles.closeButton}>
              <X size={24} />
            </button>
          </div>

          {/* Confidence Bar */}
          <div className={styles.confidenceSection}>
            <div className={styles.confidenceHeader}>
              <span className={styles.confidenceLabel}>Project Understanding</span>
              <span className={styles.confidenceValue}>{confidence}%</span>
            </div>
            
            <div className={styles.confidenceBarContainer}>
              <div 
                className={styles.confidenceBar}
                style={{ width: `${confidence}%` }}
              />
            </div>
          </div>

          {/* Chat Area */}
          <div className={styles.chatArea}>
            {chatHistory.map((message, idx) => (
              <div
                key={idx}
                className={`${styles.messageWrapper} ${
                  message.type === 'user' ? styles.userWrapper : styles.assistantWrapper
                }`}
              >
                <div
                  className={`${styles.message} ${
                    message.type === 'user'
                      ? styles.userMessage
                      : message.type === 'system'
                      ? styles.systemMessage
                      : message.type === 'error'
                      ? styles.errorMessage
                      : styles.assistantMessage
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className={styles.assistantWrapper}>
                <div className={styles.loadingMessage}>
                  <Loader2 className={styles.spinner} />
                  <span>Analyzing...</span>
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          {!isComplete ? (
            <div className={styles.inputSection}>
              <div className={styles.inputWrapper}>
                <textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your response..."
                  disabled={isLoading || !threadId}
                  className={styles.textarea}
                  rows={3}
                />
                
                <button
                  onClick={handleSubmit}
                  disabled={!userInput.trim() || isLoading || !threadId}
                  className={styles.sendButton}
                >
                  {isLoading ? (
                    <Loader2 className={styles.spinner} />
                  ) : (
                    <>
                      <span>Next</span>
                      <Send size={16} />
                    </>
                  )}
                </button>
              </div>
              
              <p className={styles.hint}>
                Press Enter to send • Shift + Enter for new line
              </p>
            </div>
          ) : (
            <div className={styles.completeSection}>
              <p className={styles.completeText}>
                Ready to generate your project breakdown
              </p>
              <button 
                onClick={handleGenerateBreakdown}
                className={styles.generateButton}
              >
                Generate Project Breakdown
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}