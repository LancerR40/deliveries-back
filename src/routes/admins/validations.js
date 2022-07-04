import { body, validationResult } from "express-validator";
import { extname } from "path";

import moment from "moment";
import query from "../../database";

import { responseCodes, errorResponse } from "../../responses";
import { USER_GENDERS } from "../../constants";

export const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const message = errors.errors[0].msg;

    return res.status(responseCodes.HTTP_200_OK).json(errorResponse(message));
  }

  next();
};

export const createValidations = () => [
  body("name")
    .notEmpty()
    .withMessage("Debes ingresar un nombre.")
    .bail()

    .matches(/^[a-zA-Z\s]*$/)
    .withMessage("El nombre es inválido.")
    .bail()

    .isLength({ max: 50 })
    .withMessage("El nombre debe tener menos de cincuenta (50) carácteres.")
    .bail(),

  body("lastname")
    .notEmpty()
    .withMessage("Debes ingresar un apellido.")
    .bail()

    .matches(/^[a-zA-Z\s]*$/)
    .withMessage("El apellido es inválido.")
    .bail()

    .isLength({ max: 50 })
    .withMessage("El apellido debe tener menos de cincuenta (50) carácteres.")
    .bail(),

  body("identificationCode")
    .notEmpty()
    .withMessage("Debes ingresar una cédula.")
    .bail()

    .matches(/^[0-9]*$/)
    .withMessage("La cédula es inválida.")
    .bail()

    .isLength({ min: 7, max: 8 })
    .withMessage("La cédula debe tener menos de siete (7) a ocho (8) carácteres.")
    .bail()

    .custom(async (value) => {
      const result = await query("SELECT IDAdmin FROM admin WHERE IdentificationCode = ?", value);

      if (result.length) {
        return Promise.reject("La identificación seleccionada se encuentra en uso.");
      }

      return Promise.resolve();
    }),

  body("gender")
    .notEmpty()
    .withMessage("Debes ingresar un género.")
    .bail()

    .custom((value) => {
      const allowedGenders = USER_GENDERS.map(({ name }) => name);

      if (!allowedGenders.includes(value)) {
        throw new Error("El género es incorrecto.");
      }

      return true;
    }),

  body("photo").custom((value, { req }) => {
    if (!req.files || !req.files.photo) {
      throw new Error("Debes seleccionar una imagen.");
    }

    const allowedExtensions = [".png", ".jpg", ".jpeg"];

    const image = req.files.photo;
    const imageExtension = extname(image.name);

    if (!allowedExtensions.includes(imageExtension)) {
      throw new Error("La imagen seleccionada es incorrecta.");
    }

    return true;
  }),

  body("dateOfBirth")
    .notEmpty()
    .withMessage("Debes ingresar una fecha de nacimiento.")
    .bail()

    .custom((value) => {
      const date = moment(value);

      if (!date.isValid()) {
        throw new Error("La fecha de nacimiento es inválida.");
      }

      const age = moment().diff(date, "years");

      if (age < 18) {
        throw new Error("El usuario debe tener dieciocho (18) años o más para continuar");
      }

      return true;
    }),

  body("email")
    .notEmpty()
    .withMessage("Debes ingresar un email.")
    .bail()

    .matches(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/)
    .withMessage("El email seleccionado es inválido")
    .bail()

    .normalizeEmail()

    .custom(async (value) => {
      const result = await query("SELECT IDAdmin FROM admin WHERE Email = ?", value);

      if (result.length) {
        return Promise.reject("El email seleccionado se encuentra en uso.");
      }

      return Promise.resolve();
    }),

  body("password")
    .notEmpty()
    .withMessage("Debes ingresar una contraseña")
    .bail()

    .isLength({ min: "6", max: "255" })
    .withMessage("La contraseña debe tener más de seis (6) carácteres")
    .bail(),
];
