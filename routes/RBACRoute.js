import { Router } from "express";
import { isLogin } from "../middleWares/isLogin.js";

import { addRole, getRoles, updateRole } from "../services/RBAC/role/roleServer.js";
import { roleBaseAuth } from "../middleWares/rolebaseAuth.js";

const route= Router()


route.get("/role",isLogin,getRoles)
route.post("/role",isLogin,addRole)
route.put("/role/:id",isLogin,updateRole)


export default route