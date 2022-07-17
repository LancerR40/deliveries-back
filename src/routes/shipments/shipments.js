import query from "../../database";
import nodemailer from "nodemailer"
import config from "../../config";

export const createShipment = async (data) => {
  try {
    await query("INSERT INTO shipment SET ?", data)

    return true
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