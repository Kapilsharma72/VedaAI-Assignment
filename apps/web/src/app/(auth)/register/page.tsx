'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import api, { ApiError } from '@/lib/api';
import { setFrontendSession } from '@/lib/session';
import { useAuthStore } from '@/store/auth.store';
import type { IUser } from '@vedaai/shared';
interface AuthResponse {
    user: IUser;
    token: string;
}
const registerSchema = z.object({
    name: z
        .string()
        .min(1, 'Name is required')
        .max(100, 'Name must be 100 characters or fewer'),
    email: z
        .string()
        .min(1, 'Email is required')
        .email('Enter a valid email address'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .max(128, 'Password must be 128 characters or fewer'),
    schoolName: z
        .string()
        .min(1, 'School name is required')
        .max(200, 'School name must be 200 characters or fewer'),
    location: z
        .string()
        .min(1, 'Location is required')
        .max(200, 'Location must be 200 characters or fewer'),
});
type RegisterFormValues = z.infer<typeof registerSchema>;
export default function RegisterPage() {
    const router = useRouter();
    const setUser = useAuthStore((s) => s.setUser);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { register, handleSubmit, setError, formState: { errors }, } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
    });
    const onSubmit = async (data: RegisterFormValues) => {
        setIsSubmitting(true);
        try {
            const { user, token } = (await api.post('/api/auth/register', data)) as AuthResponse;
            await setFrontendSession(token);
            setUser(user);
            toast.success('Account created successfully!');
            router.push('/assignments');
        }
        catch (err) {
            if (err instanceof ApiError) {
                if (err.errors) {
                    (Object.keys(err.errors) as Array<keyof RegisterFormValues>).forEach((field) => {
                        if (err.errors && err.errors[field]) {
                            setError(field, { type: 'server', message: err.errors[field] });
                        }
                    });
                }
                toast.error(err.message);
            }
            else {
                toast.error('Something went wrong. Please try again.');
            }
        }
        finally {
            setIsSubmitting(false);
        }
    };
    const googleAuthUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`;
    return (<div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-[0.75rem] shadow-md p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="mt-1 text-sm text-gray-500">Join VedaAI and start creating assessments</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Full name
            </label>
            <input id="name" type="text" autoComplete="name" {...register('name')} className={`w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6366f1] transition ${errors.name ? 'border-red-500 focus:ring-red-400' : 'border-gray-300'}`} placeholder="Jane Smith"/>
            {errors.name && (<p className="mt-1 text-xs text-red-600" role="alert">
                {errors.name.message}
              </p>)}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <input id="email" type="email" autoComplete="email" {...register('email')} className={`w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6366f1] transition ${errors.email ? 'border-red-500 focus:ring-red-400' : 'border-gray-300'}`} placeholder="you@example.com"/>
            {errors.email && (<p className="mt-1 text-xs text-red-600" role="alert">
                {errors.email.message}
              </p>)}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input id="password" type="password" autoComplete="new-password" {...register('password')} className={`w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6366f1] transition ${errors.password ? 'border-red-500 focus:ring-red-400' : 'border-gray-300'}`} placeholder="Min. 8 characters"/>
            {errors.password && (<p className="mt-1 text-xs text-red-600" role="alert">
                {errors.password.message}
              </p>)}
          </div>

          <div>
            <label htmlFor="schoolName" className="block text-sm font-medium text-gray-700 mb-1">
              School name
            </label>
            <input id="schoolName" type="text" autoComplete="organization" {...register('schoolName')} className={`w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6366f1] transition ${errors.schoolName ? 'border-red-500 focus:ring-red-400' : 'border-gray-300'}`} placeholder="Springfield Elementary School"/>
            {errors.schoolName && (<p className="mt-1 text-xs text-red-600" role="alert">
                {errors.schoolName.message}
              </p>)}
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input id="location" type="text" autoComplete="address-level2" {...register('location')} className={`w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6366f1] transition ${errors.location ? 'border-red-500 focus:ring-red-400' : 'border-gray-300'}`} placeholder="Mumbai, Maharashtra"/>
            {errors.location && (<p className="mt-1 text-xs text-red-600" role="alert">
                {errors.location.message}
              </p>)}
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full rounded-lg bg-[#6366f1] px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-[#6366f1] focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition">
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="flex-1 border-t border-gray-200"/>
          <span className="text-xs text-gray-400 uppercase tracking-wide">or</span>
          <div className="flex-1 border-t border-gray-200"/>
        </div>

        <a href={googleAuthUrl} className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#6366f1] focus:ring-offset-2 transition">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Sign in with Google
        </a>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <a href="/login" className="font-medium text-[#6366f1] hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>);
}
