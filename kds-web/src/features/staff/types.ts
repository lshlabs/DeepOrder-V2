export type Staff = {
  id: number;
  loginId: string;
  name: string;
  accountType: "OWNER" | "EMPLOYEE";
  positionLabel: string | null;
  active: boolean;
};
