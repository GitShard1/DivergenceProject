'use client'

import { useRouter } from 'next/navigation'

export default function Navbar() {
  const router = useRouter()

  const handleSignOut = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('username')
    router.push('/')
  }

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-brand">Divergence</div>
        <ul className="nav-menu">
          <li><a onClick={() => router.push('/home')} className="nav-link">Home</a></li>
          <li><a onClick={() => router.push('/profile')} className="nav-link">Profile</a></li>
          <li><a onClick={() => router.push('/projects')} className="nav-link">Projects</a></li>
          <li><a onClick={handleSignOut} className="nav-link sign-out">Sign Out</a></li>
        </ul>
      </div>
    </nav>
  )
}