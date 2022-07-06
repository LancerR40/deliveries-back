import query from "../../database";
import jsonwebtoken from "jsonwebtoken";
import config from "../../config";
import { errorResponse, responseCodes } from "../../responses";

export const checkAdminSession = (req, res, next) => {
  try {
    const token = req.headers["X-Authorization-Token"];

    const payload = jsonwebtoken.verify(token, config.TOKEN_KEY);
    req.user = payload;

    next();
  } catch (error) {
    res.status(responseCodes.HTTP_401_UNAUTHORIZED).json(errorResponse("No estas autorizado."));
  }
};

export const getDriverIdByEmail = async (email) => {
  try {
    const result = await query("SELECT IDDriver as driverId FROM driver WHERE Email = ?", email);

    return result[0].driverId;
  } catch (error) {
    return false;
  }
};
