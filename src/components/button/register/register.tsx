'use client'

import Link from "next/link"

const RegisterButton = () => {
  return (
      <Link href="/register_account">
          <button className="w-full rounded-md p-2 hover:underline hover:underline-offset-4">Create Account?</button>   
      </Link>  
    )
}

export default RegisterButton