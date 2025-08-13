const responseManager = {
    success: (res, message = "Success", data = {}, statusCode = 200) => {
      return res.status(statusCode).json({
        success: true,
        statusCode,
        message,
        data,
      });
    },
  
    created: (res, message = "Resource Created", data = {}) => {
      return res.status(201).json({
        success: true,
        statusCode: 201,
        message,
        data,
      });
    },
  
    badRequest: (res, message = "Bad Request") => {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message,
      });
    },
  
    unauthorized: (res, message = "Unauthorized Access") => {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        message,
      });
    },
  
    forbidden: (res, message = "Forbidden") => {
      return res.status(403).json({
        success: false,
        statusCode: 403,
        message,
      });
    },
  
    notFound: (res, message = "Resource Not Found") => {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message,
      });
    },
  
    conflict: (res, message = "Conflict") => {
      return res.status(409).json({
        success: false,
        statusCode: 409,
        message,
      });
    },
  
    serverError: (res, message = "Internal Server Error") => {
      return res.status(500).json({
        success: false,
        statusCode: 500,
        message,
      });
    },
  };
  
  export default  responseManager;