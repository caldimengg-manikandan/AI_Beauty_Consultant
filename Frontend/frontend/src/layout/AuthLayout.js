// import "./auth.css";

// export default function AuthLayout({ title, children }) {
//   return (
//     <div className="auth-container">
//       <div className="auth-card">
//         <h2>{title}</h2>
//         {children}
//       </div>
//     </div>
//   );
// }


const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
