import express from "express";
import jsonwebtoken from "jsonwebtoken";
import config from "../../config";
import query from "../../database";
import { successResponse, responseCodes, errorResponse } from "../../responses";
import { validate, adminLoginValidations } from "./validations";

const router = express.Router();

router.get("/admins/session", (req, res) => {
  const token = req.headers["x-authorization-token"];

  if (!token) {
    return res.status(responseCodes.HTTP_200_OK).json(successResponse({ auth: false, role: null }));
  }

  try {
    const { role } = jsonwebtoken.verify(token, config.TOKEN_KEY);

    res.status(responseCodes.HTTP_200_OK).json(successResponse({ auth: true, role }));
  } catch (error) {
    return res.status(responseCodes.HTTP_401_UNAUTHORIZED).json(errorResponse("No estas autorizado."));
  }
});

router.post("/admins/login", adminLoginValidations(), validate, async (req, res) => {
  const result = await query("SELECT IDAdmin, Role FROM admin WHERE Email = ?", req.body.email);
  const { IDAdmin: id, Role: role } = result[0];

  const token = jsonwebtoken.sign({ id, role }, config.TOKEN_KEY, {
    expiresIn: "1d",
  });

  res.status(responseCodes.HTTP_200_OK).json(successResponse({ auth: true, role, token }));
});

export default router;
