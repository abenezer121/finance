import mongoose , {Document} from 'mongoose'

export interface IOtp extends Document {
    identifier : string // phone or email
    otp : string, 
    expiredAt :Date, 
    isUsed : boolean
}


const OtpSchema = new mongoose.Schema({
    identifier : {
        type : String, 
        required :true,
    },
    otp : {
        type : String, 
        required : true, 
    },
    expiresAt : {
        type : Date , 
        required : true , 
        expires: 180 // auto delete after 3 minutes
    },
    isUsed : {
        type : Boolean, 
        default :false,
    }
})

export default mongoose.model<IOtp>('Otp' , OtpSchema)
