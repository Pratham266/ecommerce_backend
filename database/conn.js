const mongoose = require('mongoose');
mongoose.set('strictQuery',false);

mongoose.connect(
    `mongodb://localhost:27017/${process.env.DB_NAME}`,{
        useNewUrlParser: true,
        useUnifiedTopology: true
    },(err)=>{
        err ? console.log("Error not connected tor the Data base"):
            console.log("Connected to the database ",process.env.DB_NAME);
    }
)