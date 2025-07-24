'use client'
import { useState, useEffect } from 'react'
import { Search, Plus, X } from 'lucide-react'

interface Major {
  name: string
  requirements: string[]
  credits: number
}

interface MajorSelectorProps {
  selectedMajors: Major[]
  selectedMinors: Major[]
  onMajorsChange: (majors: Major[]) => void
  onMinorsChange: (minors: Major[]) => void
}

export default function MajorSelector({ 
  selectedMajors, 
  selectedMinors, 
  onMajorsChange, 
  onMinorsChange 
}: MajorSelectorProps) {
  const [availableMajors, setAvailableMajors] = useState<Major[]>([])
  const [availableMinors, setAvailableMinors] = useState<Major[]>([])
  const [majorSearch, setMajorSearch] = useState('')
  const [minorSearch, setMinorSearch] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchMajorsAndMinors()
  }, [])

  const fetchMajorsAndMinors = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/scrape-majors')
      const data = await response.json()
      setAvailableMajors(data.majors || [])
      setAvailableMinors(data.minors || [])
    } catch (error) {
      console.error('Error fetching majors and minors:', error)
      // Fallback data for demo
      setAvailableMajors([
        { name: 'Computer Science', requirements: ['CMSC131', 'CMSC132', 'CMSC216'], credits: 120 },
        { name: 'Mathematics', requirements: ['MATH140', 'MATH141', 'MATH241'], credits: 120 },
        { name: 'Physics', requirements: ['PHYS161', 'PHYS162', 'PHYS260'], credits: 120 },
      ])
      setAvailableMinors([
        { name: 'Statistics', requirements: ['STAT400', 'STAT401'], credits: 18 },
        { name: 'Business', requirements: ['BMGT110', 'BMGT220'], credits: 18 },
      ])
    } finally {
      setLoading(false)
    }
  }

  const filteredMajors = availableMajors.filter(major =>
    major.name.toLowerCase().includes(majorSearch.toLowerCase())
  )

  const filteredMinors = availableMinors.filter(minor =>
    minor.name.toLowerCase().includes(minorSearch.toLowerCase())
  )

  const addMajor = (major: Major) => {
    if (selectedMajors.length < 3 && !selectedMajors.find(m => m.name === major.name)) {
      onMajorsChange([...selectedMajors, major])
    }
  }

  const removeMajor = (majorName: string) => {
    onMajorsChange(selectedMajors.filter(m => m.name !== majorName))
  }

  const addMinor = (minor: Major) => {
    if (selectedMinors.length < 3 && !selectedMinors.find(m => m.name === minor.name)) {
      onMinorsChange([...selectedMinors, minor])
    }
  }

  const removeMinor = (minorName: string) => {
    onMinorsChange(selectedMinors.filter(m => m.name !== minorName))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-umd-red"></div>
        <span className="ml-3 text-gray-400">Loading majors and minors...</span>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Majors Section */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">
          Select Majors (Up to 3)
        </h3>
        
        {/* Selected Majors */}
        {selectedMajors.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-400 mb-2">Selected Majors:</h4>
            <div className="flex flex-wrap gap-2">
              {selectedMajors.map((major, index) => (
                <div key={index} className="flex items-center bg-umd-red text-white px-3 py-1 rounded-full text-sm">
                  <span>{major.name}</span>
                  <button
                    onClick={() => removeMajor(major.name)}
                    className="ml-2 hover:bg-red-700 rounded-full p-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Major Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search for majors..."
            value={majorSearch}
            onChange={(e) => setMajorSearch(e.target.value)}
            className="input-field pl-10 w-full"
          />
        </div>

        {/* Available Majors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
          {filteredMajors.map((major, index) => (
            <div
              key={index}
              className="bg-gray-700 hover:bg-gray-600 rounded-lg p-3 cursor-pointer transition-colors duration-200 border border-gray-600"
              onClick={() => addMajor(major)}
            >
              <div className="flex items-center justify-between">
                <span className="text-white font-medium">{major.name}</span>
                <Plus className="h-4 w-4 text-umd-gold" />
              </div>
              <span className="text-xs text-gray-400">{major.credits} credits</span>
            </div>
          ))}
        </div>
      </div>

      {/* Minors Section */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">
          Select Minors (Optional, Up to 3)
        </h3>
        
        {/* Selected Minors */}
        {selectedMinors.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-400 mb-2">Selected Minors:</h4>
            <div className="flex flex-wrap gap-2">
              {selectedMinors.map((minor, index) => (
                <div key={index} className="flex items-center bg-umd-gold text-black px-3 py-1 rounded-full text-sm">
                  <span>{minor.name}</span>
                  <button
                    onClick={() => removeMinor(minor.name)}
                    className="ml-2 hover:bg-yellow-400 rounded-full p-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Minor Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search for minors..."
            value={minorSearch}
            onChange={(e) => setMinorSearch(e.target.value)}
            className="input-field pl-10 w-full"
          />
        </div>

        {/* Available Minors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
          {filteredMinors.map((minor, index) => (
            <div
              key={index}
              className="bg-gray-700 hover:bg-gray-600 rounded-lg p-3 cursor-pointer transition-colors duration-200 border border-gray-600"
              onClick={() => addMinor(minor)}
            >
              <div className="flex items-center justify-between">
                <span className="text-white font-medium">{minor.name}</span>
                <Plus className="h-4 w-4 text-umd-gold" />
              </div>
              <span className="text-xs text-gray-400">{minor.credits} credits</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}