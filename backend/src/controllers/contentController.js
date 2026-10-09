const { sendSuccess, sendError } = require('../utils/response');
const contentService = require('../services/contentService');

const typeFromRequest = (req) => (req.params.type === 'pages' ? 'page' : req.params.type === 'posts' ? 'post' : null);
const handle = (fn) => async (req, res, next) => {
  try { await fn(req, res); } catch (error) {
    if (error.statusCode) return sendError(res, error.statusCode, error.message);
    return next(error);
  }
};

const listItems = handle(async (req, res) => {
  const type = typeFromRequest(req);
  if (!type) return sendError(res, 404, 'Content type not found');
  return sendSuccess(res, 200, 'Content retrieved successfully', await contentService.listItems(type));
});
const createItem = handle(async (req, res) => {
  const type = typeFromRequest(req);
  if (!type) return sendError(res, 404, 'Content type not found');
  const id = await contentService.saveItem(type, req.body, req.user.id);
  return sendSuccess(res, 201, 'Content created successfully', { id });
});
const updateItem = handle(async (req, res) => {
  const type = typeFromRequest(req);
  if (!type) return sendError(res, 404, 'Content type not found');
  await contentService.saveItem(type, req.body, req.user.id, req.params.id);
  return sendSuccess(res, 200, 'Content updated successfully', { id: Number(req.params.id) });
});
const deleteItem = handle(async (req, res) => {
  const type = typeFromRequest(req);
  if (!type) return sendError(res, 404, 'Content type not found');
  const deleted = await contentService.deleteItem(req.params.id, type);
  if (!deleted) return sendError(res, 404, 'Content not found');
  return sendSuccess(res, 200, 'Content deleted successfully');
});
const categories = handle(async (req, res) => sendSuccess(res, 200, 'Content categories retrieved', await contentService.getCategories()));
const createCategory = handle(async (req, res) => sendSuccess(res, 201, 'Content category created', { id: await contentService.saveCategory(req.body) }));
const updateCategory = handle(async (req, res) => {
  const id = await contentService.saveCategory(req.body, req.params.id);
  if (!id) return sendError(res, 404, 'Content category not found');
  return sendSuccess(res, 200, 'Content category updated', { id });
});
const deleteCategory = handle(async (req, res) => {
  if (!await contentService.deleteCategory(req.params.id)) return sendError(res, 404, 'Content category not found');
  return sendSuccess(res, 200, 'Content category deleted');
});
const tags = handle(async (req, res) => sendSuccess(res, 200, 'Content tags retrieved', await contentService.getTags()));
const createTag = handle(async (req, res) => sendSuccess(res, 201, 'Content tag created', { id: await contentService.saveTag(req.body) }));
const updateTag = handle(async (req, res) => {
  const id = await contentService.saveTag(req.body, req.params.id);
  if (!id) return sendError(res, 404, 'Content tag not found');
  return sendSuccess(res, 200, 'Content tag updated', { id });
});
const deleteTag = handle(async (req, res) => {
  if (!await contentService.deleteTag(req.params.id)) return sendError(res, 404, 'Content tag not found');
  return sendSuccess(res, 200, 'Content tag deleted');
});

module.exports = { listItems, createItem, updateItem, deleteItem, categories, createCategory, updateCategory, deleteCategory, tags, createTag, updateTag, deleteTag };