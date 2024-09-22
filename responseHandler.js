// responseHandler.js

export const customResponse = (req, res, next) => {
    // Override the res.send method
    const originalSend = res.send;
  
    res.send = function(data) {
      // You can customize the response here
      const responseData = {
        status: res.statusCode,
        data: data,
        message: 'Response processed by custom handler',
        timestamp: new Date(),
      };
  
      // Call the original send method with the modified response
      originalSend.call(this, responseData);
    };
  
    next(); // Proceed to the next middleware
  };
  