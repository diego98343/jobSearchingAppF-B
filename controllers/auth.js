const User = require('../models/User')
const { StatusCodes } = require('http-status-codes')
const { BadRequestError, UnauthenticatedError } = require('../errors')

const register = async (req, res) => {
  const user = await User.create({ ...req.body });
  const token = user.createJWT();
  res.status(StatusCodes.CREATED).json({
    user: {
      email: user.email,
      lastName: user.lastName,
      location: user.location,
      name: user.name,
      token,
    },
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new BadRequestError('Please provide email and password');
  }
  const user = await User.findOne({ email });
  if (!user) {
    throw new UnauthenticatedError('Invalid Credentials');
  }
  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new UnauthenticatedError('Invalid Credentials');
  }
  // compare password
  const token = user.createJWT();
  res.status(StatusCodes.OK).json({
    user: {
      email: user.email,
      lastName: user.lastName,
      location: user.location,
      name: user.name,
      token,
    },
  });
};


const updateUser = async (req, res) => {
  //first we get the values that we want o modify 
  const { email, name, lastName, location } = req.body
  //then if they values are not found we throw an error;
  if (!email || !name || !lastName || !location) {
    throw new BadRequestError('please provide all values')
  }
  //we find the user by id 
  const user = await User.findOne({ _id: req.user.userId });

  // then we get the values for the user and we set them equal to 
  // the input values

  user.email = email;
  user.name = name;
  user.lastName = lastName;
  user.location = location;

  //we save all the chamges
  await user.save();

  // and finally we retrieve the json with values and a new token because
  // some values were modified
  const token = user.createJWT();
  res.status(StatusCodes.OK).json({
    user: {
      email: user.email,
      lastName: user.lastName,
      location: user.location,
      name: user.name,
      token,
    },
  });
}


module.exports = {
  register,
  login,
  updateUser
}
