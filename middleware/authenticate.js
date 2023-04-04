const jwt = require('jsonwebtoken');
const User = require('../modal/userSchema');

const Authenticate = async(req,res,next) =>{
    try{
        const token =  req.cookies.jwtoken;
        if(token==null){
            res.status(201).send({message:"user is not login"})
            next();
            
        }else{
        const verfyToken = jwt.verify(token,process.env.TOKEN_PASS);
        const rootUser = await User.findOne({_id:verfyToken._id,"tokens.token":token});
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
        res.status(401).send("unauthorized");
        console.log(error);
    }
}
module.exports = Authenticate;