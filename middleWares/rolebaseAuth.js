

export const roleBaseAuth=(...allowedRole)=>{
    return (req,res,next)=>{
        
        if(req.user.hierarchy.level === 1){
            return next()
        }
        if(!allowedRole.includes(req.user.hierarchy.name)){
            return res.status(403).json({message:"Access Denied"})
        }
        next()
    }

}
