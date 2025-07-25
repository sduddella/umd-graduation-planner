// app/components/GradPlan.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

interface Course {
  course_id: string;
  name: string;
  credits: number;
  prerequisites: string[];
  satisfies: string[];
  color?: string;
}

interface Semester {
  id: string;
  semester: string;
  year: number;
  courses: Course[];
  totalCredits: number;
}

interface GradPlanProps {
  initialPlan?: {
    semesters: Semester[];
    majors: { name: string; code: string }[];
    minors: { name: string; code: string }[];
    totalCredits: number;
    warnings: string[];
  };
  onPlanChange?: (plan: any) => void;
  editable?: boolean;
}

const GradPlan: React.FC<GradPlanProps> = ({ 
  initialPlan, 
  onPlanChange, 
  editable = true 
}) => {
  const [plan, setPlan] = useState(initialPlan || {
    semesters: [],
    majors: [],
    minors: [],
    totalCredits: 0,
    warnings: []
  });
  
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // UMD colors with dark theme variations
  const umdColors = {
    primary: '#E03A3E', // UMD Red
    secondary: '#FFD520', // UMD Gold/Yellow
    background: '#1a1a1a',
    surface: '#2d2d2d',
    surfaceLight: '#3a3a3a',
    text: '#ffffff',
    textSecondary: '#b0b0b0',
    success: '#4ade80',
    warning: '#fbbf24',
    error: '#ef4444'
  };

  const semesterColors = {
    'fall': '#8B4513',
    'spring': '#228B22', 
    'summer': '#FF8C00',
    'winter': '#4682B4'
  };

  const requirementColors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
    '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'
  ];

  useEffect(() => {
    if (onPlanChange) {
      onPlanChange(plan);
    }
  }, [plan, onPlanChange]);

  const handleDragEnd = (result: any) => {
    if (!result.destination || !editable) return;

    const { source, destination } = result;
    
    if (source.droppableId === destination.droppableId && 
        source.index === destination.index) {
      return;
    }

    const newSemesters = [...plan.semesters];
    const sourceIndex = newSemesters.findIndex(s => s.id === source.droppableId);
    const destIndex = newSemesters.findIndex(s => s.id === destination.droppableId);

    if (sourceIndex === -1 || destIndex === -1) return;

    // Remove course from source
    const [movedCourse] = newSemesters[sourceIndex].courses.splice(source.index, 1);
    
    // Add course to destination
    newSemesters[destIndex].courses.splice(destination.index, 0, movedCourse);

    // Recalculate credits
    newSemesters[sourceIndex].totalCredits = newSemesters[sourceIndex].courses
      .reduce((sum, course) => sum + course.credits, 0);
    newSemesters[destIndex].totalCredits = newSemesters[destIndex].courses
      .reduce((sum, course) => sum + course.credits, 0);

    setPlan({
      ...plan,
      semesters: newSemesters,
      totalCredits: newSemesters.reduce((sum, sem) => sum + sem.totalCredits, 0)
    });
  };

  const addSemester = () => {
    if (!editable) return;

    const lastSemester = plan.semesters[plan.semesters.length - 1];
    let newSeason = 'fall';
    let newYear = new Date().getFullYear();

    if (lastSemester) {
      const seasonOrder = ['spring', 'summer', 'fall'];
      const currentSeasonIndex = seasonOrder.indexOf(lastSemester.semester.toLowerCase());
      
      if (currentSeasonIndex === seasonOrder.length - 1) {
        newSeason = seasonOrder[0];
        newYear = lastSemester.year + 1;
      } else {
        newSeason = seasonOrder[currentSeasonIndex + 1];
        newYear = lastSemester.year;
      }
    }

    const newSemester: Semester = {
      id: `${newSeason}-${newYear}`,
      semester: newSeason,
      year: newYear,
      courses: [],
      totalCredits: 0
    };

    setPlan({
      ...plan,
      semesters: [...plan.semesters, newSemester]
    });
  };

  const removeSemester = (semesterId: string) => {
    if (!editable) return;

    const newSemesters = plan.semesters.filter(s => s.id !== semesterId);
    setPlan({
      ...plan,
      semesters: newSemesters,
      totalCredits: newSemesters.reduce((sum, sem) => sum + sem.totalCredits, 0)
    });
  };

  const exportPlan = async (format: 'csv' | 'json' | 'pdf') => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/graduation-plan/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          graduationPlan: plan,
          format,
          includeDetails: true
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `graduation-plan.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRequirementColor = (satisfies: string[]) => {
    if (!satisfies || satisfies.length === 0) return '#6B7280';
    
    const hash = satisfies[0].split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return requirementColors[Math.abs(hash) % requirementColors.length];
  };

  const CourseCard = ({ course, index }: { course: Course; index: number }) => (
    <Draggable 
      draggableId={`${course.course_id}-${index}`} 
      index={index}
      isDragDisabled={!editable}
    >
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`
            bg-gray-800 rounded-lg p-3 mb-2 border-l-4 cursor-pointer
            transition-all duration-200 hover:bg-gray-700
            ${snapshot.isDragging ? 'shadow-2xl rotate-2' : 'shadow-md'}
          `}
          style={{
            borderLeftColor: getRequirementColor(course.satisfies),
            ...provided.draggableProps.style
          }}
          onClick={() => {
            setSelectedCourse(course);
            setShowCourseModal(true);
          }}
        >
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold text-white text-sm">
                {course.course_id}
              </h4>
              <p className="text-gray-300 text-xs mt-1 line-clamp-2">
                {course.name}
              </p>
            </div>
            <span className="text-umd-gold text-sm font-bold">
              {course.credits}
            </span>
          </div>
          
          {course.satisfies && course.satisfies.length > 0 && (
            <div className="mt-2">
              <div className="flex flex-wrap gap-1">
                {course.satisfies.slice(0, 2).map((req, idx) => (
                  <span 
                    key={idx}
                    className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300"
                  >
                    {req.length > 15 ? `${req.substring(0, 15)}...` : req}
                  </span>
                ))}
                {course.satisfies.length > 2 && (
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300">
                    +{course.satisfies.length - 2}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );

  const SemesterColumn = ({ semester }: { semester: Semester }) => {
    const seasonColor = semesterColors[semester.semester.toLowerCase() as keyof typeof semesterColors] || '#6B7280';
    const isOverloaded = semester.totalCredits > 18;
    const isUnderloaded = semester.totalCredits < 12 && semester.courses.length > 0;

    return (
      <div className="bg-gray-900 rounded-xl p-4 min-w-80 max-w-80">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 
              className="text-lg font-bold capitalize"
              style={{ color: seasonColor }}
            >
              {semester.semester} {semester.year}
            </h3>
            <p className={`text-sm ${
              isOverloaded ? 'text-red-400' : 
              isUnderloaded ? 'text-yellow-400' : 
              'text-gray-400'
            }`}>
              {semester.totalCredits} credits
            </p>
          </div>
          
          {editable && (
            <button
              onClick={() => removeSemester(semester.id)}
              className="text-red-400 hover:text-red-300 p-1 rounded"
              title="Remove semester"
            >
              ✕
            </button>
          )}
        </div>

        <Droppable droppableId={semester.id}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`
                min-h-96 rounded-lg p-3 transition-colors
                ${snapshot.isDraggingOver ? 'bg-gray-700' : 'bg-gray-800'}
              `}
            >
              {semester.courses.map((course, index) => (
                <CourseCard key={`${course.course_id}-${index}`} course={course} index={index} />
              ))}
              {provided.placeholder}
              
              {semester.courses.length === 0 && (
                <div className="text-gray-500 text-center py-8">
                  {editable ? 'Drag courses here' : 'No courses scheduled'}
                </div>
              )}
            </div>
          )}
        </Droppable>
      </div>
    );
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: umdColors.background }}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-900 border-b border-gray-700 p-4">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-white">Graduation Plan</h1>
            <div className="flex gap-4 mt-2 text-sm text-gray-300">
              <span>Total Credits: <strong className="text-umd-gold">{plan.totalCredits}</strong></span>
              {plan.majors.length > 0 && (
                <span>Majors: <strong>{plan.majors.map(m => m.name).join(', ')}</strong></span>
              )}
              {plan.minors.length > 0 && (
                <span>Minors: <strong>{plan.minors.map(m => m.name).join(', ')}</strong></span>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => exportPlan('csv')}
              disabled={isLoading}
              className="px-4 py-2 bg-umd-red text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              Export CSV
            </button>
            <button
              onClick={() => exportPlan('json')}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors disabled:opacity-50"
            >
              Export JSON
            </button>
          </div>
        </div>
      </div>

      {/* Warnings */}
      {plan.warnings && plan.warnings.length > 0 && (
        <div className="max-w-7xl mx-auto p-4">
          <div className="bg-yellow-900/50 border border-yellow-600 rounded-lg p-4">
            <h3 className="text-yellow-300 font-semibold mb-2">⚠️ Warnings</h3>
            <ul className="text-yellow-200 text-sm space-y-1">
              {plan.warnings.map((warning, idx) => (
                <li key={idx}>• {warning}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-6 overflow-x-auto pb-4">
            {plan.semesters.map(semester => (
              <SemesterColumn key={semester.id} semester={semester} />
            ))}
            
            {editable && (
              <div className="min-w-80 max-w-80">
                <button
                  onClick={addSemester}
                  className="w-full h-32 border-2 border-dashed border-gray-600 rounded-xl flex items-center justify-center text-gray-400 hover:border-umd-red hover:text-umd-red transition-colors"
                >
                  <div className="text-center">
                    <div className="text-3xl mb-2">+</div>
                    <div>Add Semester</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </DragDropContext>
      </div>

      {/* Course Details Modal */}
      {showCourseModal && selectedCourse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-90vh overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {selectedCourse.course_id}
                </h2>
                <h3 className="text-lg text-gray-300 mt-1">
                  {selectedCourse.name}
                </h3>
              </div>
              <button
                onClick={() => setShowCourseModal(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-umd-gold font-semibold">Credits</h4>
                <p className="text-white">{selectedCourse.credits}</p>
              </div>
              
              {selectedCourse.prerequisites.length > 0 && (
                <div>
                  <h4 className="text-umd-gold font-semibold">Prerequisites</h4>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedCourse.prerequisites.map((prereq, idx) => (
                      <span key={idx} className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-sm">
                        {prereq}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedCourse.satisfies.length > 0 && (
                <div>
                  <h4 className="text-umd-gold font-semibold">Satisfies Requirements</h4>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedCourse.satisfies.map((req, idx) => (
                      <span 
                        key={idx} 
                        className="px-2 py-1 rounded text-sm text-white"
                        style={{ backgroundColor: getRequirementColor([req]) }}
                      >
                        {req}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .text-umd-red { color: ${umdColors.primary}; }
        .text-umd-gold { color: ${umdColors.secondary}; }
        .bg-umd-red { background-color: ${umdColors.primary}; }
        .bg-umd-gold { background-color: ${umdColors.secondary}; }
        .border-umd-red { border-color: ${umdColors.primary}; }
        .hover\\:border-umd-red:hover { border-color: ${umdColors.primary}; }
        .hover\\:text-umd-red:hover { color: ${umdColors.primary}; }
        .hover\\:bg-red-600:hover { background-color: #dc2626; }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .max-h-90vh { max-height: 90vh; }
      `}</style>
    </div>
  );
};

export default GradPlan;