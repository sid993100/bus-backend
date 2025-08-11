import bcrypt from "bcrypt"

export default async function(password,thisPassword){
 return await bcrypt.compare(password,thisPassword)
 
}