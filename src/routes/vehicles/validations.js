import { body, validationResult } from "express-validator";
import { errorResponse, responseCodes } from "../../responses";
import moment from "moment";
import query from "../../database";

export const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const message = errors.errors[0].msg;

    return res.status(responseCodes.HTTP_200_OK).json(errorResponse(message));
  }

  next();
};

export const createVehicleValidations = () => [
  body("model")
    .notEmpty()
    .withMessage("Debes ingresar un modelo.")
    .bail()

    .custom((value) => {
      const allowedBrands = ["Tesla", "Chevrolet", "Nissan"];

      if (!allowedBrands.includes(value)) {
        throw new Error("El modelo seleccionado no incorrecto.");
      }

      return true;
    }),

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

  body("plateNumber")
    .notEmpty()
    .withMessage("Debes ingresar un número de placa.")
    .bail()

    .matches(/^[a-zA-Z0-9]*$/)
    .withMessage("El número de placa es inválido.")
    .bail()

    .isLength({ min: 8, max: 8 })
    .withMessage("El tipo debe tener ocho (8) carácteres."),

  body("tiresNumber")
    .notEmpty()
    .withMessage("Debes ingresar un número de neumáticos.")
    .bail()

    .matches(/^[0-9]*$/)
    .withMessage("El número de neúmaticos es incorrecto.")
    .bail(),

  body("owner")
    .notEmpty()
    .withMessage("Debes ingresar un dueño.")
    .bail()

    .custom(async (value) => {
      if (value === "company") {
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
  body("plateNumber")
    .notEmpty()
    .withMessage("Debes ingresar un número de placa.")
    .bail()

    .matches(/^[a-zA-Z0-9]*$/)
    .withMessage("El número de placa es inválido.")
    .bail()

    .isLength({ min: 8, max: 8 })
    .withMessage("El tipo debe tener ocho (8) carácteres."),

  body("document").custom(async (value) => {
    const allowedDocuments = ["circulation card"];
    const { title } = value;

    if (!allowedDocuments.includes(title)) {
      return Promise.reject("El documento seleccionado es incorrecto.");
    }

    if (title === allowedDocuments[0]) {
      const { yearOfProduction, weightCapacity, passengersNumber } = value;

      if (!yearOfProduction || !weightCapacity || !passengersNumber) {
        return Promise.reject("El documento no posee los campos necesarios.");
      }

      if (yearOfProduction.length !== 4) {
        return Promise.reject("El año del vehículo es incorrecto");
      }

      if (!Number(weightCapacity)) {
        return Promise.reject("La capacidad de peso del vehículo es incorrecta");
      }

      if (!Number(passengersNumber)) {
        return Promise.reject("El número de pasajeros del vehículo es incorrecto");
      }

      return Promise.resolve();
    }
  }),
];
