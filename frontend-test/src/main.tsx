import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'
import { setupMockApiInterceptor } from './mock/mockApiInterceptor'

// Activate client-side mock backend interceptor
setupMockApiInterceptor();

// Seed initial session if not present so user can explore dashboard immediately
if (!localStorage.getItem("auth_token")) {
  localStorage.setItem(
    "auth_token",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsIm5hbWUiOiJCYWxhY2hhbmRlciIsInJvbGUiOiJhZG1pbiJ9.mock_signature_part"
  );
  localStorage.setItem(
    "auth_user",
    JSON.stringify({
      id: 1,
      name: "Balachander",
      userid: "admin",
      email: "admin@navneet.com",
      role: "admin",
      sub_role: "Global Admin",
      is_active: true,
    })
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
