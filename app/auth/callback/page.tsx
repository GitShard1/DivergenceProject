'use client'

import { useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'



export default function AuthCallback() {
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const token = searchParams.get('access_token')
    const username = searchParams.get('username')
    
    if (token && username) {
      localStorage.setItem('auth_token', token)
      localStorage.setItem('username', username)
      router.push('/home')
    } else {
      router.push('/')
    }
  }, [searchParams, router])

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      color: '#c9d1d9'
    }}>
      <p>Authenticating...</p>
    </div>
  )
}