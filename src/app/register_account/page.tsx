import CreateStudentAccount from '@/components/create_student_account/create_student_form/create_student_account'
import { MdOutlineCreate } from 'react-icons/md'

const RegisterAccount = () => {
    return (
      <div className='min-h-screen flex items-center justify-center text-black bg-slate-200'>
          <div className='min-h-screen flex items-center justify-center text-black bg-slate-200'>
            <div className="w-[350px] h-fit rounded-md shadow-md bg-white flex flex-col gap-10 p-5 ">
                <div className="flex justify-center items-center flex-col gap-1">
                  <MdOutlineCreate className='text-[34px] text-gray-600'/>
                <span className="text-2xl font-bold text-[#d6543a] ">STUDENT REGISTER</span>
                </div>
                  <CreateStudentAccount/>
            </div>
          </div>
      </div>
    )
  }
  
  export default RegisterAccount 