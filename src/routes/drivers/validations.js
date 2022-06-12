import { body, validationResult } from "express-validator";
import { responseCodes, errorResponse } from "../../responses";
import { extname } from "path";
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
      let result = await query("SELECT IdentificationCode FROM admin WHERE IdentificationCode = ? UNION SELECT IdentificationCode FROM driver WHERE IdentificationCode = ?", [value, value]) /* prettier-ignore */

      if (result.length) {
        return Promise.reject("La identificación seleccionada se encuentra en uso.");
      }

      return Promise.resolve();
    }),

  body("gender")
    .notEmpty()
    .withMessage("Debes ingresar un género.")
    .bail()

    .matches(/^[1-2]*$/)
    .withMessage("El género es inválido.")
    .bail(),

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
      const result = await query("SELECT IDDriver FROM driver WHERE Email = ?", value);

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

export const driverDocumentValidations = () => [
  body("driverName")
    .notEmpty()
    .withMessage("Debes ingresar un nombre.")
    .bail()

    .matches(/^[a-zA-Z\s]*$/)
    .withMessage("El nombre es inválido.")
    .bail()

    .isLength({ max: 50 })
    .withMessage("El nombre debe tener menos de cincuenta (50) carácteres.")
    .bail(),

  body("driverLastname")
    .notEmpty()
    .withMessage("Debes ingresar un apellido.")
    .bail()

    .matches(/^[a-zA-Z\s]*$/)
    .withMessage("El apellido es inválido.")
    .bail()

    .isLength({ max: 50 })
    .withMessage("El apellido debe tener menos de cincuenta (50) carácteres.")
    .bail(),

  body("driverIdentificationCode")
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
      let result = await query("SELECT IDDriver FROM driver WHERE IdentificationCode = ?", [value]);

      if (!result.length) {
        return Promise.reject("La identificación seleccionada es incorrecta.");
      }

      return Promise.resolve();
    }),

  body("document").custom(async (value, { req }) => {
    const allowedDocuments = ["driver license"];
    const { title } = value;

    if (!allowedDocuments.includes(title)) {
      throw new Error("El documento seleccionado es incorrecto.");
    }

    if (title === allowedDocuments[0]) {
      const result = await query("SELECT IDDriverDocument FROM driver_document INNER JOIN driver ON driver_document.IDDriver = driver.IDDriver WHERE driver.IdentificationCode = ?", req.body.driverIdentificationCode) /* prettier-ignore */

      if (result.length) {
        return Promise.reject("El documento para el conductor seleccionado se encuentra registrado.");
      }

      const { expedition, expiration } = value;

      const currentMoment = moment(new Date());
      const expeditionMoment = moment(expedition);
      const expirationMoment = moment(expiration);

      if (expeditionMoment.isAfter(currentMoment)) {
        return Promise.reject("La fecha de expedición del documento es incorrecta.");
      }

      if (expirationMoment.isSameOrBefore(expeditionMoment)) {
        return Promise.reject("La fecha de expiración indica que el documento ya no es válido.");
      }

      return Promise.resolve();
    }

    return Promise.reject("");
  }),
];

export const driversByQueriesValidations = () => [
  body("search").custom((value) => {
    const { page } = value;

    if ((page && !Number(page)) || Number(page) === 0) {
      throw new Error("Hubo un problema al realizar la búsqueda.");
    }

    return true;
  }),
];
