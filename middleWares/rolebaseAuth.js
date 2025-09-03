

export const roleBaseAuth=(...allowedRole)=>{
    return (req,res,next)=>{
        console.log(req.user.hierarchy.level===1);
        
        if(req.user.hierarchy.level === 1){
            return next()
        }
        if(!allowedRole.includes(req.user.hierarchy)){
            return res.status(403).json({message:"Access Denied"})
        }
        next()
    }

}
