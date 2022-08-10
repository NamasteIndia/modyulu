const request = require('request-promise');
exports.downloadImg = function (imgurl, title, type, jwtToken) {
  try {
    const option = {
      method: 'POST',
      headers: {
        'x-access-token': jwtToken,
      },
      uri: `${domain}/${dashboard}/media/download`,
      body: {
        imgurl,
        title,
        type,
      },
      json: true,
    };
    return request(option);
  } catch (err) {
    return Promise.resolve({ code: 0, message: err.message || 'Cant download this image!!!' });
  }
};
