'use client'

import { type } from 'os';
import { useState } from 'react';

// Define the types for departments and courses
type Department = 'CITE' | 'COCJE' | 'COTE' | 'COHM';
type Course = string[];

const CreateStudentAccount = () => {
  // department options
  const departments: Department[] = ['CITE', 'COCJE', 'COTE', 'COHM'];

  // course options
  const courses: Record<Department, Course> = {
    CITE: ['BSIT'],
    COCJE: ['BSCRIM'],
    COTE: ['BSED', 'BEED'],
    COHM: ['BSHM']
  };
  
  // grade level
  const level: string[] = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
  // semester level
  const semester: string[] = ['1st', '2nd'];
  
  // state for selected department and courses
  const [selectedDepartment, setSelectedDepartment] = useState<Department | ''>('');
  const [filteredCourses, setFilteredCourses] = useState<Course>([]);

  const handleDepartmentChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const department = event.target.value as Department;
    setSelectedDepartment(department);
    setFilteredCourses(courses[department] || []);
  };
  
  return (
    <form action="">
        <div className="flex flex-col gap-14 h-full">
            <div className="w-full flex flex-col gap-2">
                <input type="text" className="w-full p-2 shadow-lg border text-center" placeholder="Input your Student ID" required/>
                <input type="text" className="w-full p-2 shadow-lg border text-center" placeholder="Full Name" required/>

                <select className="w-full p-2 shadow-lg border text-center custom-select" value={selectedDepartment} onChange={handleDepartmentChange}>
                <option value="" disabled selected>Select Department</option>
                  {departments.map((department, index) => (
                    <option key={index} value={department}>{department}</option>
                  ))}
                </select>
                <select className="w-full p-2 shadow-lg border text-center custom-select">
                  <option value="" disabled selected hidden>Select Course</option>
                    {filteredCourses.map((course, index) => (
                    <option key={index} value={course}>{course}</option>
                  ))}
                </select>

                
                <select className="w-full p-2 shadow-lg border text-center custom-select">
                  <option className="text-gray-300" value="" disabled selected>Year</option>
                    {level.map((level, index) => (
                      <option key={index} value={level}>{level}</option>
                    ))}
                </select>

                <select className="w-full p-2 shadow-lg border text-center custom-select">
                  <option className="text-gray-300" value="" disabled selected>Semester</option>
                    {semester.map((semester, index) => (
                      <option key={index} value={semester}>{semester}</option>
                    ))}
                </select>
            </div>
        </div>
    </form>
  )
}

export default CreateStudentAccount
