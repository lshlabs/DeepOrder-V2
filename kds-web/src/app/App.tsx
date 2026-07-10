import {
  apiCloseSupportConversation,
  apiGetCurrentSupportConversation,
} from "@/lib/api";
import { clearChatbotSession } from "@/features/kds/support/hooks/useChatbotSession";
import { useAuthSession } from "@/features/auth";
import { AuthPage } from "@/pages/auth/AuthPage";
import { KdsPage } from "@/pages/kds/KdsPage";

export default function App() {
  const auth = useAuthSession({
    beforeLogout: closeActiveSupportConversationBestEffort,
    onSessionCleared: clearChatbotSession,
  });

  if (auth.booting) {
    return (
      <AuthPage
        state="booting"
        onLoginSuccess={auth.handleLoginSuccess}
        onRegisterSuccess={auth.handleRegisterSuccess}
        onBackFromPending={auth.handleBackFromPending}
      />
    );
  }

  if (auth.pendingInfo) {
    return (
      <AuthPage
        state="pending"
        pendingInfo={auth.pendingInfo}
        onLoginSuccess={auth.handleLoginSuccess}
        onRegisterSuccess={auth.handleRegisterSuccess}
        onBackFromPending={auth.handleBackFromPending}
      />
    );
  }

  if (!auth.session) {
    return (
      <AuthPage
        state="form"
        bootError={auth.bootError}
        onLoginSuccess={auth.handleLoginSuccess}
        onRegisterSuccess={auth.handleRegisterSuccess}
        onBackFromPending={auth.handleBackFromPending}
      />
    );
  }

  return (
    <KdsPage
      onLogout={auth.logout}
      onUnauthorized={auth.reauthorize}
      session={auth.session}
    />
  );
}

async function closeActiveSupportConversationBestEffort(accessToken: string) {
  try {
    const current = await apiGetCurrentSupportConversation(accessToken);
    if (current) {
      await apiCloseSupportConversation(accessToken, current.id);
    }
  } catch {
    // Support close is best-effort and must not block logout.
  }
}
