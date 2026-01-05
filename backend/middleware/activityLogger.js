import ActivityLog from '../models/ActivityLog.js';

export const logActivity = async (req, res, next) => {
  // Log the activity after the response is sent
  const originalSend = res.json;
  res.json = function(data) {
    // Only log successful requests (status 200-299)
    if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
      // Don't await to avoid blocking the response
      ActivityLog.create({
        userId: req.user.id,
        role: req.user.role,
        action: `${req.method}_${req.route?.path || req.path}`,
        details: {
          method: req.method,
          path: req.path,
          body: req.body
        },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent')
      }).catch(err => console.error('Activity log error:', err));
    }
    return originalSend.call(this, data);
  };
  next();
};

