const express = require('express');
const controller = require('../controllers/contentController');
const { authenticate, authorize, authorizePermission } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate, authorize('admin'));
router.get('/taxonomy/categories', authorizePermission('content.view'), controller.categories);
router.post('/taxonomy/categories', authorizePermission('content.create'), controller.createCategory);
router.put('/taxonomy/categories/:id', authorizePermission('content.edit'), controller.updateCategory);
router.delete('/taxonomy/categories/:id', authorizePermission('content.delete'), controller.deleteCategory);
router.get('/taxonomy/tags', authorizePermission('content.view'), controller.tags);
router.post('/taxonomy/tags', authorizePermission('content.create'), controller.createTag);
router.put('/taxonomy/tags/:id', authorizePermission('content.edit'), controller.updateTag);
router.delete('/taxonomy/tags/:id', authorizePermission('content.delete'), controller.deleteTag);
router.get('/:type', authorizePermission('content.view'), controller.listItems);
router.post('/:type', authorizePermission('content.create'), controller.createItem);
router.put('/:type/:id', authorizePermission('content.edit'), controller.updateItem);
router.delete('/:type/:id', authorizePermission('content.delete'), controller.deleteItem);
module.exports = router;