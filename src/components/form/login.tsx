'use client'

import { useState } from 'react'
import GetClearance from '../button/clearance/clearance'
import RegisterButton from '../button/register/register'
import { toast } from "react-toastify"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useRouter } from 'next/navigation'
import { getLoginType } from '@/api/login/login'

const LoginForm = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    const router = useRouter()

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        setError(null)
        setLoading(true)

        try {
            await signInWithEmailAndPassword(auth, email, password)
            if(auth.currentUser?.uid) {
                const type = await getLoginType(auth.currentUser.uid)
                if (type == undefined) {
                    toast.success('Login successful!', {
                        theme: 'colored'
                    })
                    router.push('/home') 
                } else {
                    toast.error(`Login Failed, you're not a student!`, {
                        theme: 'colored'
                    })
                }
            }
        } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
                setError('Email does not exist.')
            } else if (error.code === 'auth/wrong-password') {
                setError('Incorrect password.')
            } 
            else {
                setError('Input your correct credential.')
            }
        } finally {
            setLoading(false)
        }
    }

    return (

        <form onSubmit={handleSubmit} className="flex flex-col gap-14 h-full">
            {error && <p className="text-red-500">{error}</p>}
            <div className="w-full flex flex-col gap-2">
                <input type="email" className="w-full p-2 shadow-lg border text-center" placeholder="Input your Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <input type="password" className="w-full p-2 shadow-lg border text-center" placeholder="Input your Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="flex flex-col gap-5">
                <button type="submit" disabled={loading} className={`bg-green-700 hover:bg-green-500 w-full rounded-md p-2 text-white ${loading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-700'}`} >
                    {loading ? 'Logging in...' : 'Login'}
                </button>
                {/* <GetClearance /> */}
                <RegisterButton />
            </div>
        </form>
    )
}

export default LoginForm
