

export const roleBaseAuth=(...allowedRole)=>{
    return (req,res,next)=>{
        if(req.user.hierarchy === "SUPERADMIN"){
            return next()
        }
        if(!allowedRole.includes(req.user.hierarchy)){
            return res.status(403).json({message:"Access Denied"})
        }
        next()
    }

}
