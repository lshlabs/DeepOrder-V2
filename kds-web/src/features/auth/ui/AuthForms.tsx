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
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">DeepOrder KDS 시작하기</h2>
        <p className="text-sm text-muted-foreground">매장 계정으로 로그인하거나 새로운 매장 가입을 신청하세요.</p>
      </div>

      {initialError ? (
        <Alert variant="destructive">
          <AlertDescription>{initialError}</AlertDescription>
        </Alert>
      ) : null}

      <Tabs defaultValue="login" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">로그인</TabsTrigger>
          <TabsTrigger value="register">매장 가입</TabsTrigger>
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
