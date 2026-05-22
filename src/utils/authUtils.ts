import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// The spec requires salt rounds between 8 and 12
const SALT_ROUNDS = 10;
const JWT_SECRET: string = process.env.JWT_SECRET || "fallback_secret";

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};


export const comparePassword = async (
  password: string,
  hash: string,
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateToken = (payload: {
  id: number;
  name: string;
  role: string;
}): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });
};
