const jwt = require('jsonwebtoken');
const User = require('../modal/userSchema');

const Authenticate = async(req,res,next) =>{
    try{
        console.log("in middlwate : ",req.cookies.jwtoken);
        const token =  req.cookies.jwtoken;
        if(token==null){
            return res.status(400).send({message:"user is not login"})
            
        }else{
        const verfyToken = jwt.verify(token,process.env.TOKEN_PASS);
        const rootUser = await User.findOne({_id:verfyToken._id,"tokens.token":token});
        //console.log("in middlwate : ",rootUser);
        if(!rootUser){
            throw new  Error("user not found");
        }else{
            req.token = token;  
            req.rootUser = rootUser;
            req.userId = rootUser._id;
            // req.userType = rootUser.customer;
            next();
        }
        } 
    }catch(error){
        console.log(error);
        return res.status(401).send("unauthorized");
    }
}
module.exports = Authenticate;