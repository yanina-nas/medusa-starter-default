import { BaseService } from "medusa-interfaces";

class MyService extends BaseService {
  constructor({ productService }) {
    super();

    this.productService_ = productService
  }

  async getProducts(offset, limit) {
    const response = await this.productService_.list({}, { skip: offset, take: limit, relations: ["images"] }) // skip

    return response
  }
}

export default MyService;
