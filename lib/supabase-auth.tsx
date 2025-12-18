"use client"

// lib/supabase-auth.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = "https://your-supabase-url.supabase.co"
const supabaseKey = "your-supabase-key"
const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey)

// Function to handle authentication state changes
function onAuthStateChange(callback: (event: string, session: any) => void) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session)
  })
}

// Function to log out the user
function logout() {
  return supabase.auth.signOut()
}

// Export the functions for use in other modules
export { onAuthStateChange, logout }

// Example usage within a React component
// const AuthComponent = () => {
//   const [session, setSession] = useState(null);

//   useEffect(() => {
//     const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
//       setSession(session);
//     });

//     return () => {
//       authListener?.unsubscribe();
//     };
//   }, []);

//   const handleLogout = () => {
//     logout().then(() => {
//       console.log('User logged out');
//     });
//   };

//   return (
//     <div>
//       {session ? (
//         <button onClick={handleLogout}>Logout</button>
//       ) : (
//         <p>No user session found</p>
//       )}
//     </div>
//   );
// };

// export default AuthComponent;
