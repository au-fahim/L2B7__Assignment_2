import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./config/db";
import authRoutes from "./modules/auth/auth.routes";

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

// Health check endpoint
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({ message: "DevPulse is running!" });
});

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  try {
    const res = await pool.query("SELECT NOW()");
    console.log("Database connection verified at:", res.rows[0].now);
  } catch (error) {
    console.error("Database connection failed:", error);
  }
});
