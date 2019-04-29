const router = require('express').Router();

const accountController = require('../controllers/accountController');

router.get('/l/dashboard', accountController.list);
router.get('/l/report', accountController.listReport);
router.post('/l/add', accountController.save);
router.get('/l/update/:id', accountController.edit);
router.post('/l/update/:id', accountController.update);
router.get('/l/delete/:id', accountController.delete);
module.exports = router;

