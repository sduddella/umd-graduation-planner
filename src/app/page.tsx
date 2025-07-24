'use client'
import { useState, useEffect } from 'react'
import { ChevronRight, GraduationCap, BookOpen, Users, Download, Plus, Trash2, Calendar } from 'lucide-react'
import MajorSelector from './components/MajorSelector'
import CourseInput from './components/CourseInput'
import GradPlan from './components/GradPlan'

interface Major {
  name: string
  requirements: string[]
  credits: number
}

interface Course {
  code: string
  name: string
  credits: number
  prerequisites: string[]
  semester: string
}

export default function Home() {
  const [selectedMajors, setSelectedMajors] = useState<Major[]>([])
  const [selectedMinors, setSelectedMinors] = useState<Major[]>([])
  const [completedCourses, setCompletedCourses] = useState<Course[]>([])
  const [gradPlan, setGradPlan] = useState<Course[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)

  const generateGradPlan = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          majors: selectedMajors,
          minors: selectedMinors,
          completedCourses: completedCourses,
        }),
      })
      
      const data = await response.json()
      setGradPlan(data.plan)
      setCurrentStep(4)
    } catch (error) {
      console.error('Error generating graduation plan:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <GraduationCap className="h-8 w-8 text-umd-red" />
              <h1 className="text-xl font-bold text-white">UMD Graduation Planner</h1>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-umd-gold text-sm font-medium">Powered by AI</span>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center space-x-8 mb-12">
          {[
            { num: 1, title: 'Select Majors/Minors', icon: BookOpen },
            { num: 2, title: 'Input Completed Courses', icon: Users },
            { num: 3, title: 'Generate Plan', icon: Calendar },
            { num: 4, title: 'Review & Download', icon: Download },
          ].map((step, index) => (
            <div key={step.num} className="flex items-center">
              <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                currentStep >= step.num 
                  ? 'bg-umd-red border-umd-red text-white' 
                  : 'border-gray-600 text-gray-400'
              }`}>
                <step.icon className="h-5 w-5" />
              </div>
              <span className={`ml-3 text-sm font-medium ${
                currentStep >= step.num ? 'text-white' : 'text-gray-400'
              }`}>
                {step.title}
              </span>
              {index < 3 && <ChevronRight className="ml-6 h-5 w-5 text-gray-600" />}
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Configuration */}
          <div className="lg:col-span-2 space-y-8">
            {currentStep >= 1 && (
              <div className="card">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <BookOpen className="mr-3 h-6 w-6 text-umd-red" />
                  Select Your Academic Path
                </h2>
                <MajorSelector
                  selectedMajors={selectedMajors}
                  selectedMinors={selectedMinors}
                  onMajorsChange={setSelectedMajors}
                  onMinorsChange={setSelectedMinors}
                />
                {selectedMajors.length > 0 && (
                  <button 
                    onClick={() => setCurrentStep(2)}
                    className="btn-primary mt-6"
                  >
                    Continue to Courses
                  </button>
                )}
              </div>
            )}

            {currentStep >= 2 && (
              <div className="card">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <Users className="mr-3 h-6 w-6 text-umd-red" />
                  Completed Courses
                </h2>
                <CourseInput
                  completedCourses={completedCourses}
                  onCoursesChange={setCompletedCourses}
                />
                <button 
                  onClick={() => setCurrentStep(3)}
                  className="btn-primary mt-6"
                >
                  Continue to Generate Plan
                </button>
              </div>
            )}

            {currentStep >= 3 && (
              <div className="card">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <Calendar className="mr-3 h-6 w-6 text-umd-red" />
                  Generate Your Graduation Plan
                </h2>
                <div className="space-y-4">
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="font-semibold text-umd-gold mb-2">Plan Summary:</h3>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• {selectedMajors.length} Major(s): {selectedMajors.map(m => m.name).join(', ')}</li>
                      <li>• {selectedMinors.length} Minor(s): {selectedMinors.map(m => m.name).join(', ')}</li>
                      <li>• {completedCourses.length} Completed Courses</li>
                    </ul>
                  </div>
                  <button 
                    onClick={generateGradPlan}
                    disabled={isGenerating}
                    className="btn-primary w-full"
                  >
                    {isGenerating ? 'Generating Plan...' : 'Generate AI-Powered Graduation Plan'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Summary/Preview */}
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-4">Academic Summary</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-400">Selected Majors:</span>
                  <div className="mt-1">
                    {selectedMajors.length > 0 ? (
                      selectedMajors.map((major, index) => (
                        <span key={index} className="inline-block bg-umd-red text-white text-xs px-2 py-1 rounded mr-2 mb-1">
                          {major.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500 text-sm">None selected</span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-400">Selected Minors:</span>
                  <div className="mt-1">
                    {selectedMinors.length > 0 ? (
                      selectedMinors.map((minor, index) => (
                        <span key={index} className="inline-block bg-umd-gold text-black text-xs px-2 py-1 rounded mr-2 mb-1">
                          {minor.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500 text-sm">None selected</span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-400">Completed Courses:</span>
                  <div className="mt-1 text-2xl font-bold text-umd-gold">
                    {completedCourses.length}
                  </div>
                </div>
              </div>
            </div>

            {gradPlan.length > 0 && (
              <div className="card">
                <h3 className="text-lg font-semibold text-white mb-4">Quick Stats</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Semesters:</span>
                    <span className="text-white font-semibold">8</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Remaining Credits:</span>
                    <span className="text-umd-gold font-semibold">
                      {gradPlan.reduce((sum, course) => sum + course.credits, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Expected Graduation:</span>
                    <span className="text-white font-semibold">May 2028</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Graduation Plan Display */}
        {currentStep >= 4 && gradPlan.length > 0 && (
          <div className="mt-12">
            <GradPlan gradPlan={gradPlan} onPlanChange={setGradPlan} />
          </div>
        )}
      </div>
    </div>
  )
}
