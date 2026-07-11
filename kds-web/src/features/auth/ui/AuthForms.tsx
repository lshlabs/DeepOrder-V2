import {
  Alert,
  AlertDescription,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui";

import type { AuthResponse, RegisterResponse } from "../model/types";
import { LoginForm } from "./LoginForm";
import { SignupForm } from "./SignupForm";

type AuthFormsProps = {
  initialError?: string | null;
  onLoginSuccess: (response: AuthResponse) => void;
  onRegisterSuccess: (response: RegisterResponse) => void;
};

export function AuthForms({ initialError, onLoginSuccess, onRegisterSuccess }: AuthFormsProps) {
  return (
    <div className="flex flex-col gap-6" role="region" aria-label="인증 화면">
      {initialError ? (
        <Alert className="rounded-panel" variant="destructive">
          <AlertDescription>{initialError}</AlertDescription>
        </Alert>
      ) : null}

      <Tabs defaultValue="login" className="w-full">
        <TabsList
          className="grid w-full grid-cols-2 border border-border bg-surface-2"
          density="compact"
        >
          <TabsTrigger
            density="compact"
            value="login"
            className="data-[state=active]:border data-[state=active]:border-border data-[state=active]:bg-surface-3 data-[state=active]:shadow-none"
          >
            로그인
          </TabsTrigger>
          <TabsTrigger
            density="compact"
            value="register"
            className="data-[state=active]:border data-[state=active]:border-border data-[state=active]:bg-surface-3 data-[state=active]:shadow-none"
          >
            매장 가입
          </TabsTrigger>
        </TabsList>
        <TabsContent value="login" className="mt-6">
          <LoginForm onSuccess={onLoginSuccess} />
        </TabsContent>
        <TabsContent value="register" className="mt-6">
          <SignupForm onSuccess={onRegisterSuccess} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
