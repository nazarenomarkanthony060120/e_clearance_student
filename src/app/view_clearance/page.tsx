import StudentClearanceView from '@/components/student_clearance/student_clearance/student_clearance'
import StudentInformation from '@/components/student_clearance/student_information/student_information'
import React from 'react'

const SubmitCredentials = () => {
  return (
    <div className=' text-black bg-slate-200 p-10'>
      <div className='flex justify-center text-black bg-slate-200'>
            <StudentInformation/>
      </div>
      <StudentClearanceView/>
    </div>
  )
}

export default SubmitCredentials
