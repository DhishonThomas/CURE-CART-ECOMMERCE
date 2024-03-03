const Cart = require("../models/cartItem")

const checkOutMiddileware = async (req,res,next)=>{

    try{
        const userId = res.locals.user
        const  cartItems= await Cart.find({_id:userId})

        if(!cartItems) {
            res.redirect("/shop")
        }else{
        next();

        }

    }catch(error){
        console.log(error);
    }
}  


module.exports = checkOutMiddileware