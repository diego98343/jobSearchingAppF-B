const Job = require('../models/Job')
const { StatusCodes } = require('http-status-codes')
const { BadRequestError, NotFoundError } = require('../errors')
const mongoose = require('mongoose');
const moment = require('moment');


const getAllJobs = async (req, res) => {

  // Create a constand with the variable we are going to use
  const { search, status, jobType, sort } = req.query

  // then we create a queryObject that takes the jobs created by user ID
  const queryObject = {
    createdBy: req.user.userId
  }

  //create conditions based on the user search input
  if (search) {
    queryObject.position = {$regex:search,$options:'i'}
  }

  if (status && status !== 'all') {
    queryObject.status = status
  }

  if (jobType && jobType !== 'all') {
    queryObject.jobType = jobType;
  }

  let result = Job.find(queryObject);

 //sort // make sure you sort AFTER THE RESULT VARIABLE
    if (sort === 'latest') {
    result = result.sort('-createdAt');
  }
  if (sort === 'oldest') {
    result = result.sort('createdAt');
  }
  if (sort === 'a-z') {
    result = result.sort('position');
  }
  if (sort === 'z-a') {
    result = result.sort('-position');
  }


  const page = Number(req.query.page) || 1
  const limit = Number(req.query.limit) || 10
  const skip = (page - 1) * limit;

  result = result.skip(skip).limit(limit);

  const jobs = await result

  const totalJobs = await Job.countDocuments(queryObject);
  const numOfPages = Math.ceil(totalJobs/limit)

  // const jobs = await Job.find({ createdBy: req.user.userId }).sort('createdAt')
  res.status(StatusCodes.OK).json({ jobs, totalJobs, numOfPages })
}
const getJob = async (req, res) => {
  const {
    user: { userId },
    params: { id: jobId },
  } = req

  const job = await Job.findOne({
    _id: jobId,
    createdBy: userId,
  })
  if (!job) {
    throw new NotFoundError(`No job with id ${jobId}`)
  }
  res.status(StatusCodes.OK).json({ job })
}

const createJob = async (req, res) => {
  req.body.createdBy = req.user.userId
  const job = await Job.create(req.body)
  res.status(StatusCodes.CREATED).json({ job })
}

const updateJob = async (req, res) => {
  const {
    body: { company, position },
    user: { userId },
    params: { id: jobId },
  } = req

  if (company === '' || position === '') {
    throw new BadRequestError('Company or Position fields cannot be empty')
  }
  const job = await Job.findByIdAndUpdate(
    { _id: jobId, createdBy: userId },
    req.body,
    { new: true, runValidators: true }
  )
  if (!job) {
    throw new NotFoundError(`No job with id ${jobId}`)
  }
  res.status(StatusCodes.OK).json({ job })
}

const deleteJob = async (req, res) => {
  const {
    user: { userId },
    params: { id: jobId },
  } = req

  const job = await Job.findByIdAndRemove({
    _id: jobId,
    createdBy: userId,
  })
  if (!job) {
    throw new NotFoundError(`No job with id ${jobId}`)
  }
  res.status(StatusCodes.OK).send()
}

const showStats = async (req, res) => {

  let stats = await Job.aggregate([
    { $match: { createdBy: mongoose.Types.ObjectId(req.user.userId) } },
    //we can group the information base on any property in any case we did it with status
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  // we reduce the values when get from stats variable to make it friendly to the front end to read it 
  stats = stats.reduce((accumutator,current) => {
    const { _id: title, count } = current
    accumutator[title] = count;
    return accumutator;
  }, {});

  const defaultStats = {
    pending: stats.pending || 0,
    interview: stats.interview || 0,
    declined: stats.declined || 0   
  };

// we are calculating the montly applications
  let monthlyApplications = await Job.aggregate([
    //we match the information based on the user login ID
    { $match: { createdBy: mongoose.Types.ObjectId(req.user.userId) } },
    //we can group the information base on any property in any case we did it with status
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        count: { $sum: 1 }
      },
    },
    //then we sort it by year and month and give it a limit of 6 months
    { $sort: { '_id.year': -1, '_id.month': -1 } },
    { $limit: 6 }
  ]);



  console.log(monthlyApplications);

  //make sure to pass the defaulStats property in json
  res.status(StatusCodes.OK).json({ defaultStats, monthlyApplications: [] });
}


module.exports = {
  createJob,
  deleteJob,
  getAllJobs,
  updateJob,
  getJob,
  showStats
}
