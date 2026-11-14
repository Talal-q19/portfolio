const { ContactRequest } = require('../dtos/request/ContactRequest');
const { ApiResponse } = require('../dtos/response/ApiResponse');

// Base path: /api/contact
class ContactController {
  constructor(service) {
    this.service = service;
  }


  // POST /api/contact
  async send(req, res) {
    const request = ContactRequest.from(req.body);
    await this.service.send(request);

    res.json(ApiResponse.success('Message sent successfully!'));
  }
}

module.exports = { ContactController };
