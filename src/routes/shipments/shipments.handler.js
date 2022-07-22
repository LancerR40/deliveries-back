import express from "express";
import moment from "moment";

import { validate, createShipmentValidations } from "./validations"
import { isAuth, getTrackingCoordinatesByShipmentId, getActiveShipments, insertDriverPosition, updateShipmentStatus, getShipmentsByDriver, getDrivers, getAssigmentVehicles, getDriverInfoByIdentificationCode, getVehicleIdByLicenseNumber, createShipment, updateDriverStatusById, sendEmail } from "./shipments";
import { successResponse, responseCodes, errorResponse } from "../../responses";

const router = express();

router.post("/create", isAuth, createShipmentValidations(), validate, async (req, res) => {
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

router.get("/assigned", isAuth, async (req, res) => {
  const { id } = req.user
  const shipments = await getShipmentsByDriver(id)

  if (!shipments) {
    return res.status(responseCodes.HTTP_200_OK).json(errorResponse("Ocurrio un error al intentar obtener  el envío. Intenta más tarde"))
  }

  if (!shipments.length) {
    return res.status(responseCodes.HTTP_200_OK).json(successResponse({ all: [], active: null }))
  }

  const data = { all: [], active: null }

  data.all = shipments.map((shipment) => {
    shipment.shipmentCreatedAt = moment(shipment.shipmentCreatedAt).local().format("lll")
    shipment.shipmentDescription = JSON.parse(shipment.shipmentDescription)

    
    if (!data.active && shipment.idShipmentStatus == 2) {
      data.active = shipment
    }

    return shipment
  })

  res.status(responseCodes.HTTP_200_OK).json(successResponse(data))
})

router.post("/drivers", isAuth, async (req, res) => {
  const result = await getDrivers(req.body?.field);

  if (!result) {
    return res.status(responseCodes.HTTP_200_OK).json(successResponse([]));
  }

  return res.status(responseCodes.HTTP_200_OK).json(successResponse(result));
});

router.post("/vehicles", isAuth, async (req, res) => {
  const result = await getAssigmentVehicles(req.body?.field);

  if (!result) {
    return res.status(responseCodes.HTTP_200_OK).json(successResponse([]));
  }

  return res.status(responseCodes.HTTP_200_OK).json(successResponse(result));
});

router.patch("/completed", isAuth, async (req, res) => {
  const { id } = req.user;
  let result = await updateShipmentStatus(1, req.body.shipmentId)

  if (!result) {
    return res.status(responseCodes.HTTP_200_OK).json(errorResponse("Ocurrio un error al intentar actualizar el envío a completado. Intenta más tarde"))
  }

  result = await updateDriverStatusById(1, id)

  if (!result) {
    return res.status(responseCodes.HTTP_200_OK).json(errorResponse("Ocurrio un error al intentar actualizar el envío a completado. Intenta más tarde"))
  }

  res.status(responseCodes.HTTP_200_OK).json(successResponse({ message: "Envío completado y registrado con éxito." }))
})

router.patch("/canceled", isAuth, async (req, res) => {
  const { id } = req.user;
  let result = await updateShipmentStatus(3, req.body.shipmentId)

  if (!result) {
    return res.status(responseCodes.HTTP_200_OK).json(errorResponse("Ocurrio un error al intentar actualizar el envío a cancelado. Intenta más tarde."))
  }

  result = await updateDriverStatusById(1, id)

  if (!result) {
    return res.status(responseCodes.HTTP_200_OK).json(errorResponse("Ocurrio un error al intentar actualizar el envío a cancelado. Intenta más tarde."))
  }

  res.status(responseCodes.HTTP_200_OK).json(successResponse({ message: "El envío ha sido cancelado con éxito." }))
})

/* TRACKER ENDPOINTS */
router.post("/tracking", async (req, res) => {
  const { shipmentId, driverPosition: { latitude, longitude } } = req.body

  await insertDriverPosition(shipmentId, latitude, longitude)
  res.end()
});

router.post("/tracking/coordinates", isAuth, async (req, res) => {
  const { shipmentId } = req.body

  if (!shipmentId) {
    return res.end()
  }
  
  const result = await getTrackingCoordinatesByShipmentId(shipmentId)

  if (!result) {
    return res.status(responseCodes.HTTP_200_OK).json(errorResponse("Ocurrió un error al obtener la última ubicación del conductor. Por favor, intenta más tarde."))
  }

  res.status(responseCodes.HTTP_200_OK).json(successResponse(result))
})

router.get("/active", isAuth, async (req, res) => {
  let result = await getActiveShipments()

  if (!result) {
    return res.status(responseCodes.HTTP_200_OK).json(errorResponse("Ocurrio un error al intentar obtener los envíos activos. Por favor, intenta más tarde."))
  }

  result = result.map(shipment => ({ ...shipment, shipmentDescription: JSON.parse(shipment.shipmentDescription) }))

  res.status(responseCodes.HTTP_200_OK).json(successResponse(result))
})

export default router;
