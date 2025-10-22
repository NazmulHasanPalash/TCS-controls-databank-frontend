// src/page/Login/Login.js
// React Router v5 version (uses useHistory)

import React, { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  signInWithPopup,
} from 'firebase/auth';

// Fix this path to your actual init file location if different:
import { auth, googleProvider } from '../../Components/Firebase/firebase.init';

import './Login.css';
import { useHistory, useLocation } from 'react-router-dom';

import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Login = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const location = useLocation();
  const history = useHistory();
  const redirectUri = (location.state && location.state.from) || '/home';

  // ---------- Google Login ----------
  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success('Google Sign-In Successful 🎉');
      history.push(redirectUri);
    } catch (err) {
      const msg = err?.message || 'Google sign-in failed';
      setError(msg);
      toast.error(msg);
    }
  };

  // ---------- Register / Login ----------
  const handleRegistration = async (e) => {
    e.preventDefault();

    if (password.length < 8) {
      const msg = 'Password must be at least 8 characters long.';
      setError(msg);
      toast.error(msg);
      return;
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      const msg = 'Password must contain 1 uppercase letter.';
      setError(msg);
      toast.error(msg);
      return;
    }

    try {
      if (isLogin) {
        await processLogin(email, password);
      } else {
        await registerNewUser(email, password);
      }
    } catch (err) {
      const msg = err?.message || 'Authentication failed';
      setError(msg);
      toast.error(msg);
    }
  };

  const processLogin = async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password);
    setError('');
    toast.success('Login Successful 🎉');
    history.push(redirectUri);
  };

  const registerNewUser = async (email, password) => {
    await createUserWithEmailAndPassword(auth, email, password);
    setError('');
    await setUserName();
    await verifyEmail();
    toast.success('Registration Successful 🎉 Please verify your email.');
    setIsLogin(true);
    history.push('/login'); // go to login after sign-up
  };

  const setUserName = async () => {
    if (auth.currentUser && name.trim()) {
      await updateProfile(auth.currentUser, { displayName: name.trim() });
    }
  };

  const verifyEmail = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  // ---------- Reset Password ----------
  const handleResetPassword = async () => {
    if (!email) {
      toast.info('Please enter your email.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      toast.info('Password reset email sent! Check your inbox.');
    } catch (err) {
      const msg = err?.message || 'Failed to send reset email';
      setError(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="mx-auto w-100">
      <div className="card w-100 mx-auto">
        <div className="row g-0 align-items-center">
          {/* Form Section */}
          <div className="col-md-7">
            <div className="card-body w-100 mx-auto">
              <div className="registration-style mx-auto p-5">
                <form onSubmit={handleRegistration} className="w-100">
                  <h3 className="text-dark text-start">
                    {isLogin ? 'Sign In' : 'Sign Up'}
                  </h3>
                  <h6 className="text-body-secondary my-4 text-start">
                    Simplify your workflow in minutes.
                  </h6>

                  {/* Name Field (Sign Up only) */}
                  {!isLogin && (
                    <div className="mb-3">
                      <label htmlFor="inputName" className="form-label">
                        Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="form-control w-75"
                        id="inputName"
                        placeholder="Your Name"
                        autoComplete="name"
                      />
                    </div>
                  )}

                  {/* Email */}
                  <div className="mb-3">
                    <label htmlFor="inputEmail3" className="form-label">
                      Email
                    </label>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      type="email"
                      className="form-control w-75"
                      id="inputEmail3"
                      required
                      placeholder="name@address.com"
                      autoComplete="email"
                    />
                  </div>

                  {/* Password */}
                  <div className="mb-3">
                    <label htmlFor="inputPassword3" className="form-label">
                      Password
                    </label>
                    <div className="input-group w-75">
                      <span className="input-group-text">
                        <i className="fas fa-lock" />
                      </span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="form-control"
                        id="inputPassword3"
                        required
                        placeholder="Enter your password"
                        autoComplete={
                          isLogin ? 'current-password' : 'new-password'
                        }
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setShowPassword((s) => !s)}
                        aria-label={
                          showPassword ? 'Hide password' : 'Show password'
                        }
                      >
                        <i
                          className={
                            showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'
                          }
                        />
                      </button>
                    </div>
                  </div>

                  {/* Toggle */}
                  <div className="mb-3">
                    {isLogin ? (
                      <p>
                        Don’t have an account yet?{' '}
                        <span
                          className="text-primary"
                          style={{ cursor: 'pointer' }}
                          onClick={() => setIsLogin(false)}
                        >
                          Sign up
                        </span>
                      </p>
                    ) : (
                      <p>
                        Already have an account?{' '}
                        <span
                          className="text-primary"
                          style={{ cursor: 'pointer' }}
                          onClick={() => setIsLogin(true)}
                        >
                          Sign in
                        </span>
                      </p>
                    )}
                  </div>

                  {/* Error */}
                  {error && <div className="mb-3 text-danger">{error}</div>}

                  {/* Buttons */}
                  <button
                    type="submit"
                    className="btn btn-style btn-primary p-2 w-75 my-3"
                  >
                    {isLogin ? 'Sign In' : 'Sign Up'}
                  </button>
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    className="btn btn-danger btn-style p-2 w-75"
                  >
                    Reset Password
                  </button>
                </form>
              </div>

              {/* Google Login */}
              <div className="text-center">
                <h3 className="mt-5 mx-auto">
                  Google Account{' '}
                  <a
                    href="#!"
                    className="text-primary"
                    onClick={(e) => {
                      e.preventDefault();
                      handleGoogleLogin();
                    }}
                  >
                    Sign In
                  </a>
                </h3>
              </div>
            </div>
          </div>

          {/* Image Section */}
          <div className="col-md-5 items-center">
            <img
              src="image/img/covers/cover-21.jpg"
              className="img-fluid rounded-start"
              alt="cover"
            />
          </div>
        </div>
      </div>

      {/* Toast Container */}
      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
};

export default Login;
