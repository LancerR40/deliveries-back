import { body, validationResult } from "express-validator";
import { responseCodes, errorResponse } from "../../responses";

import query from "../../database";
import moment from "moment";

export const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const message = errors.errors[0].msg;

    return res.status(responseCodes.HTTP_200_OK).json(errorResponse(message));
  }

  next();
};

export const createShipmentValidations = () => [
  body("driverIdentificationCode")
    .notEmpty()
    .withMessage("Debes agregar la cédula de conductor.")
    .bail()

    .matches(/^[0-9]*$/)
    .withMessage("La cédula es inválida.")
    .bail()

    .isLength({ min: 7, max: 8 })
    .withMessage("La cédula debe tener menos de siete (7) a ocho (8) carácteres.")
    .bail()
    
    .custom(async (value, { req }) => {
      let [driver] = await query("SELECT d.IDDriver AS driverId, IF(json_extract(doc.Document, '$.title') = 'Licencia de conducir', true, false) AS isExistDriverLicense, json_extract(doc.Document, '$.expiration') AS documentExpirationDate FROM driver AS d LEFT JOIN driver_document AS doc ON d.IDDriver = doc.IDDriver WHERE d.IdentificationCode = ?", value)

      if (!driver) {
        return Promise.reject("El conductor seleccionado no existe.");
      }

      driver.documentExpirationDate = JSON.parse(driver.documentExpirationDate)

      if (!driver.isExistDriverLicense) {
        return Promise.reject("El conductor debe poseer una licencia de conducir.")
      }

      const currentMoment = moment(new Date());
      const expirationMoment = moment(driver.documentExpirationDate);

      if (currentMoment.isAfter(expirationMoment)) {
        return Promise.reject("El conductor posee una licencia de conducir vencida, debe actualizar du documento.")
      }

      if (!req.body.vehicleLicenseNumber) {
        return Promise.reject("Debes seleccionar un vehículo para continuar.")
      }

      const [vehicle] = await query("SELECT v.IDVehicle AS vehicleId, IF(json_extract(doc.Document, '$.title') = 'Certificado de circulación', true, false) AS isExistVehicleCertified FROM vehicle AS v LEFT JOIN vehicle_document AS doc  ON v.IDVehicle = doc.IDVehicle WHERE v.LicenseNumber= ?", req.body.vehicleLicenseNumber) 

      if (!vehicle) {
        return Promise.reject("El conductor seleccionado no existe.");
      }

      if (!vehicle.isExistVehicleCertified) {
        return Promise.reject("El vehículo no posee un certificado de vehículo.")
      }

      const { driverId } = driver
      const { vehicleId } = vehicle

      const result = await query("SELECT IDAssignedVehicle FROM assigned_vehicle WHERE IDVehicle = ? AND IDDriver = ?", [vehicleId, driverId])

      if (!result.length) {
        return Promise.reject("El conductor no posee el vehículo asignado o viceversa.")
      }

      return Promise.resolve();
    }),

    body("products")
      .isArray()
      .withMessage("La lista de productos es incorrecta.")
      .bail()

      .custom(value => {
        if (value.length < 1) {
          throw new Error("Debes agregar al menos un producto.")
        }

        for (let i = 0; i < value.length; i++) {
          const { productName, productQuantity } = value[i]

          if (!productName) {
            throw new Error("Un producto no contiene un nombre válido.")
          }

          if (!Number(productQuantity) && !Number.isInteger(Number(productQuantity))) {
            throw new Error("Un producto posee un número de cantidad incorrecto.")
          }
        }

        return true
      }),

    body("shipment")
      .isObject()
      .withMessage("Los datos de envío son incorrectos.")
      .bail()

      .custom(value => {
        const { address, origin, destination } = value

        if (!address) {
          throw new Error("Debes ingresar una dirección de envío para continuar.")
        }

        if (!origin.latitude) {
          throw new Error("Debes ingresar una coordenada de latitud de origen para continuar.")
        }

        if (!origin.longitude) {
          throw new Error("Debes ingresar una coordenada de longitud de origen para continuar.")
        }

        if (!destination.latitude) {
          throw new Error("Debes ingresar una coordenada de latitud de destino para continuar.")
        }

        if (!destination.longitude) {
          throw new Error("Debes ingresar una coordenada de longitud de destino para continuar.")
        }

        if (!origin.latitude.match(/^[-+]?[0-9]+\.[0-9]+$/)) {
          throw new Error("La coordenada de latitud de origen es incorrecta.")
        }

        if (!origin.longitude.match(/^[-+]?[0-9]+\.[0-9]+$/)) {
          throw new Error("La coordenada de longitud de origen es incorrecta.")
        }

        if (!destination.latitude.match(/^[-+]?[0-9]+\.[0-9]+$/)) {
          throw new Error("La coordenada de latitud de destino es incorrecta.")
        }

        if (!destination.longitude.match(/^[-+]?[0-9]+\.[0-9]+$/)) {
          throw new Error("La coordenada de longitud de destino es incorrecta.")
        }

        return true
      })
]