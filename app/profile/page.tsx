'use client'

import './globals.css'

import { useState, useEffect, useRef } from 'react'
import Navbar from '@/components/Navbar'
import Script from 'next/script'

const API_ENDPOINT = "http://localhost:8000"

interface UserData {
  profile: {
    name: string
    username: string
    avatarUrl: string
    bio: string
  }
  skills: {
    radar: Array<{ subject: string; score: number }>
  }
  languages: Array<{
    name: string
    percentage: number
    color: string
  }>
  frameworks: string[]
  libraries: string[]
}

export default function ProfilePage() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstanceRef = useRef<any>(null)

  useEffect(() => {
    fetchUserData()
  }, [])

  useEffect(() => {
    if (userData && chartRef.current && typeof window !== 'undefined') {
      renderRadarChart()
    }
    
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy()
      }
    }
  }, [userData])

  const fetchUserData = async () => {
    const username = localStorage.getItem('username')
    const token = localStorage.getItem('auth_token')
    
    if (!username || !token) {
      window.location.href = '/'
      return
    }

    try {
      const res = await fetch(`${API_ENDPOINT}/get-filtered-data/${username}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (res.ok) {
        const data = await res.json()
        setUserData(data)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderRadarChart = () => {
    if (!chartRef.current || !userData) return
    
    // @ts-ignore - Chart.js loaded via CDN
    if (typeof Chart === 'undefined') return

    const ctx = chartRef.current.getContext('2d')
    if (!ctx) return

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy()
    }

    const labels = userData.skills.radar.map(s => s.subject)
    const values = userData.skills.radar.map(s => s.score)

    // @ts-ignore
    chartInstanceRef.current = new Chart(ctx, {
      type: 'radar',
      data: {
        labels,
        datasets: [{
          label: 'Skills',
          data: values,
          backgroundColor: 'rgba(46, 160, 67, 0.3)',
          borderColor: '#2ea043',
          borderWidth: 2,
          pointBackgroundColor: '#2ea043',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#2ea043',
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            beginAtZero: true,
            max: 100,
            ticks: { 
              stepSize: 20, 
              color: '#8b949e', 
              backdropColor: 'transparent' 
            },
            grid: { color: '#30363d' },
            pointLabels: { 
              color: '#8b949e', 
              font: { size: 12 } 
            },
          },
        },
        plugins: { 
          legend: { display: false } 
        },
      },
    })
  }

  if (loading) {
    return (
      <>
        <Script src="https://cdn.jsdelivr.net/npm/chart.js" strategy="beforeInteractive" />
        <Navbar />
        <div className="profile-container">Loading...</div>
      </>
    )
  }

  if (!userData) {
    return (
      <>
        <Script src="https://cdn.jsdelivr.net/npm/chart.js" strategy="beforeInteractive" />
        <Navbar />
        <div className="profile-container">No data available</div>
      </>
    )
  }

  return (
    <>
      <Script 
        src="https://cdn.jsdelivr.net/npm/chart.js" 
        strategy="beforeInteractive"
        onLoad={() => {
          if (userData && chartRef.current) {
            renderRadarChart()
          }
        }}
      />
      <Navbar />
      <div className="profile-container">
        <div className="profile-grid">
          {/* Sidebar */}
          <aside className="profile-sidebar">
            <div className="profile-card">
              <div className="profile-card-content">
                <img 
                  src={userData.profile.avatarUrl} 
                  alt={userData.profile.name} 
                  className="profile-picture" 
                />
                <h2 className="profile-name">{userData.profile.name}</h2>
                <p className="profile-username">@{userData.profile.username}</p>
                <p className="profile-bio">{userData.profile.bio}</p>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="profile-main">
            {/* Skills Radar */}
            <section className="skills-section">
              <h3>Skills Overview</h3>
              <h4>Chart of all the repositories into a comprehensive developer profile</h4>
              <div className="chart-container">
                <canvas ref={chartRef} id="skillsChart"></canvas>
              </div>
            </section>

            {/* Languages */}
            <section className="languages-section">
              <h3>Programming Languages</h3>
              <h4>Percentage of usage in each language</h4>
              <div className="languages-grid">
                {userData.languages.map((lang, idx) => (
                  <div key={idx} className="language-item">
                    <span 
                      className="language-dot" 
                      style={{ backgroundColor: lang.color }}
                    ></span>
                    <span className="language-name">{lang.name}</span>
                    <span className="language-percentage">{lang.percentage}%</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Frameworks */}
            <section className="frameworks-section">
              <h3>Frameworks</h3>
              <h4>Frameworks Frequency</h4>
              <div className="tags-container">
                {userData.frameworks.map((fw, idx) => (
                  <span key={idx} className="tag tag-purple">{fw}</span>
                ))}
              </div>
            </section>

            {/* Libraries */}
            <section className="libraries-section">
              <h3>Libraries</h3>
              <h4>Libraries & Tools use frequency</h4>
              <div className="tags-container">
                {userData.libraries.map((lib, idx) => (
                  <span key={idx} className="tag tag-green">{lib}</span>
                ))}
              </div>
            </section>
          </main>
        </div>
      </div>
    </>
  )
}