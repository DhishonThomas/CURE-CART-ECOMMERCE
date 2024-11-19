const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  offerName:{
    type:String,
    required:true
  },
  discountPercentage: {
    type: Number,
    required: true
  },
  validFrom: {
    type: Date,
    required: true
  },
  validUntil: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

const Offer = mongoose.model('Offer', offerSchema);

module.exports=Offer