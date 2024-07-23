'use client'

const LoginForm = () => {
    const test = (number: string) => {
        // filter imo dawaton is all number 
    }
  return (
        <form action="">
            <div className="flex flex-col gap-14 h-full">
                <div className="w-full flex flex-col gap-2">
                    <input type="text" className="w-full p-2 shadow-lg border text-center" placeholder="Input your Student ID" onChange={(e)=> test(e.target.value)}/>
                </div>
            </div>
      </form>
  )
}

export default LoginForm