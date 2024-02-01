const authService = require("../service/auth");
const authMiddleware = require("../middleware/auth");
require("dotenv").config();

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email && !password) {
    res.status(403).json({ message: "You are not authentication" });
  } else {
    const data = await authService.login(email, password);
    if (data) {
      res
        .status(data.status)
        .json({ message: data?.message, data: data?.data, token: data?.token });
    }
  }
};

exports.credential = async(req, res) => {
  try{
    const {value, origin} = req.query;
    if(!value || !origin) {
      return res.status(401).json({message: 'Not found'})
    }
    const data = await authService.credential(value, origin);
    if(data) {
      return res.status(data.status).json({message: data.message, data: data.data, token: data.token})
    }
  }catch(err) {
    return res.status(500).json({message: 'Error from server'})
  }
}

exports.loginAdmin = async (req, res) => {
  const { email, password } = req.body;
  if (!email && !password) {
    res.status(403).json({ message: "You are not authentication" });
  } else {
    const data = await authService.loginAdmin(email, password);
    if (data) {
      res
        .status(data.status)
        .json({ message: data?.message, data: data?.data });
    }
  }
};

exports.signup = async (req, res) => {
  const { username, email, password } = req.body;
  const urlOrigin = req.protocol + "://" + req.get("host");
  if (!username && !email && !password) {
    res.status(404).json({ message: "Input invalid!" });
  } else {
    const data = await authService.signup(username, email, password, urlOrigin);
    if (data) {
      res
        .status(data.status)
        .json({ message: data?.message, data: data?.data, token: data?.token });
    }
  }
};

exports.confirm = async (req, res) => {
  const token = req.query?.token;
  const id = await authMiddleware.verifyToken(token);
  if (id) {
    const data = await authService.confirm(id);
    if (data) {
      res.status(data.status).render("confirm", {
        path: "/confirm",
        pageTitle: "Confirm",
      });
    }
  } else {
    res.status(404).json({ message: "User is invalid!" });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  const urlOrigin = req.protocol + "://" + req.get("host");
  if (!email) {
    res.status(404).json({ message: "Not found" });
  } else {
    const data = await authService.forgotPassword(email, urlOrigin);
    if (data) {
      res.status(data.status).json({ message: data.message, data: data?.data });
    }
  }
};

exports.confirmPassword = async (req, res) => {
  const { password, user_id } = req.body;
  if (!password || !user_id) {
    res.status(404).json({ message: "Password invalid" });
  } else {
    const data = await authService.confirmPassword(password, user_id);
    if (data) {
      res
        .status(data.status)
        .redirect(
          data.data.role === "F3"
            ? process.env.CLIENT_ADMIN_1_REDIRECT
            : process.env.CLIENT_1_REDIRECT + '/login'
        );
    }
  }
};

exports.getUser = async (req, res) => {
  const page = req.query?.page === "null" ? 1 : req.query.page;
  const limit = req.query?.limit === "null" ? 10 : req.query.limit;
  const key = req.query?.key === "null" ? null : req.query.key;
  const data = await authService.getUser(page, limit, key, req);
  if (data) {
    res.status(data.status).json({ message: data.message, data: data?.data });
  }
};

exports.updateUser = async (req, res) => {
  const { accountName, fullname, phone, gender, address } = req.body;
  const data = await authService.updateUser(
    accountName,
    fullname,
    phone,
    gender,
    address,
    req
  );
  if (data) {
    res
      .status(data.status)
      .json({ message: data.message, data: data?.data, token: data?.token });
  }
};

exports.updateAvatar = async(req, res) => {
  try{
    const picture = req.body;
    if(!picture) {
      return res.status(400).json({message: 'Not found'})
    }
    const data = await authService.updateAvatar(picture, req);
    if(data) {
      return res.status(data.status).json({message: data.message, data: data.data, token: data.token})
    }
  }catch(err) {
    return res.status(500).json({message: 'Error from server'})
  }
}
