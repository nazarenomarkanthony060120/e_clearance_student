'use client'

import Link from "next/link"


const ReturnToLogin = () => {
  return (
    <Link href="/login">
      <button className="w-full rounded-md p-2 hover:underline hover:underline-offset-4">Login</button>   
    </Link>  
)
}

export default ReturnToLogin
