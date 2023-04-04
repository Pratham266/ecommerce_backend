const mongoose = require('mongoose');
const bcrypt = require('bcryptjs')
const jwt  = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        require: true
    },
    email:{
        type:String,
        require:true
    },
    phone:{
        type:Number,
        require: true,
    },
    customer:{
        type: String, 
        possibleValues: ['buyer','seller']
    },
    password:{
        type: String,
        required: true
    },
    cpassword:{
        type: String,
        required: true
    },
    date:{
        type: Date,
        default:Date.now
    },
    tokens:[
        {
            token:{
                type:String,
                required: true
            }
        }
    ]
})

//Hashing the password
userSchema.pre('save',async function(next){
    if(this.isModified('password')){
        this.password = await bcrypt.hash(this.password,12);
        this.cpassword  =await bcrypt.hash(this.cpassword,12);
    }
    next();
});

userSchema.methods.generateAuthToken = async function(){
    try{
        let token = jwt.sign({_id:this._id},"MYNAMEISPRATHAMAYUSHIREAKABENJANAKKBHAIMANIALALEELABENXYZWSDGDGDGDMYNAMEISPRATHAMAYUSHIREAKABENJANAKKBHAIMANIALALEELABENXYZWSDGDGDGD");
        this.tokens = this.tokens.concat({token:token});
        await this.save();
        return token;
    }catch(error){
        console.log(error);
    }   
}

const User = mongoose.model('USER',userSchema);
module.exports = User;