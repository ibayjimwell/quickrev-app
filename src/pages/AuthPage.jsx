import React from 'react'
import LoginForm from '../components/LoginForm'
import SignupForm from '../components/SignupForm'

function AuthPage() {

  // Choicer state
 const [isSignup, setIsSignup] = React.useState(false);

  return (
    <>
      <section className='min-h-screen flex flex-col justify-center items-center p-4 sm:p-6'>

          {/* Logo */}
          <div className="mb-10 flex items-center justify-center">
            <img className='w-10 h-10' src="/icon.png" alt="QuickRev Icon" />
            <span className="ml-2 text-xl font-bold tracking-tight text-gray-900">QuickRev</span>
          </div>

            {/* Card Container */}
            <div className="w-full max-w-md bg-white rounded-xl">
              <div className="p-8 sm:p-10">
                <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
                  Welcome to QuickRev
                </h1>

                {/* Login/Sign Up Switch */}
                <div className="flex w-full p-1 bg-gray-100 rounded-lg mb-6">
                  <button
                    onClick={() => setIsSignup(false)}
                    className={`flex-1 text-center py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      !isSignup
                        ? 'bg-white shadow text-gray-900'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => setIsSignup(true)}
                    className={`flex-1 text-center py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isSignup
                        ? 'bg-white shadow text-gray-900'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Sign Up
                  </button>
                </div>

                {/* Form Content */}
                {isSignup ? <SignupForm setIsSignup={setIsSignup} /> : <LoginForm setIsSignup={setIsSignup} />}
              </div>
            </div>
            
            {/* Footer Legal Text */}
            <p className="text-center text-xs text-gray-500 mt-8 max-w-sm">
              By continuing, you agree to QuickRev's 
              <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500"> Terms of Service </a> 
              and 
              <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500"> Privacy Policy</a>.
            </p>

      </section>
    </>
  )
}

export default AuthPage