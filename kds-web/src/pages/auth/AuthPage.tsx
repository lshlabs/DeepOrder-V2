import {
  AuthExperience,
  type AuthPendingInfo,
  type AuthResponse,
  type RegisterResponse,
} from "@/features/auth";

type AuthPageProps = {
  state: "booting" | "form" | "pending";
  bootError?: string | null;
  pendingInfo?: AuthPendingInfo | null;
  onLoginSuccess: (response: AuthResponse) => void;
  onRegisterSuccess: (response: RegisterResponse) => void;
  onBackFromPending: () => void;
};

export function AuthPage(props: AuthPageProps) {
  return <AuthExperience {...props} />;
}
