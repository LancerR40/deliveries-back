import express from "express";
import moment from "moment";

import { createVehicle, createVehicleDocument, vehiclesByQueries, getSuperAdmin } from "./vehicles";
import { validate, createVehicleValidations, vehiclesByQueriesValidations } from "./validations";

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
  const { model, brand, colors, type, licenseNumber, tiresNumber, document } = req.body;
  const { title, name, lastname, identificationCode, maximumLoadMass, expedition } = document;
  const color = JSON.stringify(colors);

  const vehicle = { model, brand, color, type, licenseNumber, tiresNumber, IDVehicleStatus: 2 };
  let reorganizedDocument = {
    title,
    name,
    lastname,
    identificationCode,
    licenseNumber,
    brand,
    type,
    color,
    maximumLoadMass,
    expedition,
  };

  let result = await createVehicle(vehicle);

  if (!result) {
    return res.status(responseCodes.HTTP_200_OK).json(errorResponse("Ocurrio un error. Por favor, intenta más tarde."));
  }

  if (!name && !lastname && !identificationCode) {
    const superAdmin = await getSuperAdmin();
    const { name, lastname, identificationCode } = superAdmin;

    reorganizedDocument = { ...reorganizedDocument, name, lastname, identificationCode };
  }

  result = await createVehicleDocument(reorganizedDocument, result.insertId);

  res.status(responseCodes.HTTP_200_OK).json(successResponse({ message: "Registro éxitoso." }));
});

router.get("/brands", (req, res) => {
  res.status(responseCodes.HTTP_200_OK).json(successResponse(VEHICLE_BRANDS));
});

router.get("/documents", (req, res) => {
  res.status(responseCodes.HTTP_200_OK).json(successResponse(VEHICLE_DOCUMENTS));
});

export default router;
