import { extname } from "path";

export const base64Image = (image) => {
  const imageExtension = extname(image.name);
  const imageBase64 = Buffer.from(image.data).toString("base64");

  return `data:image/${imageExtension};base64,${imageBase64}`;
};
