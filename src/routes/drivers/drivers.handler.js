import express from "express";
import { validate, createValidations, driverDocumentValidations } from "./validations";
import { base64Image } from "../../utils/image";
import { createDriver, createDriverDocument, getDriverIdByIdentificationCode } from "./drivers";
import bcrypt from "bcrypt";
import cloudinary from "../../cloud/cloudinary";
import { successResponse, errorResponse, responseCodes } from "../../responses";

const router = express.Router();

router.post("/create", createValidations(), validate, async (req, res) => {
  const { name: Name, lastname: Lastname, identificationCode: IdentificationCode, gender: Gender, dateOfBirth: DateOfBirth, email: Email, password: Password } = req.body; /* prettier-ignore */
  const { photo } = req.files;

  const imageBase64 = base64Image(photo);

  let photoUrl = null;

  try {
    const { secure_url } = await cloudinary.uploader.upload(imageBase64, { folder: "driver-photo" });
    photoUrl = secure_url;
  } catch (error) {
    res.status(responseCodes.HTTP_200_OK).json(errorResponse("Hubo un problema en el registro, intenta de nuevo."));
  }

  const driver = { Name, Lastname, IdentificationCode, Gender, Photo: photoUrl,  DateOfBirth, Email, Password: await bcrypt.hash(Password, 8), IDDriverStatus: 2 } /* prettier-ignore */

  if (!(await createDriver(driver))) {
    return res
      .status(responseCodes.HTTP_200_OK)
      .json(errorResponse("Hubo un problema en el registro, intenta de nuevo."));
  }

  res.status(responseCodes.HTTP_200_OK).json(successResponse({ message: "Registro éxitoso." }));
});

router.post("/document", driverDocumentValidations(), validate, async (req, res) => {
  const { driverIdentificationCode, document } = req.body;
  const { title: Title } = document;

  const driverId = await getDriverIdByIdentificationCode(driverIdentificationCode);

  if (!driverId) {
    return res
      .status(responseCodes.HTTP_200_OK)
      .json(errorResponse("Hubo un problema en el registro, intenta de nuevo."));
  }

  const driverDocument = { IDDriver: driverId, Title, Document: JSON.stringify(document) };

  if (!(await createDriverDocument(driverDocument))) {
    return res
      .status(responseCodes.HTTP_200_OK)
      .json(errorResponse("Hubo un problema en el registro, intenta de nuevo."));
  }

  res.status(responseCodes.HTTP_200_OK).json(successResponse({ message: "Registro éxitoso." }));
});

export default router;
