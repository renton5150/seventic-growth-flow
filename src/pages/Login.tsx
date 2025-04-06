
import { LoginForm } from "@/components/auth/login/LoginForm";
import AuthLayout from "@/components/auth/AuthLayout";

// Set this to false to disable demo mode
const SHOW_DEMO_MODE = false;

const Login = () => {
  return (
    <AuthLayout>
      <LoginForm showDemoMode={SHOW_DEMO_MODE} />
    </AuthLayout>
  );
};

export default Login;
