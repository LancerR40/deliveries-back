export const successResponse = (data) => {
  return {
    success: true,
    data,
  };
};

export const errorResponse = (message) => {
  return {
    success: false,
    error: {
      message,
    },
  };
};

export const responseCodes = {
  HTTP_200_OK: 200,
  HTTP_401_UNAUTHORIZED: 401,
};
