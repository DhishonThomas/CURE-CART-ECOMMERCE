
const addressValidate = async(req,res)=>{

      const { name, mobile, address, pinCode, street, city, state } = req.body;
      console.log(req.body);
      const fieldName = Object.keys(req.body).join(", ");
      console.log(fieldName);

      if (fieldName === "name") {
        if (name.length < 3) {
          return res.status(400).json({
            success: true,
            field: "name",
            message: "Name must be at least 3 characters long",
          });
        } else {
          return res.status(200).json({
            success: false,
            field: "name",
            message: " ",
          });
        }
      }

      if (fieldName === "mobile") {
        const mobileRegex = /^[0-9]{10}$/;
        if (!mobileRegex.test(mobile)) {
          return res.status(400).json({
            success: true,
            field: "mobile",
            message: "Invalid mobile number",
          });
        } else {
          return res.status(200).json({
            success: false,
            field: "mobile",
            message: " ",
          });
        }
      }

      if (fieldName === "pinCode") {
        const pinCodeRegex = /^[0-9]{6}$/;
        if (!pinCodeRegex.test(pinCode)) {
          return res.status(400).json({
            success: true,
            field: "pinCode",
            message: "Invalid pin code",
          });
        } else {
          return res.status(200).json({
            success: false,
            field: "pinCode",
            message: " ",
          });
        }
      }

      if (fieldName === "address") {
        if (!address.trim()) {
          return res.status(400).json({
            success: true,
            field: "address",
            message: "Address is required",
          });
        } else {
          return res.status(200).json({
            success: false,
            field: "address",
            message: "",
          });
        }
      }

      if (fieldName === "street") {
        if (!street.trim()) {
          return res.status(400).json({
            success: true,
            field: "street",
            message: "Street is required",
          });
        } else {
          return res.status(200).json({
            success: false,
            field: "street",
            message: " ",
          });
        }
      }

      if (fieldName === "city") {
        if (!city.trim()) {
          return res.status(400).json({
            success: true,
            field: "city",
            message: "City is required",
          });
        } else {
          return res.status(200).json({
            success: false,
            field: "city",
            message: " ",
          });
        }
      }
      if (fieldName === "state") {
        if (!state.trim()) {
          return res.status(400).json({
            success: true,
            field: "state",
            message: "State is required",
          });
        } else {
          return res.status(200).json({
            success: false,
            field: "state",
            message: " ",
          });
        }
      }

      res.json({ message: "All fields are valid", submit: true });

}

module.exports={
    addressValidate
}