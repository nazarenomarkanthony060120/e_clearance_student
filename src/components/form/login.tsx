'use client'

import { useState } from 'react'
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
                setError('Email does not exist or the Password is incorrect. Please try again.')
            }
        } finally {
            setLoading(false)
        }
    }

    return (

        <form onSubmit={handleSubmit} className="flex flex-col gap-10 h-full">
            {error && <p className="text-red-500">{error}</p>}
            <div className="w-full flex flex-col gap-2">
                <input type="email" className="w-full p-2 shadow-lg border text-center" placeholder="Input your Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <input type="password" className="w-full p-2 shadow-lg border text-center" placeholder="Input your Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="flex flex-col gap-3">
                <button type="submit" className={`bg-green-700 hover:bg-green-500 w-full rounded-md p-2 text-white ${loading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-700'}`}
                    disabled={loading}>
                    {loading ? (
                        <span className="flex items-center justify-center">
                        <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 100 8v4a8 8 0 01-8-8z" />
                        </svg>
                        Logging in...
                        </span>
                    ) : (
                        'Login'
                    )}
                </button>
            </div>
        </form>
    )
}

export default LoginForm
