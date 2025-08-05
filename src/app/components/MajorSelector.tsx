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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMajorsAndMinors()
  }, [])

  const fetchMajorsAndMinors = async () => {
    setLoading(true)
    try {
      // Since the API endpoint is not working, use comprehensive fallback data
      const majorsData = [
        { name: 'Computer Science', requirements: ['CMSC131', 'CMSC132', 'CMSC216', 'CMSC250', 'CMSC330', 'CMSC351'], credits: 120 },
        { name: 'Mathematics', requirements: ['MATH140', 'MATH141', 'MATH241', 'MATH246', 'MATH340', 'MATH401'], credits: 120 },
        { name: 'Physics', requirements: ['PHYS161', 'PHYS162', 'PHYS260', 'PHYS270', 'PHYS374', 'PHYS375'], credits: 120 },
        { name: 'Chemistry', requirements: ['CHEM131', 'CHEM132', 'CHEM231', 'CHEM232', 'CHEM241', 'CHEM242'], credits: 120 },
        { name: 'Biology', requirements: ['BIOL105', 'BIOL106', 'BIOL207', 'BIOL208', 'CHEM131', 'CHEM132'], credits: 120 },
        { name: 'Mechanical Engineering', requirements: ['ENES100', 'ENES102', 'ENME202', 'ENME272', 'ENME351', 'ENME392'], credits: 128 },
        { name: 'Electrical Engineering', requirements: ['ENEE140', 'ENEE150', 'ENEE205', 'ENEE244', 'ENEE303', 'ENEE350'], credits: 128 },
        { name: 'Civil Engineering', requirements: ['ENCE100', 'ENCE200', 'ENCE202', 'ENCE203', 'ENCE350', 'ENCE353'], credits: 128 },
        { name: 'Business', requirements: ['BMGT110', 'BMGT220', 'BMGT230', 'BMGT340', 'BMGT350', 'BMGT380'], credits: 120 },
        { name: 'Economics', requirements: ['ECON200', 'ECON201', 'ECON300', 'ECON325', 'ECON330', 'MATH140'], credits: 120 },
        { name: 'Psychology', requirements: ['PSYC100', 'PSYC200', 'PSYC221', 'PSYC300', 'PSYC301', 'STAT200'], credits: 120 },
        { name: 'English', requirements: ['ENGL101', 'ENGL250', 'ENGL270', 'ENGL301', 'ENGL391', 'ENGL393'], credits: 120 },
        { name: 'History', requirements: ['HIST100', 'HIST110', 'HIST200', 'HIST289', 'HIST300', 'HIST400'], credits: 120 },
        { name: 'Information Systems', requirements: ['INST126', 'INST201', 'INST301', 'INST314', 'INST326', 'INST335'], credits: 120 },
        { name: 'Journalism', requirements: ['JOUR100', 'JOUR150', 'JOUR175', 'JOUR200', 'JOUR250', 'JOUR300'], credits: 120 },
        { name: 'Kinesiology', requirements: ['KNES100', 'KNES200', 'KNES201', 'KNES285', 'KNES300', 'KNES350'], credits: 120 },
        { name: 'Criminology', requirements: ['CCJS100', 'CCJS200', 'CCJS230', 'CCJS300', 'CCJS350', 'CCJS461'], credits: 120 },
        { name: 'Public Health', requirements: ['HLTH100', 'HLTH200', 'HLTH250', 'HLTH300', 'HLTH350', 'HLTH400'], credits: 120 }
      ]

      const minorsData = [
        { name: 'Statistics', requirements: ['STAT400', 'STAT401', 'STAT420', 'STAT430'], credits: 18 },
        { name: 'Business', requirements: ['BMGT110', 'BMGT220', 'BMGT230', 'BMGT350'], credits: 18 },
        { name: 'Mathematics', requirements: ['MATH140', 'MATH141', 'MATH241', 'MATH340'], credits: 18 },
        { name: 'Computer Science', requirements: ['CMSC131', 'CMSC132', 'CMSC216', 'CMSC250'], credits: 18 },
        { name: 'Philosophy', requirements: ['PHIL100', 'PHIL140', 'PHIL170', 'PHIL201'], credits: 18 },
        { name: 'Spanish', requirements: ['SPAN103', 'SPAN201', 'SPAN202', 'SPAN301'], credits: 18 },
        { name: 'French', requirements: ['FREN103', 'FREN201', 'FREN202', 'FREN301'], credits: 18 },
        { name: 'Art History', requirements: ['ARTH200', 'ARTH201', 'ARTH202', 'ARTH300'], credits: 18 },
        { name: 'Music', requirements: ['MUSC100', 'MUSC140', 'MUSC200', 'MUSC240'], credits: 18 },
        { name: 'Theatre', requirements: ['THET100', 'THET110', 'THET200', 'THET280'], credits: 18 },
        { name: 'Sustainability', requirements: ['ENST200', 'ENST201', 'ENST202', 'ENST400'], credits: 18 },
        { name: 'Nonprofit Leadership', requirements: ['NFSC100', 'NFSC200', 'NFSC300', 'NFSC400'], credits: 18 }
      ]

      setAvailableMajors(majorsData)
      setAvailableMinors(minorsData)
    } catch (error) {
      console.error('Error fetching majors and minors:', error)
      // Keep the same fallback as before in case there's an error
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
      setMajorSearch('') // Clear search after selection
    }
  }

  const removeMajor = (majorName: string) => {
    onMajorsChange(selectedMajors.filter(m => m.name !== majorName))
  }

  const addMinor = (minor: Major) => {
    if (selectedMinors.length < 3 && !selectedMinors.find(m => m.name === minor.name)) {
      onMinorsChange([...selectedMinors, minor])
      setMinorSearch('') // Clear search after selection
    }
  }

  const removeMinor = (minorName: string) => {
    onMinorsChange(selectedMinors.filter(m => m.name !== minorName))
  }

  const handleMajorKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && filteredMajors.length > 0) {
      addMajor(filteredMajors[0])
    }
  }

  const handleMinorKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && filteredMinors.length > 0) {
      addMinor(filteredMinors[0])
    }
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
            onKeyPress={handleMajorKeyPress}
            className="input-field pl-10 w-full"
          />
        </div>

        {/* Available Majors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
          {filteredMajors.map((major, index) => {
            const isAlreadySelected = selectedMajors.find(m => m.name === major.name)
            const canAdd = selectedMajors.length < 3
            
            return (
              <div
                key={index}
                className={`rounded-lg p-3 transition-colors duration-200 border border-gray-600 ${
                  isAlreadySelected 
                    ? 'bg-gray-600 cursor-not-allowed opacity-50' 
                    : canAdd 
                      ? 'bg-gray-700 hover:bg-gray-600 cursor-pointer' 
                      : 'bg-gray-700 cursor-not-allowed opacity-75'
                }`}
                onClick={() => !isAlreadySelected && canAdd && addMajor(major)}
              >
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">{major.name}</span>
                  {isAlreadySelected ? (
                    <span className="text-green-400 text-sm">✓ Selected</span>
                  ) : (
                    <Plus className={`h-4 w-4 ${canAdd ? 'text-umd-gold' : 'text-gray-500'}`} />
                  )}
                </div>
                <span className="text-xs text-gray-400">{major.credits} credits</span>
              </div>
            )
          })}
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
            onKeyPress={handleMinorKeyPress}
            className="input-field pl-10 w-full"
          />
        </div>

        {/* Available Minors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
          {filteredMinors.map((minor, index) => {
            const isAlreadySelected = selectedMinors.find(m => m.name === minor.name)
            const canAdd = selectedMinors.length < 3
            
            return (
              <div
                key={index}
                className={`rounded-lg p-3 transition-colors duration-200 border border-gray-600 ${
                  isAlreadySelected 
                    ? 'bg-gray-600 cursor-not-allowed opacity-50' 
                    : canAdd 
                      ? 'bg-gray-700 hover:bg-gray-600 cursor-pointer' 
                      : 'bg-gray-700 cursor-not-allowed opacity-75'
                }`}
                onClick={() => !isAlreadySelected && canAdd && addMinor(minor)}
              >
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">{minor.name}</span>
                  {isAlreadySelected ? (
                    <span className="text-green-400 text-sm">✓ Selected</span>
                  ) : (
                    <Plus className={`h-4 w-4 ${canAdd ? 'text-umd-gold' : 'text-gray-500'}`} />
                  )}
                </div>
                <span className="text-xs text-gray-400">{minor.credits} credits</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}