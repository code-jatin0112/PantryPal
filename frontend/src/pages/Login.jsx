import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Utensils } from 'lucide-react';

const Login = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { login } = useAuth();
  const [errorMsg, setErrorMsg] = useState('');

  const onSubmit = async (data) => {
    try {
      setErrorMsg('');
      await login(data.email, data.password);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-parchment p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden p-8 border border-sage/20">
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="bg-olive/30 p-3 rounded-full mb-3">
            <Utensils className="text-bark" size={32} />
          </div>
          <h2 className="text-3xl font-bold text-bark">Welcome Back</h2>
          <p className="text-sage text-sm mt-1">Sign in to manage your kitchen</p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-100">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-bark mb-1">Email</label>
            <input 
              type="email" 
              {...register('email', { required: 'Email is required' })}
              className="w-full px-4 py-3 rounded-xl border border-sage/30 focus:border-olive focus:ring-2 focus:ring-olive/50 outline-none transition-all"
              placeholder="chef@example.com"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-bark mb-1">Password</label>
            <input 
              type="password" 
              {...register('password', { required: 'Password is required' })}
              className="w-full px-4 py-3 rounded-xl border border-sage/30 focus:border-olive focus:ring-2 focus:ring-olive/50 outline-none transition-all"
              placeholder="••••••••"
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <button 
            type="submit" 
            className="w-full bg-sage hover:bg-bark text-white font-semibold py-3 rounded-xl transition-colors shadow-md hover:shadow-lg"
          >
            Sign In
          </button>
        </form>

        <p className="text-center text-sm text-sage mt-6">
          Don't have an account? <Link to="/register" className="text-bark font-semibold hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
