'use client'

import Link from "next/link"

const GetClearance = () => {
  return (
    <Link href="/view_clearance">
        <button className="bg-green-700 hover:bg-green-500 w-full rounded-md p-2 text-white">View Clearance</button>
    </Link>
  )
}

export default GetClearance