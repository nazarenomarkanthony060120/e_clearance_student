'use client'

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from "react";
import SubmitButton from '../button/submit/submit';
import ReturnToLogin from '../button/backtologin/backtologin';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { toast } from "react-toastify";
import { doc, serverTimestamp, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, firestore } from "@/lib/firebase";
import { FirebaseError } from "firebase/app";

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
  const [isSubmit, setIsSubmit] = useState(false);

  const router = useRouter();

  const capitalizeFullName = (name: string) => {
    return name.replace(/\b\w/g, char => char.toUpperCase());
  };

  const formatStudentID = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    // Add a hyphen after the first 6 digits only
    const formatted = digits.length > 6 ? `${digits.slice(0, 6)}-${digits.slice(6)}` : digits;
    return formatted;
  };

  const handleStudentIDChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatStudentID(e.target.value);
    setStudentID(formattedValue);
  };

    // Add a helper function to validate full name input
  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    // Allow only letters and spaces
    const validName = input.replace(/[^a-zA-Z\s]/g, ''); 
    setFullName(capitalizeFullName(validName));
  };

  <input 
    type="text" 
    className="w-full p-2 shadow-lg border text-center" 
    placeholder="Full Name" 
    value={fullName}
    onChange={handleFullNameChange}
    required
  />


  const handleRegisterSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isSubmit) return;

    // Check if passwords match
    if (password !== confirmPassword) {
        setErrorMsg("Passwords do not match");
        setIsSubmit(false);
        return;
    }

    setIsSubmit(true);
    setErrorMsg(null);  // Clear any previous error messages

    try {
      // Check if the studentID already exists
      const studentQuery = query(collection(firestore, 'users'), where('studentID', '==', studentID));
      const studentSnapshot = await getDocs(studentQuery);

      if (!studentSnapshot.empty) {
        setErrorMsg("Student ID invalid. Please enter your correct ID");
        setIsSubmit(false);
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

        await setDoc(doc(firestore, 'users', user.uid), {
            studentID,
            fullName,
            email,
            password,
            selectedDepartment,
            selectedCourse,
            selectedLevel,
            selectedSemester,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        toast.success("Account Created!", {
            theme: 'colored',
        });

        await new Promise(resolve => setTimeout(resolve, 3000));
        router.push('/login');
    } catch (error: unknown) {
        if (error instanceof FirebaseError) {
            // Check for specific error code
            if (error.code === 'auth/email-already-in-use') {
                setErrorMsg("Email Already Exist");
            } else {
                setErrorMsg("Error registering user: " + error.message);
            }
        } else if (error instanceof Error) {
            setErrorMsg("Error registering user: " + error.message);
        } else {
            setErrorMsg("An unknown error occurred");
        }

        toast.error(errorMsg, {
            theme: 'colored',
        });
    } finally {
        setIsSubmit(false);
    }
  };

  return (
    <form onSubmit={handleRegisterSubmit} className='flex flex-col gap-8 h-full'>
      {errorMsg && <p className="text-red-500">{errorMsg}</p>}
      <div className="w-full flex flex-col gap-2">
          <input
            type="text"
            className="w-full p-2 shadow-lg border text-center"
            placeholder="Input your Student ID"
            value={studentID}
            onChange={handleStudentIDChange}
            required
          />
         <input 
            type="text" 
            className="w-full p-2 shadow-lg border text-center" 
            placeholder="Full Name" 
            value={fullName}
            onChange={handleFullNameChange}
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

          <select 
            className="w-full p-2 shadow-lg border text-center custom-select" 
            value={selectedDepartment} 
            onChange={handleDepartmentChange} 
            required
          >
            <option value="" disabled>Select Department</option>
            {departments.map((department, index) => (
              <option key={index} value={department}>{department}</option>
            ))}
          </select>
          <select 
            className="w-full p-2 shadow-lg border text-center custom-select" 
            value={selectedCourse} 
            onChange={(e) => setSelectedCourse(e.target.value)} 
            required
          >
            <option value="" disabled hidden>Select Course</option>
            {filteredCourses.map((course, index) => (
              <option key={index} value={course}>{course}</option>
            ))}
          </select>
          <select 
            className="w-full p-2 shadow-lg border text-center custom-select" 
            value={selectedLevel} 
            onChange={(e) => setSelectedLevel(e.target.value)} 
            required
          >
            <option value="" disabled>Year</option>
            {level.map((level, index) => (
              <option key={index} value={level}>{level}</option>
            ))}
          </select>
          <select 
            className="w-full p-2 shadow-lg border text-center custom-select" 
            value={selectedSemester} 
            onChange={(e) => setSelectedSemester(e.target.value)} 
            required
          >
            <option value="" disabled>Semester</option>
            {semester.map((semester, index) => (
              <option key={index} value={semester}>{semester}</option>
            ))}
          </select>
      </div>
      <div className="flex flex-col gap-1">
        <SubmitButton loading={isSubmit} />
        <ReturnToLogin />
      </div>
    </form>
  );
};

export default CreateStudentAccount;
