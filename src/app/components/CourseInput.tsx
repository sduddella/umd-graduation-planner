'use client'
import { useState } from 'react'
import { Plus, Trash2, Upload, Search } from 'lucide-react'

interface Course {
  code: string
  name: string
  credits: number
  prerequisites: string[]
  semester: string
}

interface CourseInputProps {
  completedCourses: Course[]
  onCoursesChange: (courses: Course[]) => void
}

const commonCourses = [
  { code: 'ENGL101', name: 'Academic Writing', credits: 3, prerequisites: [] },
  { code: 'MATH140', name: 'Calculus I', credits: 4, prerequisites: [] },
  { code: 'MATH141', name: 'Calculus II', credits: 4, prerequisites: ['MATH140'] },
  { code: 'CMSC131', name: 'Object-Oriented Programming I', credits: 4, prerequisites: [] },
  { code: 'CMSC132', name: 'Object-Oriented Programming II', credits: 4, prerequisites: ['CMSC131'] },
  { code: 'CHEM131', name: 'General Chemistry I', credits: 3, prerequisites: [] },
  { code: 'PHYS161', name: 'General Physics I', credits: 3, prerequisites: ['MATH140'] },
  { code: 'HIST', name: 'History Elective', credits: 3, prerequisites: [] },
  { code: 'PSYC100', name: 'Introduction to Psychology', credits: 3, prerequisites: [] },
  { code: 'ECON200', name: 'Principles of Economics', credits: 3, prerequisites: [] },
  { code: 'STAT400', name: 'Applied Statistics', credits: 3, prerequisites: ['MATH141'] },
  { code: 'BMGT110', name: 'Introduction to Business', credits: 3, prerequisites: [] }
]

export default function CourseInput({ completedCourses, onCoursesChange }: CourseInputProps) {
  const [newCourse, setNewCourse] = useState({
    code: '',
    name: '',
    credits: 3,
    semester: ''
  })
  const [courseSearch, setCourseSearch] = useState('')
  const [searchResults, setSearchResults] = useState<Omit<Course, 'semester'>[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [bulkInput, setBulkInput] = useState('')

  const addCourse = () => {
    if (newCourse.code && newCourse.name) {
      const course: Course = {
        ...newCourse,
        prerequisites: []
      }
      onCoursesChange([...completedCourses, course])
      setNewCourse({ code: '', name: '', credits: 3, semester: '' })
    }
  }

  const removeCourse = (index: number) => {
    onCoursesChange(completedCourses.filter((_, i) => i !== index))
  }

  const addCommonCourse = (course: Omit<Course, 'semester'>) => {
    if (!completedCourses.some(c => c.code === course.code)) {
      const newCourse: Course = {
        ...course,
        semester: 'Previously Completed'
      }
      onCoursesChange([...completedCourses, newCourse])
    }
  }

  const searchCourses = async () => {
    if (!courseSearch.trim()) return
    
    setIsSearching(true)
    try {
      const response = await fetch(`/api/search-courses?q=${encodeURIComponent(courseSearch)}`)
      const data = await response.json()
      setSearchResults(data.courses || [])
    } catch (error) {
      console.error('Error searching courses:', error)
      // Fallback search in common courses
      const filtered = commonCourses.filter(course => 
        course.code.toLowerCase().includes(courseSearch.toLowerCase()) ||
        course.name.toLowerCase().includes(courseSearch.toLowerCase())
      )
      setSearchResults(filtered)
    } finally {
      setIsSearching(false)
    }
  }

  const addSearchResult = (course: Omit<Course, 'semester'>) => {
    const newCourse: Course = {
      ...course,
      semester: 'Previously Completed'
    }
    onCoursesChange([...completedCourses, newCourse])
    setSearchResults(searchResults.filter(c => c.code !== course.code))
  }

  const processBulkInput = async () => {
    if (!bulkInput.trim()) return

    const courseCodes = bulkInput
      .split(/[,\n\r]+/)
      .map(code => code.trim().toUpperCase())
      .filter(code => code.length > 0)
      .filter(code => /^[A-Z]{4}\d{3}[A-Z]?$/.test(code))

    const newCourses: Course[] = []
    
    for (const code of courseCodes) {
      if (!completedCourses.some(c => c.code === code)) {
        try {
          const response = await fetch(`/api/courses/${code}`)
          const courseData = await response.json()
          
          newCourses.push({
            code: courseData.code,
            name: courseData.name || 'Course Name',
            credits: courseData.credits || 3,
            prerequisites: courseData.prerequisites || [],
            semester: 'Previously Completed'
          })
        } catch (error) {
          // Fallback for unknown courses
          newCourses.push({
            code,
            name: 'Course Name',
            credits: 3,
            prerequisites: [],
            semester: 'Previously Completed'
          })
        }
      }
    }

    if (newCourses.length > 0) {
      onCoursesChange([...completedCourses, ...newCourses])
      setBulkInput('')
    }
  }

  const handleTranscriptUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const formData = new FormData()
      formData.append('transcript', file)
      
      const response = await fetch('/api/parse-transcript', {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      
      if (data.courses && data.courses.length > 0) {
        const parsedCourses: Course[] = data.courses.map((course: any) => ({
          code: course.code,
          name: course.name || 'Course Name',
          credits: course.credits || 3,
          prerequisites: [],
          semester: course.semester || 'Previously Completed'
        }))
        
        onCoursesChange([...completedCourses, ...parsedCourses])
      }
    } catch (error) {
      console.error('Error parsing transcript:', error)
      alert('Error parsing transcript. Please try manual entry.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Add Course Form */}
      <div className="bg-gray-700 rounded-lg p-4">
        <h4 className="text-lg font-medium text-white mb-4">Add Completed Course</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Course Code (e.g., CMSC131)"
            value={newCourse.code}
            onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value.toUpperCase() })}
            className="input-field"
          />
          <input
            type="text"
            placeholder="Course Name"
            value={newCourse.name}
            onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
            className="input-field"
          />
          <input
            type="number"
            placeholder="Credits"
            min="1"
            max="6"
            value={newCourse.credits}
            onChange={(e) => setNewCourse({ ...newCourse, credits: parseInt(e.target.value) || 3 })}
            className="input-field"
          />
          <input
            type="text"
            placeholder="Semester (e.g., Fall 2023)"
            value={newCourse.semester}
            onChange={(e) => setNewCourse({ ...newCourse, semester: e.target.value })}
            className="input-field"
          />
        </div>
        <button
          onClick={addCourse}
          className="btn-primary mt-4 flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Course
        </button>
      </div>

      {/* Quick Add Common Courses */}
      <div className="bg-gray-700 rounded-lg p-4">
        <h4 className="text-lg font-medium text-white mb-4">Quick Add Common Courses</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {commonCourses.map((course, index) => (
            <button
              key={index}
              onClick={() => addCommonCourse(course)}
              className="bg-gray-600 hover:bg-gray-500 text-white text-sm px-3 py-2 rounded transition-colors duration-200 text-left disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={completedCourses.some(c => c.code === course.code)}
            >
              <div className="font-semibold">{course.code}</div>
              <div className="text-xs text-gray-300 truncate">{course.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Course Search and Add */}
      <div className="bg-gray-700 rounded-lg p-4">
        <h4 className="text-lg font-medium text-white mb-4">Search UMD Courses</h4>
        <div className="flex space-x-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search courses (e.g., CMSC, calculus, physics)..."
              value={courseSearch}
              onChange={(e) => setCourseSearch(e.target.value)}
              className="input-field pl-10 w-full"
              onKeyPress={(e) => e.key === 'Enter' && searchCourses()}
            />
          </div>
          <button
            onClick={searchCourses}
            disabled={isSearching}
            className="btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            <h5 className="text-sm font-medium text-gray-400 mb-2">Search Results:</h5>
            {searchResults.map((course, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-800 rounded p-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-white">{course.code}</span>
                    <span className="text-sm text-umd-gold">{course.credits} cr</span>
                  </div>
                  <div className="text-sm text-gray-300">{course.name}</div>
                  {course.prerequisites.length > 0 && (
                    <div className="text-xs text-gray-400 mt-1">
                      Prerequisites: {course.prerequisites.join(', ')}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => addSearchResult(course)}
                  disabled={completedCourses.some(c => c.code === course.code)}
                  className="btn-primary text-sm px-3 py-1 ml-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {completedCourses.some(c => c.code === course.code) ? 'Added' : 'Add'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bulk Import from Text */}
      <div className="bg-gray-700 rounded-lg p-4">
        <h4 className="text-lg font-medium text-white mb-4">Bulk Import</h4>
        <textarea
          placeholder="Paste course codes separated by commas or new lines&#10;Example: CMSC131, MATH140, ENGL101&#10;PHYS161&#10;CHEM131"
          value={bulkInput}
          onChange={(e) => setBulkInput(e.target.value)}
          className="input-field w-full h-24 resize-none"
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-400">
            {bulkInput.split(/[,\n\r]+/).filter(code => code.trim().length > 0).length} courses detected
          </span>
          <button
            onClick={processBulkInput}
            disabled={!bulkInput.trim()}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Import Courses
          </button>
        </div>
      </div>

      {/* Transcript Upload */}
      <div className="bg-gray-700 rounded-lg p-4">
        <h4 className="text-lg font-medium text-white mb-4">Upload Transcript</h4>
        <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-gray-500 transition-colors">
          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-400 mb-2">Upload your unofficial transcript (PDF)</p>
          <p className="text-xs text-gray-500 mb-3">Supports UMD, AP, and transfer credit transcripts</p>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleTranscriptUpload}
            className="hidden"
            id="transcript-upload"
          />
          <label
            htmlFor="transcript-upload"
            className="btn-secondary cursor-pointer inline-block"
          >
            Choose File
          </label>
        </div>
      </div>

      {/* Completed Courses List */}
      {completedCourses.length > 0 && (
        <div>
          <h4 className="text-lg font-medium text-white mb-4">
            Completed Courses ({completedCourses.length})
          </h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {completedCourses.map((course, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <span className="font-medium text-white">{course.code}</span>
                    <span className="text-gray-300">{course.name}</span>
                    <span className="text-sm text-umd-gold">{course.credits} credits</span>
                  </div>
                  {course.semester && (
                    <span className="text-xs text-gray-400">{course.semester}</span>
                  )}
                </div>
                <button
                  onClick={() => removeCourse(index)}
                  className="text-red-400 hover:text-red-300 p-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}