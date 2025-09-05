import { Router } from "express";
import { isLogin } from "../middleWares/isLogin.js";

import { addRole, getRoles, updateRole } from "../services/RBAC/role/roleServer.js";
import { roleBaseAuth } from "../middleWares/rolebaseAuth.js";

const route= Router()


route.get("/role",isLogin,roleBaseAuth("noone"),getRoles)
route.post("/role",isLogin,roleBaseAuth("noone"),addRole)
route.put("/role/:id",isLogin,roleBaseAuth("noone"),updateRole)


export default route