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
    
    .custom(async (value) => {
      let [document] = await query("SELECT IF(json_extract(doc.Document, '$.title') = 'Licencia de conducir', true, false) AS isExistDriverLicense, json_extract(doc.Document, '$.expiration') AS documentExpirationDate FROM driver AS d LEFT JOIN driver_document AS doc ON d.IDDriver = doc.IDDriver WHERE d.IdentificationCode = ?", value)

      if (!document) {
        return Promise.reject("El conductor seleccionado no existe.");
      }

      document.documentExpirationDate = JSON.parse(document.documentExpirationDate)

      if (!document.isExistDriverLicense) {
        return Promise.reject("El conductor debe poseer una licencia de conducir.")
      }

      const currentMoment = moment(new Date());
      const expirationMoment = moment(document.documentExpirationDate);

      if (currentMoment.isAfter(expirationMoment)) {
        return Promise.reject("El conductor posee una licencia de conducir vencida, debe actualizar du documento.")
      }

      return Promise.resolve();
    }),
]