import { toast } from "sonner";

export type ToastKind = "error" | "info" | "success" | "warning";
export type ShowToast = (message: string, type?: ToastKind) => void;

export const notify = {
  error(message: string) {
    toast.error(message);
  },
  info(message: string) {
    toast.info(message);
  },
  success(message: string) {
    toast.success(message);
  },
  warning(message: string) {
    toast.warning(message);
  },
};

export const showToast: ShowToast = (message, type = "error") => {
  notify[type](message);
};
