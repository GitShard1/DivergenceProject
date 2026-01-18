'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import LoadingSpinner from '@/components/LoadingSpinner'
import { getAuthState, setAuthState, getAuthHeader } from '@/lib/auth'

const API_ENDPOINT = "http://localhost:8000"

interface UserData {
  profile: {
    avatar?: string
    nameUser?: string
    username?: string
  }
  statsHome: {
    totalProjects?: number
    totalRating?: number
    totalLanguages?: number
  }
  projects: {
    top?: Array<{
      nameTop: string
      descriptionTop: string
      languageTop: string
      languageColorTop?: string
      starsTop?: number
      forksTop?: number
    }>
    new?: Array<{
      nameNew: string
      descriptionNew: string
      languageNew: string
      languageColorNew?: string
      createdAtNew: string
      commitsNew?: number
    }>
  }
  recentWorks?: Array<{
    nameRecent: string
    projectRecent: string
    statusRecent: string
    priorityRecent: string
    lastUpdatedRecent: string
  }>
}

interface TranslatedData {
  skills: {
    ai_ml?: number
    web_development?: number
    mobile_development?: number
    cloud_devops?: number
    data_engineering?: number
    cybersecurity?: number
  }
  languages: {
    [key: string]: number
  }
  frameworks: { [key: string]: number } | null
  libraries: { [key: string]: number } | null
  technical_depth?: {
    depth_score: number
    level: string
  }
}

export default function HomePage() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [translatedData, setTranslatedData] = useState<TranslatedData | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [processingMessage, setProcessingMessage] = useState('Processing your GitHub data...')
  const [processingDetails, setProcessingDetails] = useState<string[]>([])
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleAuth = async () => {
      const tokenFromUrl = searchParams.get('token')
      const usernameFromUrl = searchParams.get('username')
      const userIdFromUrl = searchParams.get('user_id')
      
      if (tokenFromUrl && usernameFromUrl) {
        setAuthState(usernameFromUrl, tokenFromUrl, userIdFromUrl || undefined)
        
        // Check if data needs processing (first login or no data)
        // DO NOT replace URL until after processing check
        await checkAndProcessData(usernameFromUrl)
        
        // Clean up URL after processing starts
        router.replace('/home', { scroll: false })
        return
      }
      
      fetchUserData()
    }

    handleAuth()
  }, [])

  const checkAndProcessData = async (username: string) => {
    console.log('🔄 Starting checkAndProcessData for:', username)
    try {
      setProcessing(true)
      setProcessingDetails([])
      
      // Stage 1: Show initial loading
      setProcessingMessage('Step 1/3: Fetching GitHub Repositories')
      setProcessingDetails(['Connecting to GitHub API...', `Analyzing @${username}'s repositories...`])
      
      console.log('📡 Polling for data...')
      
      // Poll for data - backend processes automatically on login
      let attempts = 0
      const maxAttempts = 30 // 30 seconds max
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        console.log(`🔍 Attempt ${attempts + 1}/${maxAttempts}: Checking for data...`)
        
        // Get user_id from auth state
        const { userId } = getAuthState()
        const checkUrl = userId
          ? `${API_ENDPOINT}/get-filtered-data/${username}?user_id=${userId}`
          : `${API_ENDPOINT}/get-filtered-data/${username}`
        
        // Check if data is ready
        const checkRes = await fetch(checkUrl, {
          headers: getAuthHeader()
        })
        
        console.log('Response status:', checkRes.status)
        
        if (checkRes.ok) {
          // Data is ready!
          console.log('✅ Data is ready!')
          setProcessingMessage('✓ Processing Complete!')
          setProcessingDetails([
            '✓ Repositories fetched',
            '✓ Data filtered and cleaned',
            '✓ Skills analyzed',
            '✓ Profile generated'
          ])
          
          // Wait a moment for user to see completion
          await new Promise(resolve => setTimeout(resolve, 1000))
          await fetchUserData()
          setProcessing(false)
          return
        }
        
        // Update progress messages based on time elapsed
        if (attempts === 5) {
          console.log('📊 Stage 2: Filtering data...')
          setProcessingMessage('Step 2/3: Filtering & Cleaning Data')
          setProcessingDetails([
            '✓ Repositories fetched',
            'Extracting languages and frameworks...',
            'Identifying key technologies...'
          ])
        } else if (attempts === 15) {
          console.log('🔬 Stage 3: Analyzing profile...')
          setProcessingMessage('Step 3/3: Analyzing Developer Profile')
          setProcessingDetails([
            '✓ Data filtered and cleaned',
            'Computing skill metrics...',
            'Building developer profile...',
            'Generating insights...'
          ])
        }
        
        attempts++
      }
      
      // Timeout - load whatever data is available
      console.warn('⏱️ Processing timeout, loading available data...')
      setProcessingMessage('⚠ Taking longer than expected...')
      setProcessingDetails(['Loading available data...'])
      await new Promise(resolve => setTimeout(resolve, 1000))
      await fetchUserData()
      setProcessing(false)
      
    } catch (error) {
      console.error('❌ Error during processing:', error)
      setProcessingMessage('⚠ Error occurred. Loading available data...')
      setTimeout(() => {
        setProcessing(false)
        fetchUserData()
      }, 1500)
    }
  }

  const fetchUserData = async () => {
    const { username, token, userId, isAuthenticated } = getAuthState()
    
    if (!isAuthenticated) {
      router.push('/')
      return
    }

    try {
      // Build URL with user_id parameter if available
      const filteredUrl = userId 
        ? `${API_ENDPOINT}/get-filtered-data/${username}?user_id=${userId}`
        : `${API_ENDPOINT}/get-filtered-data/${username}`
      
      // Fetch filtered data (projects, stats, etc.)
      const filteredRes = await fetch(filteredUrl, {
        headers: getAuthHeader()
      })
      
      if (filteredRes.ok) {
        const data = await filteredRes.json()
        console.log('Received filtered data:', data)
        setUserData(data)
        
        // Log stats for debugging
        console.log('Stats loaded:', {
          projects: data.statsHome?.totalProjects || 0,
          rating: data.statsHome?.totalRating || 0,
          languages: data.statsHome?.totalLanguages || 0
        })
      } else if (filteredRes.status === 401) {
        const { clearAuthState } = await import('@/lib/auth')
        clearAuthState()
        router.push('/')
        return
      } else if (filteredRes.status === 404) {
        console.log('No filtered data found - still processing...')
        setUserData(null)
      }

      // Build URL with user_id parameter if available
      const translatedUrl = userId
        ? `${API_ENDPOINT}/get-translated-data/${username}?user_id=${userId}`
        : `${API_ENDPOINT}/get-translated-data/${username}`
      
      // Also fetch translated data (skills, languages breakdown, etc.)
      const translatedRes = await fetch(translatedUrl, {
        headers: getAuthHeader()
      })
      
      if (translatedRes.ok) {
        const translated = await translatedRes.json()
        console.log('Received translated data:', translated)
        setTranslatedData(translated)
      } else {
        console.log('No translated data available yet')
        setTranslatedData(null)
      }
      
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (processing) {
    return (
      <>
        <style>{`
          @keyframes spinAnimation {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes fadeInUpAnimation {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes pulseAnimation {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
        `}</style>
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(13, 17, 23, 0.98)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2rem',
            maxWidth: '500px',
            padding: '2rem'
          }}>
            {/* Spinner */}
            <div style={{
              width: '64px',
              height: '64px',
              border: '5px solid #30363d',
              borderTopColor: '#2ea043',
              borderRadius: '50%',
              animation: 'spinAnimation 1s linear infinite'
            }}></div>
            
            {/* Main Message */}
            <div style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              color: '#c9d1d9',
              textAlign: 'center'
            }}>
              {processingMessage}
            </div>
            
            {/* Progress Details */}
            <div style={{
              width: '100%',
              background: '#161b22',
              border: '1px solid #30363d',
              borderRadius: '8px',
              padding: '1.5rem',
              minHeight: '120px'
            }}>
              {processingDetails.map((detail, idx) => (
                <div
                  key={idx}
                  style={{
                    color: detail.startsWith('✓') ? '#2ea043' : '#8b949e',
                    fontSize: '0.95rem',
                    padding: '0.4rem 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    animation: 'fadeInUpAnimation 0.3s ease-out forwards',
                    animationDelay: `${idx * 0.1}s`,
                    opacity: 0
                  }}
                >
                  {!detail.startsWith('✓') && (
                    <div style={{
                      width: '6px',
                      height: '6px',
                      background: '#58a6ff',
                      borderRadius: '50%',
                      animation: 'pulseAnimation 1.5s ease-in-out infinite'
                    }}></div>
                  )}
                  <span>{detail}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    )
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <LoadingSpinner message="Loading your dashboard..." />
      </>
    )
  }

  if (!userData) {
    return (
      <>
        <Navbar />
        <div className="home-container">
          <p>No data available. Please process your GitHub data first.</p>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="home-container">
        {/* PROFILE SECTION */}
        <div className="profile-section">
          <div className="profile-header">
            <img 
              src={userData.profile?.avatar || '/default-avatar.png'} 
              alt={userData.profile?.nameUser || 'User'} 
              className="profile-avatar" 
            />
            <div className="profile-info">
              <h2>{userData.profile?.nameUser || 'Unknown User'}</h2>
              <p className="username">@{userData.profile?.username || 'unknown'}</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="stats-grid">
            {/* Total Projects */}
            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon blue">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                  </svg>
                </div>
                <span className="stat-label">Total Projects</span>
              </div>
              <p className="stat-value stat-value-projects">
                {userData.statsHome?.totalProjects || 0}
              </p>
            </div>

            {/* Rating */}
            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon yellow">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                </div>
                <span className="stat-label">Rating</span>
              </div>
              <div className="stat-value stat-value-rating" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                {userData.statsHome?.totalRating && Array.from({ length: userData.statsHome.totalRating }).map((_, i) => (
                  <svg key={i} width="24" height="24" viewBox="0 0 24 24" fill="#f1c40f" stroke="#f1c40f" strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                ))}
                {!userData.statsHome?.totalRating && <span>0</span>}
              </div>
              {userData.statsHome?.qualityLevel && (
                <p style={{ fontSize: '0.875rem', color: '#8b949e', marginTop: '0.5rem', textAlign: 'center' }}>
                  {userData.statsHome.qualityLevel}
                </p>
              )}
            </div>

            {/* Total Languages */}
            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon green">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 11 12 14 22 4"></polyline>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                  </svg>
                </div>
                <span className="stat-label">Languages</span>
              </div>
              <p className="stat-value stat-value-languages">
                {userData.statsHome?.totalLanguages || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="content-grid">
          {/* Left Column: Projects */}
          <div className="left-column">
            {/* TOP PROJECTS SECTION */}
            <div className="section-card">
              <div className="section-header">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
                <h3>Top Projects</h3>
              </div>
              <div className="projects-list">
                {userData.projects?.top && userData.projects.top.length > 0 ? (
                  userData.projects.top.map((project, idx) => (
                    <div key={idx} className="project-item">
                      <h4 className="project-name">{project.nameTop}</h4>
                      <p className="project-desc">{project.descriptionTop}</p>
                      <div className="project-meta">
                        <div className="meta-item">
                          <span 
                            className="language-dot" 
                            style={{ backgroundColor: project.languageColorTop || '#999' }}
                          ></span>
                          <span>{project.languageTop}</span>
                        </div>
                        {project.starsTop !== undefined && (
                          <div className="meta-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                            </svg>
                            <span>{project.starsTop}</span>
                          </div>
                        )}
                        {project.forksTop !== undefined && (
                          <div className="meta-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="6" y1="3" x2="6" y2="15"></line>
                              <circle cx="18" cy="6" r="3"></circle>
                              <circle cx="6" cy="18" r="3"></circle>
                              <path d="M18 9a9 9 0 0 1-9 9"></path>
                            </svg>
                            <span>{project.forksTop}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ color: '#8b949e', padding: '1rem' }}>No top projects available</p>
                )}
              </div>
            </div>

            {/* SKILLS OVERVIEW - from translated.json */}
            {translatedData && (
              <div className="section-card">
                <div className="section-header">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  <h3>Skills Analysis</h3>
                </div>
                <div className="skills-breakdown">
                  {Object.entries(translatedData.skills || {}).map(([skill, score]) => {
                    const percentage = typeof score === 'number' ? Math.round(score * 100) : 0
                    const skillName = skill.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                    return (
                      <div key={skill} className="skill-bar-item">
                        <div className="skill-bar-header">
                          <span className="skill-name">{skillName}</span>
                          <span className="skill-percentage">{percentage}%</span>
                        </div>
                        <div className="skill-bar-track">
                          <div 
                            className="skill-bar-fill" 
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: percentage > 70 ? '#2ea043' : percentage > 40 ? '#58a6ff' : '#8b949e'
                            }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                
                {translatedData.technical_depth && (
                  <div className="tech-depth-badge" style={{
                    marginTop: '1rem',
                    padding: '0.75rem',
                    background: 'rgba(46, 160, 67, 0.1)',
                    border: '1px solid #2ea043',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2ea043" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span style={{ color: '#2ea043', fontWeight: 600 }}>
                      Technical Level: {translatedData.technical_depth.level.toUpperCase()}
                    </span>
                    <span style={{ color: '#8b949e', fontSize: '0.875rem' }}>
                      (Score: {translatedData.technical_depth.depth_score.toFixed(1)})
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* LANGUAGES BREAKDOWN - from translated.json */}
            {translatedData && translatedData.languages && Object.keys(translatedData.languages).length > 0 && (
              <div className="section-card">
                <div className="section-header">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="16 18 22 12 16 6"></polyline>
                    <polyline points="8 6 2 12 8 18"></polyline>
                  </svg>
                  <h3>Languages Distribution</h3>
                </div>
                <div className="languages-breakdown">
                  {Object.entries(translatedData.languages)
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .slice(0, 8)
                    .map(([lang, percentage]) => (
                      <div key={lang} className="language-bar-item">
                        <div className="language-bar-header">
                          <span className="language-name">{lang}</span>
                          <span className="language-percentage">{Math.round(percentage as number)}%</span>
                        </div>
                        <div className="language-bar-track">
                          <div 
                            className="language-bar-fill" 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* FRAMEWORKS & LIBRARIES - from translated.json */}
            {translatedData && (translatedData.frameworks || translatedData.libraries) && (
              <div className="section-card">
                <div className="section-header">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="9" y1="9" x2="15" y2="9"></line>
                    <line x1="9" y1="15" x2="15" y2="15"></line>
                  </svg>
                  <h3>Technologies & Tools</h3>
                </div>
                
                {translatedData.frameworks && Object.keys(translatedData.frameworks).length > 0 && (
                  <div className="tech-section">
                    <h4 style={{ fontSize: '0.875rem', color: '#8b949e', marginBottom: '0.5rem' }}>Frameworks</h4>
                    <div className="tech-tags">
                      {Object.entries(translatedData.frameworks)
                        .filter(([, count]) => count > 0)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 10)
                        .map(([name, count]) => (
                          <span key={name} className="tech-tag framework-tag">
                            {name} <span className="tag-count">({count})</span>
                          </span>
                        ))}
                    </div>
                  </div>
                )}
                
                {translatedData.libraries && Object.keys(translatedData.libraries).length > 0 && (
                  <div className="tech-section" style={{ marginTop: '1rem' }}>
                    <h4 style={{ fontSize: '0.875rem', color: '#8b949e', marginBottom: '0.5rem' }}>Libraries & Tools</h4>
                    <div className="tech-tags">
                      {Object.entries(translatedData.libraries)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 15)
                        .map(([name, count]) => (
                          <span key={name} className="tech-tag library-tag">
                            {name} <span className="tag-count">({count})</span>
                          </span>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: RECENT WORKS */}
          <div className="right-column">
            <div className="section-card sticky">
              <div className="section-header">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <h3>Recent Works</h3>
              </div>
              <div className="works-list">
                {userData.recentWorks && userData.recentWorks.length > 0 ? (
                  userData.recentWorks.map((work, idx) => (
                    <div key={idx} className="work-item">
                      <div className="work-header">
                        <h4>{work.nameRecent}</h4>
                        <span className={`priority-badge ${work.priorityRecent.toLowerCase()}`}>
                          {work.priorityRecent}
                        </span>
                      </div>
                      <p className="work-project">{work.projectRecent}</p>
                      <div className="work-footer">
                        <span className={`status-badge ${work.statusRecent === 'In Progress' ? 'in-progress' : 'todo'}`}>
                          {work.statusRecent}
                        </span>
                        <span className="work-time">{work.lastUpdatedRecent}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ color: '#8b949e', padding: '1rem' }}>No recent works available</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}