import User from "../../../models/userModel.js";

export const getAllUsers = async (req, res) => {
  const user = req.user;

  if (user.hierarchy !== "ADMIN") {
    return res.status(403).json({
      message: " Not Admin",
    });
  }
  try {
    console.log("start");

    const users = await User.find({});
    if (!users) {
      return res.status(404).json({
        message: "Users Not Found",
      });
    }
    console.log(users);

    return res.status(200).json({
      message: users,
    });
  } catch (error) {
    console.log("error");
    return res.status(500).json({
      message: "Server Error",
    });
  }
};