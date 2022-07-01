import express from "express";
import moment from "moment";

import { createVehicle, createVehicleDocument, vehiclesByQueries, getSuperAdmin } from "./vehicles";
import { validate, createVehicleValidations, vehicleDocumentValidations, vehiclesByQueriesValidations } from "./validations"; /* prettier-ignore */

import { successResponse, responseCodes, errorResponse } from "../../responses";
import { VEHICLE_BRANDS, VEHICLE_DOCUMENTS } from "../../constants";

const router = express.Router();

router.post("/", vehiclesByQueriesValidations(), validate, async (req, res) => {
  const result = await vehiclesByQueries(req.body);

  if (!result) {
    return res.status(responseCodes.HTTP_200_OK).json(errorResponse("Hubo un problema al realizar la búsqueda."));
  }

  result.vehicles = result.vehicles.map((vehicle) => {
    const { ownerName, ownerLastname, color, createdAt } = vehicle;

    return {
      ...vehicle,
      ownerName: JSON.parse(ownerName),
      ownerLastname: JSON.parse(ownerLastname),
      color: JSON.parse(color),
      createdAt: moment(createdAt).local().format("lll"),
    };
  });

  res.status(responseCodes.HTTP_200_OK).json(successResponse(result));
});

router.post("/create", createVehicleValidations(), validate, async (req, res) => {
  const vehicle = { ...req.body, color: JSON.stringify(req.body.colors), IDVehicleStatus: 2 };
  delete vehicle.colors;

  const result = await createVehicle(vehicle);

  if (!result) {
    return res.status(responseCodes.HTTP_200_OK).json(errorResponse("Ocurrio un error, vuelve a intentar."));
  }

  res.status(responseCodes.HTTP_200_OK).json(successResponse({ message: "Registro éxitoso." }));
});

router.post("/documents", vehicleDocumentValidations(), validate, async (req, res) => {
  let { document } = req.body;

  if (!document.name && !document.lastname && !document.identificationCode) {
    const superAdmin = await getSuperAdmin();
    const { name, lastname, identificationCode } = superAdmin;

    document = { ...document, name, lastname, identificationCode };
  }

  const result = await createVehicleDocument(document);

  if (!result) {
    return res.status(responseCodes.HTTP_200_OK).json(errorResponse("Error al registrar documento, intenta de nuevo"));
  }

  return res.status(responseCodes.HTTP_200_OK).json(successResponse({ message: "Registro éxitoso." }));
});

router.get("/brands", (req, res) => {
  res.status(responseCodes.HTTP_200_OK).json(successResponse(VEHICLE_BRANDS));
});

router.get("/documents", (req, res) => {
  res.status(responseCodes.HTTP_200_OK).json(successResponse(VEHICLE_DOCUMENTS));
});

export default router;
