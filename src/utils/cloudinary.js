import cloudinary from "../cloud/cloudinary";

export const uploadImage = async (base64, folderDir) => {
  try {
    return await cloudinary.uploader.upload(base64, { folder: folderDir });
  } catch (error) {
    return false;
  }
};
