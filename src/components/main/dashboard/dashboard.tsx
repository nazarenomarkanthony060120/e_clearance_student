// import CreateClearance from '@/components/button/create_clearance/button'
// import Create_Clearance_Form from '@/components/form/create_clearance/form'
import { useState } from 'react'
// import BoxInfo from '../box/box'
// import LatestStudent from '../latest_student/latest_student'

const StudentDashboard = () => {

  const [ isClick, setIsClick ] = useState(false)
  return (
      <div className='flex flex-col p-5'>
        {/* <BoxInfo />
        <LatestStudent /> */}
        {/* <CreateClearance className='bg-green-700 hover:bg-green-500 rounded-md p-2 text-white w-40' text='Make Clearance'/>
        <Create_Clearance_Form /> */}
      </div>
  )
}

export default StudentDashboard