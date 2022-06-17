import express from "express";
import { validate, createVehicleValidations, vehicleDocumentValidations } from "./validations";
import { successResponse, responseCodes } from "../../responses";

const router = express.Router();

router.post("/create", createVehicleValidations(), validate, (req, res) => {
  res.json(req.body);
});

router.post("/document", vehicleDocumentValidations(), validate, (req, res) => {
  res.json(req.body);
});

router.get("/brands", (req, res) => {
  const brands = ["Tesla", "Chevrolet", "Nissan"];

  res.status(responseCodes.HTTP_200_OK).json(successResponse(brands));
});

export default router;
