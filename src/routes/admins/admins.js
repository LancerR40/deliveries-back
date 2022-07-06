import query from "../../database";
import jsonwebtoken from "jsonwebtoken";
import config from "../../config";

export const isAuth = (req, res, next) => {
  const accessToken = req.headers["x-authorization-token"];

  if (!accessToken) {
    return res.status(responseCodes.HTTP_401_UNAUTHORIZED).json(errorResponse("Solicitud denegada."));
  }

  try {
    const payload = jsonwebtoken.verify(accessToken, config.TOKEN_KEY);
    req.admin = payload;

    next();
  } catch (error) {
    return res.status(responseCodes.HTTP_401_UNAUTHORIZED).json(errorResponse("Solicitud denegada."));
  }
};

export const createAdmin = async (admin) => {
  try {
    await query("INSERT INTO admin SET ?", admin);

    return true;
  } catch (error) {
    return false;
  }
};

export const getAdminData = async (adminId) => {
  try {
    const result = await query(
      "SELECT Name as name, Lastname as lastname, Photo as photo FROM admin WHERE IDAdmin = ?",
      adminId
    );

    return result[0];
  } catch (error) {
    return false;
  }
};
