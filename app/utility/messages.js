const messages = {
  login: {
    success: "Login Successful!",
    error: "Login Failed"
  },
  signup: {
    success: "Signup Successful!",
    error: "Enter email and password",
    fail: "Email Id Already exists!"
  },
  badge: {
    assignSuccess: "Signup Successful!",
    exists: "Already assigned to this user",
    fail: "Email Id Already exists!"
  },
  create: {
    success: "Success",
    error: "Some error occurred while creating",
  },
  read: {
    success: "Success",
    error: "Some error occurred while listing",
  },
  update: {
    success: "Success",
    error: "Some error occurred while updating",
    empty: "No value received"
  },
  delete: {
    success: "Success",
    error: "Some error occurred while deleting",
  },
  default: {
    error: "Oops! something went wrong please try again"
  }
};

module.exports = messages;
