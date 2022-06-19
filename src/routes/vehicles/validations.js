import { body, validationResult } from "express-validator";

import moment from "moment";
import query from "../../database";

import { errorResponse, responseCodes } from "../../responses";
import { VEHICLE_DOCUMENTS } from "../../constants";

export const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const message = errors.errors[0].msg;

    return res.status(responseCodes.HTTP_200_OK).json(errorResponse(message));
  }

  next();
};

export const createVehicleValidations = () => [
  body("model").notEmpty().withMessage("Debes ingresar un modelo.").bail(),

  body("brand")
    .notEmpty()
    .withMessage("Debes ingresar una marca.")
    .bail()

    .isLength({ max: 50 })
    .withMessage("La marca puede tener un máximo de cincuenta (50) carácteres."),

  body("colors")
    .isArray()
    .withMessage("Debes ingresar un color.")
    .bail()

    .custom((value) => {
      if (value.length > 2) {
        throw new Error("Solo se deben agregar un máximo de dos (2) colores.");
      }

      return true;
    }),

  body("type")
    .notEmpty()
    .withMessage("Debes ingresar un tipo de vehículo.")
    .bail()

    .isLength({ max: 50 })
    .withMessage("El tipo puede tener un máximo de cincuenta (50) carácteres."),

  body("licenseNumber")
    .notEmpty()
    .withMessage("Debes ingresar un número de licencia.")
    .bail()

    .matches(/^[a-zA-Z0-9]*$/)
    .withMessage("El número de licencia es inválido.")
    .bail()

    .isLength({ min: 7, max: 7 })
    .withMessage("El número de licencia debe tener siete (7) carácteres.")

    .custom(async (value) => {
      const result = await query("SELECT IDVehicle FROM vehicle WHERE LicenseNumber = ?", value);

      if (result.length) {
        return Promise.reject("El número de licencia del vehículo se encuentra registrado.");
      }

      return Promise.resolve();
    }),

  body("tiresNumber")
    .notEmpty()
    .withMessage("Debes ingresar un número de neumáticos.")
    .bail()

    .matches(/^[0-9]*$/)
    .withMessage("El número de neúmaticos es incorrecto.")
    .bail(),

  body("owner")
    .notEmpty()
    .withMessage("Debes ingresar un propietario del vehículo.")
    .bail()

    .custom(async (value) => {
      if (value === "Company") {
        return Promise.resolve();
      }

      const result = await query("SELECT IDDriver FROM driver WHERE IdentificationCode = ?", value);

      if (!result.length) {
        return Promise.reject("El conductor seleccionado no se encuentra registrado.");
      }

      return Promise.resolve();
    }),
];

export const vehicleDocumentValidations = () => [
  body("document")
    .isObject()
    .withMessage("El documento sleccionado es incorrecto.")
    .bail()

    .custom(async (value) => {
      const allowedDocuments = VEHICLE_DOCUMENTS.map((doc) => doc.name);
      const { title } = value;

      if (!title || (title && !allowedDocuments.includes(title))) {
        return Promise.reject("El documento sleccionado es incorrecto.");
      }

      if (title === allowedDocuments[0]) {
        const { name, lastname, identificationCode, licenseNumber, vehicleBrand, vehicleType, vehicleMaximumLoadMass, expedition } = value /* prettier-ignore */

        if (name || lastname || identificationCode) {
          if (!name || !lastname || !identificationCode) {
            return Promise.reject("El documento no posee los campos requeridos.");
          }

          const [driver] = await query("SELECT Name, Lastname, IdentificationCode FROM driver WHERE IdentificationCode = ?", identificationCode) /* prettier-ignore */

          if (!driver) {
            return Promise.reject("El conductor no se encuentra registrado.");
          }

          /* prettier-ignore */
          if (name !== driver.Name || lastname !== driver.Lastname || driver.IdentificationCode !== identificationCode) {
            return Promise.reject("Los datos del conductor son incorrectos.");
          }
        }

        if (!name && !lastname && !identificationCode) {
          const [vehicle] = await query("SELECT IDVehicle FROM vehicle WHERE LicenseNumber = ?", licenseNumber);

          if (!vehicle) {
            return Promise.reject("El vehículo no se encuentra registrado.");
          }
        }

        /* prettier-ignore */
        if (!licenseNumber || !vehicleBrand || !vehicleType || !vehicleMaximumLoadMass || !expedition) {
          return Promise.reject("El documento no posee los campos requeridos.")
        }

        const [vehicle] = await query("SELECT IDVehicle, LicenseNumber, Brand, Type FROM vehicle WHERE LicenseNumber = ?", licenseNumber); /* prettier-ignore */

        if (!vehicle) {
          return Promise.reject("El vehículo no se encuentra registrado.");
        }

        const [vehicleDocument] = await query("SELECT IDVehicleDocument FROM vehicle_document WHERE IDVehicle = ? && Title = ?", [vehicle.IDVehicle, title]); /* prettier-ignore */

        if (vehicleDocument) {
          return Promise.reject("El documento se encuentra registrado para este vehículo.");
        }

        if (licenseNumber !== vehicle.LicenseNumber || vehicleBrand !== vehicle.Brand || vehicleType !== vehicle.Type) {
          return Promise.reject("Los datos del vehículo son incorrectos.");
        }

        if (!Number(vehicleMaximumLoadMass)) {
          return Promise.reject("El peso máximo de carga del vehículo es inválido.");
        }

        const currentMoment = moment(new Date());
        const expeditionMoment = moment(expedition);

        if (!expeditionMoment.isValid()) {
          return Promise.reject("La fecha de expedición del documento es inválida.");
        }

        if (expeditionMoment.isAfter(currentMoment)) {
          return Promise.reject("La fecha de expedición es incorrecta.");
        }

        return Promise.resolve();
      }
    }),
];
