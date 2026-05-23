export interface SignupBody {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
}

export interface LoginBody {
  email?: string;
  password?: string;
}

export interface TokenPayload {
  id: number;
  name: string;
  role: "contributor" | "maintainer";
}
