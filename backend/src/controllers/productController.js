const productService = require('../services/productService');
const { sendSuccess, sendError } = require('../utils/response');

const getProducts = async (req, res, next) => {
  try {
    const { search, categoryId, minPrice, maxPrice, stock, sort, page, limit } = req.query;
    const payload = {
      search: search || '',
      categoryId: categoryId || null,
      minPrice: minPrice || null,
      maxPrice: maxPrice || null,
      stockFilter: stock || null,
      sort: sort || 'newest',
      page: Number(page) || 1,
      limit: Number(limit) || 12,
    };

    const result = await productService.listProducts(payload);
    return sendSuccess(res, 200, 'Products retrieved successfully', result);
  } catch (error) {
    return next(error);
  }
};

const getFeaturedProducts = async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 8;
    const products = await productService.getFeaturedProducts(limit);
    return sendSuccess(res, 200, 'Featured products retrieved successfully', products);
  } catch (error) {
    return next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const product = await productService.getProductById(req.params.id);

    if (!product) {
      return sendError(res, 404, 'Product not found');
    }

    return sendSuccess(res, 200, 'Product retrieved successfully', product);
  } catch (error) {
    return next(error);
  }
};

const getProductBySlug = async (req, res, next) => {
  try {
    const product = await productService.getProductBySlug(req.params.slug);

    if (!product) {
      return sendError(res, 404, 'Product not found');
    }

    return sendSuccess(res, 200, 'Product retrieved successfully', product);
  } catch (error) {
    return next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const product = await productService.createProduct(req.body);
    return sendSuccess(res, 201, 'Product created successfully', product);
  } catch (error) {
    return next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.body);

    if (!product) {
      return sendError(res, 404, 'Product not found');
    }

    return sendSuccess(res, 200, 'Product updated successfully', product);
  } catch (error) {
    return next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const deleted = await productService.deleteProduct(req.params.id);

    if (!deleted) {
      return sendError(res, 404, 'Product not found');
    }

    return sendSuccess(res, 200, 'Product deleted successfully');
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getProducts,
  getFeaturedProducts,
  getProductById,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
};
