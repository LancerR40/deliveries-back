import query from "../../database";
import nodemailer from "nodemailer"
import config from "../../config";
import jsonwebtoken from "jsonwebtoken"
import { responseCodes, errorResponse } from "../../responses"

export const isAuth = (req, res, next) => {
  const token = req.headers["x-authorization-token"]

  try {
    const payload = jsonwebtoken.verify(token, config.TOKEN_KEY);
    req.user = payload;

    next()
  } catch (error) {
    res.status(responseCodes.HTTP_401_UNAUTHORIZED).json(errorResponse("No estas autorizado."));
  }
}

export const createShipment = async (data) => {
  try {
    await query("INSERT INTO shipment SET ?", data)

    return true
  } catch (error) {
    return false
  }
}

export const insertDriverPosition = async (shipmentId, latitude, longitude) => {
  const data = { IDShipment: shipmentId, Latitude: latitude, Longitude: longitude }

  try {
    await query("INSERT INTO shipment_coordinates SET ?", data)
    return true
  } catch (error) {
    return false
  }
}

export const updateDriverStatusById = async (status, driverId) => {
  try {
    await query("UPDATE driver SET IDDriverStatus = ? WHERE IDDriver = ?", [status, driverId])
    
    return true
  } catch (error) {
    return false
  }
}

export const updateShipmentStatus = async (status, shipmentId) => {
  try {
    await query("UPDATE shipment SET IDShipmentStatus = ? WHERE IDShipment = ?", [status, shipmentId])
    return true
  } catch (error) {
    return false
  }
}

export const getTrackingCoordinatesByShipmentId = async (shipmentId) => {
  try {
    return await query("SELECT Latitude as driverLatitude, Longitude as driverLongitude FROM shipment_coordinates WHERE IDShipment = ? ORDER BY IDShipmentCoordinates DESC LIMIT 1", shipmentId)
  } catch (error) {
    return false
  }
}

export const getShipmentsByDriver = async (driverId) => {
  try {
    return await query("SELECT s.IDShipment AS idShipment, s.Description AS shipmentDescription, ss.IDShipmentStatus AS idShipmentStatus, ss.StatusName as shipmentStatusName, s.CreatedAt AS shipmentCreatedAt FROM shipment AS s INNER JOIN shipment_status ss ON s.IDShipmentStatus = ss.IDShipmentStatus WHERE IDDriver = ?", driverId)
  } catch (error) {
    return false
  }
}

export const getDriverInfoByIdentificationCode = async (identificationCode) => {
  try {
    const result = await query("SELECT IDDriver as driverId, Name as driverName, Lastname as driverLastname, Email as driverEmail FROM driver WHERE IdentificationCode = ?", identificationCode)
    return result[0]
  } catch (error) {
    return false
  }
}

export const getVehicleIdByLicenseNumber = async (licenseNumber) => {
  try {
    const result = await query("SELECT IDVehicle FROM vehicle WHERE LicenseNumber = ?", licenseNumber)
    return result[0].IDVehicle
  } catch (error) {
    return false
  }
}

export const getDrivers = async (field = "") => {
  try {
    let sql = "SELECT Name as driverName, Lastname as driverLastname, IdentificationCode as driverIdentificationCode, Photo as driverPhoto FROM driver WHERE Name LIKE ? OR Lastname LIKE ? OR IdentificationCode LIKE ?";
    const params = [field + "%", field + "%", field + "%"]
    const result = await query(sql, params)

    return result
} catch (error) {
    return false;
  }
};

export const getAssigmentVehicles = async (field = "") => {
  try {
    const result = await query("SELECT v.Model as vehicleModel, v.LicenseNumber as vehicleLicenseNumber FROM driver as d LEFT JOIN assigned_vehicle as av ON av.IDDriver = d.IDDriver LEFT JOIN vehicle as v ON av.IDVehicle = v.IDVehicle WHERE d.IdentificationCode = ?", field)
    return result
  } catch (error) {
    return false
  }
}

export const getActiveShipments = async () => {
  try {
    const shipmentsInProgressId = 2
    
    return await query("SELECT s.IDShipment as shipmentId, s.Description as shipmentDescription, d.IDDriver as driverId, d.Name as driverName, d.Lastname as driverLastname, d.IdentificationCode as driverIdentificationCode, d.Photo as driverPhoto, v.Model as vehicleModel, v.Brand as vehicleBrand, v.LicenseNumber as vehicleLicenseNumber FROM shipment as s INNER JOIN driver as d ON s.IDDriver = d.IDDriver INNER JOIN vehicle as v  ON s.IDVehicle = v.IDVehicle WHERE s.IDShipmentStatus = ?", shipmentsInProgressId)
  } catch (error) {
    return false
  }
}

export const sendEmail = async (to, fullname) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp-mail.outlook.com",
      port: 587,
      secure: false,
      auth: {
        type: config.SMTP_AUTH_TYPE,
        user: config.SMTP_AUTH_EMAIL,
        pass: config.SMTP_AUTH_PASSWORD,
      },
      requireTLS: true
    });

    const info = await transporter.sendMail({
      from: '"Compañia de transporte de cargamentos vía de terrestre" <ttruckr1@hotmail.com>',
      to, 
      subject: "Envío activo ✔", 
      html: `Hola, ${fullname}. Tienes un envío activo. Ingresa a la app y verifica el mapa para determinar el punto de origen y destino.`,
    })

    return true
  } catch (error) {
    return false
  }
}