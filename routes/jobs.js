const express = require('express')

const router = express.Router()
const {
  createJob,
  deleteJob,
  getAllJobs,
  updateJob,
  getJob,
  showStats
} = require('../controllers/jobs')

router.route('/').post(createJob).get(getAllJobs)
//make sure you place the route stats above the id
//the reason is because node js in sigle threaded
router.route('/stats').get(showStats);
router.route('/:id').get(getJob).delete(deleteJob).patch(updateJob)



module.exports = router
