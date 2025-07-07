const express = require('express');
const router = express.Router();
const invites = require('../controllers/invite.controller.js');


router.post('/invite', invites.create);//done
router.get('/invite', invites.getAll);//done
router.get('/invite/:inviteId', invites.getById);//done
router.put('/invite/:inviteId', invites.update);//done
router.delete('/invite/:inviteId', invites.delete);//done


module.exports = router;