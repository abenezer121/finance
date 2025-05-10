const app = require('./app.ts');

import config from './config/config.ts';
import { connectToDatabase } from './db/main.ts';

const startServer = async () => {
    try {
        console.log("connect to the database")
        await connectToDatabase() 
        const PORT = config.port
        app.listen(PORT , ()=> {
            console.log(`server is running on port ${PORT}`)
        })
    }catch(error){
        console.error("Failed to start the server" , error)
    }
}


startServer();

