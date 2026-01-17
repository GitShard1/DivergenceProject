'use client'

import { useState } from 'react'
import AddProjectModal from '@/components/AddProjectModal'

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false)
 
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
      <button
        onClick={() => setIsModalOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
      >
        + New Project
      </button>

      <AddProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}