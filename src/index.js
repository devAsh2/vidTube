import {app} from './app.js';
import dotenv from 'dotenv';
import mongoDBConnection from './db/index.js';


dotenv.config({
    path:"./.env"
})
const port = process.env.PORT || 8001;


mongoDBConnection().then(() => {
app.listen(port, ()=>{
    console.log(`Server is running on port ${port}`);
})
})
.catch(error => console.log("Mongo DB connection error", error));
