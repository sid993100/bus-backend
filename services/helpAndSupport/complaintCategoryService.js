import ComplaintCategory from "../../models/complaintCategoryModel.js";


export const addComplaintCategory= async (req,res)=>{
    try {
        const {name,description=""}= req.body; 
        const existingCategory= await ComplaintCategory.findOne({name:name.toUpperCase()});
        if(existingCategory){
            return res.status(400).json({
                success:false,
                error:"Complaint Category with this name already exists"
            })
        }
        const category= await ComplaintCategory.create({
            name,
            description
        });
        return  res.status(201).json({
            success:true,
            data:category
        })
    }catch(error){
        res.status(500).json({
            success:false,
            error:error.message
        })
    }
}

export const getComplaintCategories= async (req,res)=>{
    try {
        const {page=1,limit=10}= req.query;
        const skip= (page-1)*limit;
        const categories= await ComplaintCategory.find().skip(skip).limit(limit);   
        return res.status(200).json({
            success:true,
            data:categories
        }) 
    }catch(error){
        res.status(500).json({
            success:false,  
            error:error.message
        })
    }       
}

export const updateComplaintCategory= async (req,res)=>{ 
    try {
        const {id}= req.params;
        const data= req.body; 
        const category= await ComplaintCategory.findByIdAndUpdate(id,data,{new:true});
        if(!category){
            return res.status(404).json({
                success:false,
                error:"Complaint Category not found"
            })
        }
    } catch (error) {
        res.status(500).json({
            success:false,  
            error:error.message
        })
    }
}