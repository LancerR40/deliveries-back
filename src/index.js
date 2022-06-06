import express from "express";
import cors from "cors";
import fileUpload from "express-fileupload";

import config from "./config";
import { authRoutes, adminsRoutes } from "./routes";

const app = express();

/* Middlewares */
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(fileUpload());

/* Routes */
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/admins", adminsRoutes);

app.listen(config.SERVER_PORT, () => console.info("Server on port: " + config.SERVER_PORT));
