import express from "express";
import { validate, createShipmentValidations } from "./validations"
import { getDrivers, getAssigmentVehicles, getDriverInfoByIdentificationCode, getVehicleIdByLicenseNumber, createShipment, updateDriverStatusById, sendEmail } from "./shipments";
import { successResponse, responseCodes, errorResponse } from "../../responses";

const router = express();

router.post("/", createShipmentValidations(), validate, async (req, res) => {
  const { driverIdentificationCode, vehicleLicenseNumber, products, shipment } = req.body

  const driver = await getDriverInfoByIdentificationCode(driverIdentificationCode)

  if (!driver) {
    return res.status(responseCodes.HTTP_200_OK).json(errorResponse("Ocurrio un error al intentar registrar el envío. Intenta más tarde"))
  }

  const vehicleId = await getVehicleIdByLicenseNumber(vehicleLicenseNumber)

  if (!vehicleId) {
    return res.status(responseCodes.HTTP_200_OK).json(errorResponse("Ocurrio un error al intentar registrar el envío. Intenta más tarde"))
  }

  const shipmentData = {
    products,
    address: shipment.address,
    origin: { ...shipment.origin },
    destination: { ...shipment.destination }
  }

  const data = {
    IDDriver: driver.driverId,
    IDVehicle: vehicleId,
    Description: JSON.stringify(shipmentData),
    IDShipmentStatus: 2
  }

  const insertShipment = await createShipment(data)

  if (!insertShipment) {
    return res.status(responseCodes.HTTP_200_OK).json(errorResponse("Ocurrio un error al intentar registrar el envío. Intenta más tarde"))
  }

  const updateDriverStatus = await updateDriverStatusById(2, driver.driverId)

  if (!updateDriverStatus) {
    return res.status(responseCodes.HTTP_200_OK).json(errorResponse("Ocurrio un error al intentar registrar el envío. Intenta más tarde"))
  }

  const { driverName, driverLastname, driverEmail } = driver
  const fullname = `${driverName} ${driverLastname}`

  await sendEmail(driverEmail, fullname)

  res.status(responseCodes.HTTP_200_OK).json(successResponse({ message: "Envío registrado y activado con éxito" }))
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
