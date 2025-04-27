
import { useState } from "react";
import { FormToggle } from "./FormToggle";
import { LoginFormContent } from "./LoginFormContent";
import { SignupFormContent } from "./SignupFormContent";
import { DemoAlert } from "./DemoAlert";
import { NetworkStatus } from "./NetworkStatus";
import { ErrorDisplay } from "./ErrorDisplay";
import { useConnectionCheck } from "./useConnectionCheck";
import { useAuthSubmit } from "./useAuthSubmit";

interface LoginFormProps {
  showDemoMode?: boolean;
}

export const LoginForm = ({ showDemoMode = true }: LoginFormProps) => {
  const [formMode, setFormMode] = useState<"login" | "signup">("login");
  const { networkStatus, error, setError, checkServerConnection, retryCount } = useConnectionCheck();
  const { isSigningUp, handleLogin, handleSignup } = useAuthSubmit(checkServerConnection, setError);

  const handleRetry = async () => {
    setError(null);
    await checkServerConnection();
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <ErrorDisplay error={error} />
      
      <div className="rounded-lg border bg-card p-8 shadow-sm">
        <div className="space-y-6">
          <FormToggle 
            formMode={formMode} 
            onToggle={() => {
              setFormMode(formMode === "login" ? "signup" : "login");
              setError(null);
            }} 
          />
          
          {formMode === "login" ? (
            <LoginFormContent 
              isOffline={networkStatus === "offline"}
              onSubmit={handleLogin}
            />
          ) : (
            <SignupFormContent 
              isOffline={networkStatus === "offline"}
              onSubmit={handleSignup}
              isSubmitting={isSigningUp}
            />
          )}
        </div>
      </div>
      
      {showDemoMode && <DemoAlert showDemoMode={showDemoMode} />}
      
      <NetworkStatus 
        status={networkStatus}
        error={error}
        onRetry={handleRetry}
        retryCount={retryCount}
      />
    </div>
  );
};
