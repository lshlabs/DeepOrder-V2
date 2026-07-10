import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { Button, Input } from "@/components/ui";
import { cn } from "@/lib/utils";

type PasswordFieldProps = Omit<React.ComponentProps<typeof Input>, "type">;

export function PasswordField({ className, ...props }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const label = visible ? "비밀번호 숨기기" : "비밀번호 보기";

  return (
    <div className="relative">
      <Input
        {...props}
        className={cn("pr-11", className)}
        type={visible ? "text" : "password"}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-1 top-1/2 size-8 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        aria-label={label}
        title={label}
        onClick={() => setVisible((current) => !current)}
      >
        {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
      </Button>
    </div>
  );
}
