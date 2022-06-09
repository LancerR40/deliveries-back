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
