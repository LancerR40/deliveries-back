import { body, validationResult } from "express-validator";
import { responseCodes, errorResponse } from "../../responses";
import bcrypt from "bcrypt";
import query from "../../database";

export const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const message = errors.errors[0].msg;

    return res.status(responseCodes.HTTP_200_OK).json(errorResponse(message));
  }

  next();
};

export const adminLoginValidations = () => [
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

      if (!result.length) {
        return Promise.reject("Las credenciales son incorrectas.");
      }

      return Promise.resolve();
    }),

  body("password")
    .notEmpty()
    .withMessage("Debes ingresar una contraseña")
    .bail()

    .isLength({ min: "6", max: "255" })
    .withMessage("Las credenciales son incorrectas.")
    .bail()

    .custom(async (value, { req }) => {
      const result = await query("SELECT Password FROM admin WHERE Email = ?", req.body.email);
      const hash = result[0].Password;

      if (!(await bcrypt.compare(value, hash))) {
        return Promise.reject("Las credenciales son incorrectas.");
      }

      return Promise.resolve();
    }),
];

export const driverLoginValidations = () => [
  body("email")
    .notEmpty()
    .withMessage("Debes ingresar un email.")
    .bail()

    .matches(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/)
    .withMessage("El email seleccionado es inválido")
    .bail()

    .normalizeEmail()

    .custom(async (value) => {
      let result = await query("SELECT IDDriver FROM driver WHERE Email = ?", value);

      if (!result.length) {
        return Promise.reject("Las credenciales son incorrectas.");
      }

      result = await query(
        "SELECT IF (doc.Title = 'Licencia de conducir', true, false) as isExistDriverLicense FROM driver as d LEFT JOIN driver_document as doc ON d.IDDriver = doc.IDDriver WHERE d.Email = ?",
        value
      );

      if (!result[0].isExistDriverLicense) {
        return Promise.reject("Necesitas registrar un documento de licencia de conducir para continuar");
      }

      return Promise.resolve();
    }),

  body("password")
    .notEmpty()
    .withMessage("Debes ingresar una contraseña")
    .bail()

    .isLength({ min: "6", max: "255" })
    .withMessage("Las credenciales son incorrectas.")
    .bail()

    .custom(async (value, { req }) => {
      const result = await query("SELECT Password FROM driver WHERE Email = ?", req.body.email);
      const hash = result[0].Password;

      if (!(await bcrypt.compare(value, hash))) {
        return Promise.reject("Las credenciales son incorrectas.");
      }

      return Promise.resolve();
    }),
];
