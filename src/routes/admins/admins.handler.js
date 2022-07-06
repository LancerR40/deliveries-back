import express from "express";
import bcrypt from "bcrypt";

import { validate, createValidations } from "./validations";

import { uploadImage } from "../../utils/cloudinary";
import { base64Image } from "../../utils/image";

import { isAuth, createAdmin, getAdminData } from "./admins";
import { successResponse, errorResponse, responseCodes } from "../../responses";

const router = express.Router();

router.get("/data", isAuth, async (req, res) => {
  const admin = await getAdminData(req.admin.id);

  res.status(responseCodes.HTTP_200_OK).json(successResponse(admin));
});

router.post("/create", createValidations(), validate, async (req, res) => {
  const { name, lastname, identificationCode, gender, dateOfBirth, email, password } = req.body;
  const { photo } = req.files;

  const imageBase64 = base64Image(photo);
  const cloudResponse = await uploadImage(imageBase64, "deliveries-system/driver-photo");

  if (!cloudResponse) {
    return res
      .status(responseCodes.HTTP_200_OK)
      .json(errorResponse("Hubo un problema en el registro del conductor, intenta de nuevo 1."));
  }

  const secureURL = cloudResponse.secure_url;
  const encryptedPassword = await bcrypt.hash(password, 8);

  const newAdmin = {
    name,
    lastname,
    identificationCode,
    gender,
    photo: secureURL,
    dateOfBirth,
    email,
    password: encryptedPassword,
    role: 2,
    IDAdminStatus: 1,
  };

  const result = await createAdmin(newAdmin);

  if (!result) {
    res.status(responseCodes.HTTP_200_OK).json(errorResponse("Hubo un problema en el registro, intenta de nuevo."));
  }

  res.status(responseCodes.HTTP_200_OK).json(successResponse({ message: "Registro éxitoso." }));
});

export default router;
