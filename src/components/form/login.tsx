'use client'

import { useState } from 'react';
import GetClearance from '../button/clearance/clearance'
import { useRouter } from 'next/navigation';
import RegisterButton from '../button/register/register';


const LoginForm = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    
    const router = useRouter()

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (!email || !password) {
            setError('Both fields are required.');
            return;
        }
        router.push('/view_clearance')
        setError(null);
        console.log('Submitting:', { email, password });
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-14 h-full">
            {error && <p className="text-red-500">{error}</p>}
            <div className="w-full flex flex-col gap-2">
                <input type="email" 
                    className="w-full p-2 shadow-lg border text-center" 
                    placeholder="Input your Email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                />
                <input 
                    type="password" 
                    className="w-full p-2 shadow-lg border text-center" 
                    placeholder="Input your Password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                />
            </div>
            <div className="flex flex-col gap-5">
            <GetClearance />
            <RegisterButton/>
            </div>
        </form>
    )
}
export default LoginForm;