import express from "express";
import { validate, createValidations } from "./validations";
import { base64Image } from "../../utils/image";
import { createAdmin } from "./admins";
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
    const { secure_url } = await cloudinary.uploader.upload(imageBase64, { folder: "admin-photo" });
    photoUrl = secure_url;
  } catch (error) {
    res.status(responseCodes.HTTP_200_OK).json(errorResponse("Hubo un problema en el registro, intenta de nuevo."));
  }

  const admin = { Name, Lastname, IdentificationCode, Gender, Photo: photoUrl,  DateOfBirth, Email, Password: await bcrypt.hash(Password, 8), Role: 2, IDAdminStatus: 3 } /* prettier-ignore */

  const result = await createAdmin(admin);

  if (!result) {
    res.status(responseCodes.HTTP_200_OK).json(errorResponse("Hubo un problema en el registro, intenta de nuevo."));
  }

  res.status(responseCodes.HTTP_200_OK).json(successResponse({ message: "Registro éxitoso." }));
});

export default router;
