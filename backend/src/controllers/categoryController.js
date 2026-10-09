const { sendSuccess, sendError } = require('../utils/response');
const categoryService = require('../services/categoryService');

const getCategories = async (req, res, next) => {
  try {
    const categories = await categoryService.getAllCategories();
    return sendSuccess(res, 200, 'Categories retrieved successfully', categories);
  } catch (error) {
    return next(error);
  }
};

const getCategoryTree = async (req, res, next) => {
  try {
    const tree = await categoryService.getCategoryTree();
    return sendSuccess(res, 200, 'Category tree retrieved successfully', tree);
  } catch (error) {
    return next(error);
  }
};

const getCategoryById = async (req, res, next) => {
  try {
    const category = await categoryService.getCategoryById(req.params.id);

    if (!category) {
      return sendError(res, 404, 'Category not found');
    }

    return sendSuccess(res, 200, 'Category retrieved successfully', category);
  } catch (error) {
    return next(error);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const category = await categoryService.createCategory(req.body);
    return sendSuccess(res, 201, 'Category created successfully', category);
  } catch (error) {
    return next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const category = await categoryService.updateCategory(req.params.id, req.body);

    if (!category) {
      return sendError(res, 404, 'Category not found');
    }

    return sendSuccess(res, 200, 'Category updated successfully', category);
  } catch (error) {
    return next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const deleted = await categoryService.deleteCategory(req.params.id);

    if (!deleted) {
      return sendError(res, 404, 'Category not found');
    }

    return sendSuccess(res, 200, 'Category deleted successfully');
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getCategories,
  getCategoryTree,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
