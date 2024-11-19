const Offer = require("../models/offer")
const Category = require("../models/category")
const Product = require("../models/product")
const offerControllers = {

    offer:async(req,res)=>{

    try{

        const offers = await Offer.find()

        res.render("admin/offer",{offers:offers})
    }
    catch(error){
    console.log(error);
    }
},
    addOffer:async(req,res)=>{
        try{

            const {offerName,discountPercentage,validForm,validUntil} = req.body
            console.log(req.body);
           
            const offerExist = await Offer.findOne({ offerName: { $regex: new RegExp(offerName, "i") } });

            const offers = await Offer.find();

            if (offerExist) {
                res.json({
                    success:false,
                    messageName: "Offer already exists",
                
                });
                return;````
            }

            const discountAmount = parseInt(discountPercentage, 10);
            if (isNaN(discountAmount) || discountAmount <= 0) {
                res.json({
                    success:false,
                    messageDis: "Discount percentage must be a positive integer",
                });
                return;
            }

        
            
       const newOffer = new Offer({
        offerName:offerName,
        discountPercentage: discountAmount,
        validFrom: validForm,
        validUntil: validUntil,
       })

       await newOffer.save()

       res.json({success:true,message:"ok done"})
        }catch(error){
            console.log(error);
        }
    },

    offerUlist:async(req,res)=>{
        try{

            let offerId =req.params.id
       const offer = await Offer.findOne({_id:offerId})
       
       if(!offer){
        res.json(404).send("the requested data is not exist")
       }else{
        offer.isActive = !offer.isActive
        await offer.save();
        res.redirect("/admin/offer")
       }

        }catch(error){
            console.log(error);
        }
    },

    offerEdit:async(req,res)=>{
        try{
            let offerId = req.params.id
            const offer = await Offer.findOne({_id:offerId})
            console.log("offer",offer);
            res.render("admin/offerEdit",{offer:offer})

        }catch(error){
            console.log(error);
        }
    },
    offerUpdate:async(req,res)=>{
        try{
            const {offerName,discountPercentage,validForm,validUntil,offerId} = req.body
 console.log("reached");
            const offer = await Offer.findOneAndUpdate(
                {_id:offerId},
                {
                    $set:{
                        offerName:offerName,
                        discountPercentage:discountPercentage,
                        validForm:validForm,
                        validUntil:validUntil, 
                    }
                })
                await offer.save()
                res.json({success:true})
        }catch(error){
            console.log(error);
        }
    },
    offerDelete:async(req,res)=>{
        try{
            let {offerId} = req.body
console.log(offerId);
            const offerDelete = await Offer.findOneAndDelete({_id:offerId})

            if(offerDelete){
                res.json({success:true,message:"offer has been deleted"})
            }else{
                res.status(401).json({success:false,message:"no offerfound"})
            }

        }catch(error){
            console.log(error);
        }
    },

    offerCategory:async(req,res)=>{
        try{
const {selectedOfferId,categoryId}=req.query

const category =  await Category.findOne({_id:categoryId})

if (!category) {
    return res.status(404).json({ error: "Category not found" });
  }
category.offer = selectedOfferId

await category.save()
console.log(category);

res.json({success:true,message:"ok done"})

}catch(error){
            console.log(error);
        }
    },

    offerCategoryRemove:async(req,res)=>{
try{
const categoryId = req.params.categoryId
console.log("fdghjgdhh",categoryId);
const category = await Category.findOne({_id:categoryId})
if(!category){
    return res.status(404).json({message:"no category"})
}
category.offer = null
await category.save()

res.json({success:true,message:"ok done"})
}catch(error){
    console.log(error);
}  
    },
    offerProduct:async(req,res)=>{
        try{
const {selectedOfferId,productId} = req.query
const product = await Product.findOne({_id:productId})

if(!product){
    res.send("Invalid productId or no prouctId")
}

product.offer = selectedOfferId

await product.save()
res.json({success:true,message:"ok done"})
        }catch(error){
            console.log(error);        }
    },
    offerProductRemove:async(req,res)=>{
        try{
            const productId = req.params.productId
            console.log(productId);
            const product = await Product.findOne({_id:productId})
            if(!product){
                res.send("Invaild id or no product")
            }

            product.offer=null
            await product.save()
            res.json({success:true,message:"ok done"})
        }catch(error){
            console.log(error);
        }
    }
}

module.exports=offerControllers