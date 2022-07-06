import express from "express";
import jsonwebtoken from "jsonwebtoken";
import config from "../../config";
import query from "../../database";
import { validate, adminLoginValidations, driverLoginValidations } from "./validations";

import { getDriverIdByEmail, getStatusIdByEmail, updateDriverStatus } from "./auth";
import { successResponse, responseCodes, errorResponse } from "../../responses";

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

router.get("/drivers/session", (req, res) => {
  const token = req.headers["x-authorization-token"];

  if (!token) {
    return res.status(responseCodes.HTTP_200_OK).json(successResponse({ auth: false }));
  }

  try {
    jsonwebtoken.verify(token, config.TOKEN_KEY);

    res.status(responseCodes.HTTP_200_OK).json(successResponse({ auth: true }));
  } catch (error) {
    return res.status(responseCodes.HTTP_401_UNAUTHORIZED).json(errorResponse("No estas autorizado."));
  }
});

router.post("/drivers/login", driverLoginValidations(), validate, async (req, res) => {
  const { email } = req.body;

  const driverId = await getDriverIdByEmail(email);
  const driverStatusId = await getStatusIdByEmail(email);

  if (driverStatusId === 4) {
    await updateDriverStatus(1, driverId);
  }

  const token = jsonwebtoken.sign({ id: driverId }, config.TOKEN_KEY, {
    expiresIn: "1d",
  });

  res.status(responseCodes.HTTP_200_OK).json(successResponse({ auth: true, token }));
});

export default router;
