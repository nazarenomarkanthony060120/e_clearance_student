'use client'

import GetClearance from "@/components/button/clearance/clearance"
import RegisterButton from "@/components/button/register/register"

import LoginForm from "@/components/form/login"

import { BiLogIn } from 'react-icons/bi'

const Login = () => {
  return (
    <div className='min-h-screen flex items-center justify-center text-black bg-slate-200'>
        <div className='min-h-screen flex items-center justify-center text-black bg-slate-200'>
          <div className="w-[350px] h-fit rounded-md shadow-md bg-white flex flex-col gap-10 p-5 ">
              <div className="flex justify-center items-center flex-col gap-1">
                  <BiLogIn className='text-[34px] text-gray-600'/>
                  <span className="text-2xl font-bold text-[#d6543a] ">STUDENT LOGIN</span>
              </div>
            <LoginForm />
            <div className="flex flex-col gap-5">
            <GetClearance/>
            <RegisterButton/>
            </div>
          </div>
        </div>
      </div>
  )
}

export default Login
