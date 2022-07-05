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

export const vehiclesByQueriesValidations = () => [
  body("search").custom((value) => {
    const { page } = value;

    if ((page && !Number(page)) || page === 0) {
      throw new Error("Hubo un problema al realizar la búsqueda.");
    }

    return true;
  }),
];

export const createVehicleValidations = () => [
  body("model").notEmpty().withMessage("Debes ingresar un modelo.").bail(),

  body("brand")
    .notEmpty()
    .withMessage("Debes ingresar una marca.")
    .bail()

    .isLength({ max: 50 })
    .withMessage("La marca puede tener un máximo de cincuenta (50) carácteres."),

  body("colors").custom((value) => {
    if (!Array.isArray(value) || !value.length) {
      throw new Error("Debes añadir los colores del vehículo.");
    }

    if (value.length > 2) {
      throw new Error("Se debe agregar un máximo de dos (2) colores.");
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
    .withMessage("El número de neúmaticos es incorrecto."),

  body("document").custom(async (value, { req }) => {
    if (typeof value !== "object") {
      return Promise.reject("El documento seleccionado es incorrecto.");
    }

    const allowedDocuments = VEHICLE_DOCUMENTS.map((doc) => doc.name);
    const { title } = value;

    if (!allowedDocuments.includes(title)) {
      return Promise.reject("El documento seleccionado es incorrecto.");
    }

    if (title === allowedDocuments[0]) {
      const { brand, type, licenseNumber } = req.body;
      const { name, lastname, identificationCode, maximumLoadMass, expedition } = value;

      if (name || lastname || identificationCode) {
        if (!name || !lastname || !identificationCode) {
          return Promise.reject("El documento no posee los campos requeridos.");
        }

        const [driver] = await query("SELECT Name, Lastname, IdentificationCode FROM driver WHERE IdentificationCode = ?", identificationCode) /* prettier-ignore */

        if (!driver) {
          return Promise.reject("El conductor no se encuentra registrado.");
        }

        if (name !== driver.Name || lastname !== driver.Lastname || driver.IdentificationCode !== identificationCode) {
          return Promise.reject("Los datos del conductor son incorrectos.");
        }
      }

      if (!licenseNumber || !brand || !type || !maximumLoadMass || !expedition) {
        return Promise.reject("El documento no posee los campos requeridos.");
      }

      if (!Number(maximumLoadMass)) {
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

export const createAssignmentValidations = () => [
  body("driverIdentificationCode")
    .notEmpty()
    .withMessage("Debes ingresar una cédula de conductor para continuar.")
    .bail()

    .custom(async (value) => {
      let [driver] = await query("SELECT IF (doc.Title = 'Licencia de conducir', true, false) as isExistDriverLicense FROM driver as d LEFT JOIN driver_document as doc ON d.IDDriver = doc.IDDriver WHERE d.IdentificationCode = ?", value) /* prettier-ignore */

      if (!driver) {
        return Promise.reject("El conductor seleccionado no existe.");
      }

      if (!driver.isExistDriverLicense) {
        return Promise.reject("El conductor no posee una licencia de conducir registrada.");
      }

      return Promise.resolve();
    }),

  body("vehicleLicenseNumber")
    .notEmpty()
    .withMessage("Debes ingresar el número de licencia del vehículo para continuar.")
    .bail()

    .custom(async (value) => {
      const [vehicle] = await query("SELECT v.IDVehicle as vehicleId, IF (doc.Title = 'Certificado de circulación', true, false) as isExistCirculationCertificate FROM vehicle as v LEFT JOIN vehicle_document as doc ON v.IDVehicle = doc.IDVehicle WHERE v.LicenseNumber = ?", value); /* prettier-ignore */

      if (!vehicle) {
        return Promise.reject("El vehículo seleccionado no existe.");
      }

      const [assignment] = await query(
        "SELECT IDAssignedVehicle FROM assigned_vehicle WHERE IDVehicle = ?",
        vehicle.vehicleId
      );

      if (assignment) {
        return Promise.reject("El vehículo ya se encuentra asignado a un conductor.");
      }

      if (!vehicle.isExistCirculationCertificate) {
        return Promise.reject("El vehículo no posee un certificado de circulación registrado.");
      }

      return Promise.resolve();
    }),
];
