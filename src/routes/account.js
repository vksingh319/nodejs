const router = require('express').Router();

const accountController = require('../controllers/accountController');

router.get('/l/dashboard', accountController.list);
router.get('/l/chart', accountController.listChart);
router.get('/l/report', accountController.listReport);
router.get('/l/expense', accountController.listExpense);
router.get('/l/hours', accountController.listExtraHours);
router.post('/l/add', accountController.save);
router.get('/l/update/:id', accountController.edit);
router.post('/l/update/:id', accountController.update);
router.get('/l/delete/:id', accountController.delete);
module.exports = router;

