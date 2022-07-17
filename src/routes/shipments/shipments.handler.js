import express from "express";
import { validate, createShipmentValidations } from "./validations"
import { getDrivers, getAssigmentVehicles } from "./shipments";
import { successResponse, errorResponse, responseCodes } from "../../responses";

const router = express();

router.post("/", createShipmentValidations(), validate, (req, res) => {
  res.json(req.body)
})

router.post("/drivers", async (req, res) => {
  const result = await getDrivers(req.body?.field);

  if (!result) {
    return res.status(responseCodes.HTTP_200_OK).json(successResponse([]));
  }

  return res.status(responseCodes.HTTP_200_OK).json(successResponse(result));
});

router.post("/vehicles", async (req, res) => {
  const result = await getAssigmentVehicles(req.body?.field);

  if (!result) {
    return res.status(responseCodes.HTTP_200_OK).json(successResponse([]));
  }

  return res.status(responseCodes.HTTP_200_OK).json(successResponse(result));
});

export default router;
