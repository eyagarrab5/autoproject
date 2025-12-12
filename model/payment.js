const mongo=require('mongoose')
const schema=mongo.Schema

const paymentSchema=new schema({
    userId:{
        type:String,
        required:true
    },
    orderId:{
        type:String,
        required:true
    },
    amount:{
        type:Number,
        required:true
    },
    paymentMethod:{
        type:String,
        required:true
    },
    paymentStatus:{
        type:String,
        required:true
    },
    createdAt:{
        type:Date,
        default:Date.now
    },
    transactions:[{
        type:schema.Types.ObjectId,
        ref:'paymentTransaction'
    }]
})
module.exports=mongo.model('payment',paymentSchema)