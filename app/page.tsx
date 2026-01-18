'use client'
import './globals.css'
export default function LandingPage() {
  const handleGitHubLogin = () => {
    window.location.href = 'http://localhost:8000/auth/github'
  }

  return (
    <div className="SignInPage">
      <img id="logo" src="/assets/icon.svg" alt="Divergence logo" />
      <h1>Divergence</h1>
      <p>An identity-aware AI project manager that knows how you build</p>

      <div className="HERO">
        <a className="button" onClick={handleGitHubLogin} href="#">
          Connect with GitHub
        </a>

        <p>Sign in with your GitHub account to showcase your skills and projects</p>
        <div className="grid">
          <div className="container">✓ Track your skills</div>
          <div className="container">✓ Showcase projects</div>
          <div className="container">✓ Learning patterns</div>
          <div className="container">✓ Team's Capabilities</div>
        </div>
      </div>
    </div>
  )
}