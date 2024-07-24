'use client'

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import SubmitButton from '../button/submit/submit';
import ReturnToLogin from '../button/backtologin/backtologin';

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
  const [selectedCourse, setSelectedCourse] = useState<string | ''>('');
  const [selectedLevel, setSelectedLevel] = useState<string | ''>('');
  const [selectedSemester, setSelectedSemester] = useState<string | ''>('');

  const handleDepartmentChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const department = event.target.value as Department;
    setSelectedDepartment(department);
    setFilteredCourses(courses[department] || []);
  };

  const [studentID, setStudentID] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, SetConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const router = useRouter()

  const capitalizeFullName = (name: string) => {
    return name.replace(/\b\w/g, char => char.toUpperCase());
  };

  const handleRegisterSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!studentID || !fullName || !email || !password || !confirmPassword ) {
      setErrorMsg('Both fields are required.');
      return;
    }
    else if (password != confirmPassword){
      setErrorMsg('Password does not Match');
      return;
    }
    router.push('/login')
    setErrorMsg(null);
        console.log('Submitting:', { studentID, fullName, email, password, confirmPassword });
  }

  return (
    <form onSubmit={handleRegisterSubmit} className='flex flex-col gap-8 h-full'>
      {errorMsg && <p className="text-red-500">{errorMsg}</p>}
      <div className="w-full flex flex-col gap-2">
          <input type="number" className="w-full p-2 shadow-lg border text-center" placeholder="Input your Student ID" 
            value={studentID}
            onChange={(e) => setStudentID(e.target.value)} 
            required
          />
          <input 
            type="name" 
            className="w-full p-2 shadow-lg border text-center" 
            placeholder="Full Name" 
            value={fullName}
            onChange={(e) => setFullName(capitalizeFullName(e.target.value))}
            required
          />
          <input 
            type="email" 
            className="w-full p-2 shadow-lg border text-center" 
            placeholder="Email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}            
            required
          />
          <input 
            type="password" 
            className="w-full p-2 shadow-lg border text-center"
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input 
            type="password" 
            className="w-full p-2 shadow-lg border text-center" 
            placeholder="Confirm Password" 
            value={confirmPassword}
            onChange={(e) => SetConfirmPassword(e.target.value)}
            required
          />

          <select className="w-full p-2 shadow-lg border text-center custom-select" value={selectedDepartment} onChange={handleDepartmentChange} required>
          <option value="" disabled selected>Select Department</option>
            {departments.map((department, index) => (
              <option key={index} value={department}>{department}</option>
            ))}
          </select>
          <select className="w-full p-2 shadow-lg border text-center custom-select" value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} required>
            <option value="" disabled selected hidden>Select Course</option>
              {filteredCourses.map((course, index) => (
              <option key={index} value={course}>{course}</option>
            ))}
          </select>
          <select className="w-full p-2 shadow-lg border text-center custom-select" value={selectedLevel} onChange={(e) => setSelectedLevel(e.target.value)} required>
            <option className="text-gray-300" value="" disabled selected>Year</option>
              {level.map((level, index) => (
                <option key={index} value={level}>{level}</option>
              ))}
          </select>

          <select className="w-full p-2 shadow-lg border text-center custom-select" value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)} required>
            <option className="text-gray-300" value="" disabled selected>Semester</option>
              {semester.map((semester, index) => (
                <option key={index} value={semester}>{semester}</option>
              ))}
          </select>
      </div>
      <div className="flex flex-col gap-1">
            <SubmitButton />
            <ReturnToLogin/>
      </div>
    </form>
  )
}

export default CreateStudentAccount
