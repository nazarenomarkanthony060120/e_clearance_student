'use client'

import Link from "next/link"

const SubmitButton = () => {
  return (
    <Link href="/login">
      <button className="bg-green-700 hover:bg-green-500 w-full rounded-md p-2 text-white">Create Account</button>
    </Link>  
  )
}

export default SubmitButton