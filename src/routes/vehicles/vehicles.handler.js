import express from "express";

import { createVehicle, createVehicleDocument } from "./vehicles";
import { validate, createVehicleValidations, vehicleDocumentValidations } from "./validations";

import { successResponse, responseCodes, errorResponse } from "../../responses";
import { VEHICLE_BRANDS } from "../../constants";

const router = express.Router();

router.post("/create", createVehicleValidations(), validate, async (req, res) => {
  const vehicle = { ...req.body, color: JSON.stringify(req.body.colors) };
  delete vehicle.colors;
  vehicle.IDVehicleStatus = 2;

  const result = await createVehicle(vehicle);

  if (!result) {
    return res.status(responseCodes.HTTP_200_OK).json(errorResponse("Ocurrio un error, vuelve a intentar."));
  }

  res.status(responseCodes.HTTP_200_OK).json(successResponse({ message: "Registro éxitoso." }));
});

router.post("/document", vehicleDocumentValidations(), validate, async (req, res) => {
  const { document } = req.body;
  const { name } = document;

  const vehicleDocument = { ...document, name: !name ? "Compañia" : name };

  const result = await createVehicleDocument(vehicleDocument);

  if (!result) {
    return res.status(responseCodes.HTTP_200_OK).json(errorResponse("Error al registrar documento, intenta de nuevo"));
  }

  return res.status(responseCodes.HTTP_200_OK).json(successResponse({ message: "Registro éxitoso." }));
});

router.get("/brands", (req, res) => {
  res.status(responseCodes.HTTP_200_OK).json(successResponse(VEHICLE_BRANDS));
});

export default router;
