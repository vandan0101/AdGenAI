import { createRoot } from 'react-dom/client'
import './global.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { ClerkProvider } from '@clerk/react'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
  <ClerkProvider
    publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
    appearance={{
      baseTheme: undefined,
      variables: {
        colorPrimary: '#6366f1',
        colorBackground: '#ffffff',
        colorInputBackground: '#f8fafc',
        colorInputText: '#0f172a',
        colorText: '#0f172a',
        colorTextSecondary: '#64748b',
        colorDanger: '#ef4444',
        colorSuccess: '#10b981',
        colorWarning: '#f59e0b',
        fontFamily: 'Poppins, sans-serif',
        fontSize: '14px',
        borderRadius: '0.75rem',
      },
      elements: {
        card: 'bg-white backdrop-blur-xl border border-slate-200 shadow-2xl',
        headerTitle: 'text-slate-900 font-semibold text-2xl',
        headerSubtitle: 'text-slate-600',
        formButtonPrimary: 
          'bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white font-medium rounded-full transition-all duration-200 shadow-lg',
        formFieldInput: 
          'bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400',
        formFieldLabel: 'text-slate-700 font-medium',
        footerActionLink: 'text-indigo-600 hover:text-indigo-700 font-medium',
        dividerLine: 'bg-slate-300',
        dividerText: 'text-slate-500',
        socialButtonsBlockButton: 
          'bg-white hover:bg-slate-50 border border-slate-300 text-slate-900 hover:shadow-lg transition-all rounded-xl font-medium',
        socialButtonsBlockButtonText: 'text-slate-900 font-semibold',
        socialButtonsIconButton: 'bg-white border border-slate-300 hover:bg-slate-50',
        identityPreviewText: 'text-slate-700',
        identityPreviewEditButton: 'text-indigo-600 hover:text-indigo-700',
        formResendCodeLink: 'text-indigo-600 hover:text-indigo-700',
        otpCodeFieldInput: 'bg-slate-50 border border-slate-300 text-slate-900 rounded-lg',
        alertText: 'text-slate-700',
        formFieldErrorText: 'text-red-600',
        formFieldSuccessText: 'text-green-600',
        modalBackdrop: 'bg-black/60 backdrop-blur-sm',
        modalContent: 'bg-white border border-slate-200',
      },
      layout: {
        socialButtonsPlacement: 'bottom',
        socialButtonsVariant: 'blockButton',
        termsPageUrl: '/terms',
        privacyPageUrl: '/privacy',
      },
    }}
  >
    <App />
    </ClerkProvider>
  </BrowserRouter>,
)
