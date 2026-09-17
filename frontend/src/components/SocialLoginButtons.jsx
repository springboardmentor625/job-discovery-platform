import { BACKEND_ROOT_URL } from "../services/api";

export default function SocialLoginButtons() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-line" />
        <span className="text-xs text-muted">or continue with</span>
        <div className="flex-1 h-px bg-line" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        
        <a
          href={`${BACKEND_ROOT_URL}/accounts/google/login/`}
          className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-line text-sm font-medium text-ink hover:border-violet-400 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.5 12.3c0-.85-.08-1.66-.22-2.44H12v4.62h6.44c-.28 1.5-1.13 2.77-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.8z" />
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.93-2.9l-3.88-3c-1.07.72-2.45 1.15-4.05 1.15-3.11 0-5.75-2.1-6.69-4.93H1.3v3.1C3.26 21.3 7.3 24 12 24z" />
            <path fill="#FBBC05" d="M5.31 14.32c-.24-.72-.38-1.49-.38-2.28s.14-1.56.38-2.28v-3.1H1.3A11.96 11.96 0 000 12.04c0 1.93.46 3.76 1.3 5.38l4.01-3.1z" />
            <path fill="#EA4335" d="M12 4.77c1.76 0 3.35.61 4.6 1.8l3.44-3.44C17.94 1.19 15.24 0 12 0 7.3 0 3.26 2.7 1.3 6.66l4.01 3.1c.94-2.83 3.58-4.99 6.69-4.99z" />
          </svg>
          Google
        </a>
        <a
          href={`${BACKEND_ROOT_URL}/accounts/github/login/`}
          className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-line text-sm font-medium text-ink hover:border-violet-400 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.04-.02-2.04-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.21.08 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.66-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 013 -.4c1.02 0 2.04.14 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22 0 1.6-.01 2.89-.01 3.29 0 .32.22.7.83.58C20.56 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z" />
          </svg>
          GitHub
        </a>
      </div>
    </div>
  );
}