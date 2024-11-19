const Order = require("../models/order")
const PDFDocument = require("pdfkit");
const Product = require("../models/product");
const Category = require("../models/category");
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function calculateWeeklySalesData() {
  const currentDate = new Date();
  console.log("currentDate",currentDate);
  const oneWeekAgo = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000); 
  console.log("oneWeekAgo",oneWeekAgo);
  const weeklySalesData = await Order.aggregate([
      {
          $match: {
              createdAt: { $gte: oneWeekAgo }, 
              "items.orderStatus": "Delivered" 
          }
      },
      {
          $group: {
              _id: { $week: "$createdAt" }, 
              totalSales: { $sum: "$totalAmount" } 
          }
      }
  ]);

  return weeklySalesData;
}
async function calculateMonthlySalesData() {
  const currentDate = new Date();
  const oneMonthAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1); 
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0); 

  const monthlySalesData = await Order.aggregate([
      {
          $match: {
              createdAt: { $gte: oneMonthAgo, $lte: lastDayOfMonth }, 
              "items.orderStatus": "Delivered" 
          }
      },
      {
          $group: {
              _id: { $month: "$createdAt" }, 
              totalSales: { $sum: "$totalAmount" } 
          }
      }
  ]);

  return monthlySalesData;
}
async function calculateYearlySalesData() {
  const currentDate = new Date();
  const oneYearAgo = new Date(currentDate.getFullYear() - 1, 0, 1); 
  const lastDayOfYear = new Date(currentDate.getFullYear(), 11, 31); 

  const yearlySalesData = await Order.aggregate([
      {
          $match: {
              createdAt: { $gte: oneYearAgo, $lte: lastDayOfYear }, 
              "items.orderStatus": "Delivered" 
          }
      },
      {
          $group: {
              _id: { $year: "$createdAt" }, 
              totalSales: { $sum: "$totalAmount" } 
          }
      }
  ]);

  return yearlySalesData;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function calculateMonthlyEarnings() {
  const currentDate = new Date();
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  const monthlyEarningsData = await Order.aggregate([
      { $match: {
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
          "items.orderStatus": "Delivered"
      }},
      { $group: { _id: null, monthlyEarnings: { $sum: "$totalAmount" }}}
  ]);
  return monthlyEarningsData.length > 0 ? monthlyEarningsData[0].monthlyEarnings : 0;
}

async function calculateTotalProductCount() {
  const totalProductCount = await Product.countDocuments();
  return totalProductCount;
}
 
async function calculatePendingOrders() {
  const pendingOrdersCount = await Order.countDocuments({
      "items.orderStatus": { $in: ["Order"] }
  });
  return pendingOrdersCount;
}

async function calculateTotalRevenue() {
  const revenueData = await Order.aggregate([
      { $match: { "items.orderStatus": "Delivered" }},
      { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" }}}
  ]);
  return revenueData.length > 0 ? revenueData[0].totalRevenue : 0;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const adminDashboardController = {
  salesReport: async (req, res) => {
    try {
const page = parseInt(req.query.page) || 1;

const perPage = 6;

const totalOrders = await Order.find({ "items.orderStatus": "Delivered" });
const totalPages = Math.ceil(totalOrders / perPage);
      
const orders = await Order.find({ "items.orderStatus": "Delivered" })
  .populate("user")
  .populate("items.product")
  .sort("-createdAt")
  .skip((page - 1) * perPage)
  .limit(perPage);
      // console.log(orders);

      res.render("admin/salesReport", {
        orders: orders,
        totalPages: totalPages,
        currentPage: page,
        dates:''
      });
    } catch (error) {
      console.log(error);
    }
  },
  sales: async (req, res) => {
    try {
      const toDate = req.body.toDate ? new Date(req.body.toDate) : new Date();
      const fromDate = req.body.fromDate
        ? new Date(req.body.fromDate)
        : new Date();

        const page = parseInt(req.query.page) || 1;
        const perPage = 6;

        const totalOrders = await Order.find({
          "items.orderStatus": "Delivered",
        }).countDocuments() 

        const totalPages = Math.ceil(totalOrders / perPage);


      const orders = await Order.find({
        "items.orderStatus": "Delivered",
        createdAt: {
          $gte: new Date(fromDate),
          $lte: new Date(toDate.getTime() + 24 * 60 * 60 * 1000),
        },
      })
        .populate("user")
        .populate("items.product")
        .skip((page - 1) * perPage)
        .limit(perPage);

      // .sort("-createdAt");

      res.render("admin/salesReport", {
        orders: orders,
        dates: [fromDate, toDate],
        totalPages: totalPages,
        currentPage: page,
      });
    } catch (error) {
      console.log(error);
    }
  },
salesReportDownload: async (req, res) => {
  try {
    const { dates } = req.query;
    const datesArray = dates.split(",");
    const fromDate = new Date(datesArray[0]);
    const toDate = new Date(datesArray[1]);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return res.status(400).send("Invalid date format");
    }

    const orders = await Order.find({
      "items.orderStatus": "Delivered",
      createdAt: {
        $gte: fromDate,
        $lte: new Date(toDate.getTime() + 24 * 60 * 60 * 1000),
      },
    })
      .populate("user")
      .populate("items.product");

    const doc = new PDFDocument({ size: [900, 800] });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=report.pdf"
    );
    doc.pipe(res);

    doc.font("Helvetica-Bold").fontSize(12);
    doc.text("Order ID", 50, 50);
    doc.text("Delivery Address", 150, 50);
    doc.text("Products", 300, 50);
    doc.text("Total", 450, 50);
    doc.text("Products Count", 550, 50);
    doc.text("Order Date", 650, 50);
    doc.text("Payment Method", 750, 50);

    let y = 80;
    doc.font("Helvetica").fontSize(10);
    orders.forEach((order) => {
      let maxHeight = 0;
      order.items.forEach((item) => {
        const productNameHeight = doc.heightOfString(
          item.product.productName,
          { width: 100 }
        );
        const addressHeight = doc.heightOfString(
          `${order.shippingAddress.name}\n${order.shippingAddress.mobile}\n${order.shippingAddress.address}\n${order.shippingAddress.pinCode}\n${order.shippingAddress.street}\n${order.shippingAddress.city}\n${order.shippingAddress.state}`
        );
        maxHeight = Math.max(maxHeight, productNameHeight, addressHeight);
      });

      order.items.forEach((item) => {
        const productNameHeight = doc.heightOfString(
          item.product.productName,
          { width: 100 }
        );
        const addressHeight = doc.heightOfString(
          `${order.shippingAddress.name}\n${order.shippingAddress.mobile}\n${order.shippingAddress.address}\n${order.shippingAddress.pinCode}\n${order.shippingAddress.street}\n${order.shippingAddress.city}\n${order.shippingAddress.state}`
        );
        const maxHeightDiff = maxHeight - productNameHeight;
        doc.text(order.orderId, 50, y);
        doc.text(
          `${order.shippingAddress.name}\n${order.shippingAddress.mobile}\n${order.shippingAddress.address}\n${order.shippingAddress.pinCode}\n${order.shippingAddress.street}\n${order.shippingAddress.city}\n${order.shippingAddress.state}`,
          150,
          y
        );
        doc.text(item.product.productName, 300, y, { width: 100 });
        doc.text(`₹ ${item.price}`, 450, y + maxHeightDiff);
        doc.text(item.quantity.toString(), 550, y + maxHeightDiff);
        doc.text(
          new Date(order.createdAt).toISOString().split("T")[0],
          650,
          y + maxHeightDiff
        );
        doc.text(order.paymentMethod, 750, y + maxHeightDiff);
        doc.moveTo(50, y + maxHeight + 10).lineTo(800, y + maxHeight + 10).stroke();
        y += maxHeight + 20; 
      });
    });

    doc.end();
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
},
salesData: async (req, res) => {
  try {
    const weeklySalesData = await calculateWeeklySalesData();

    const monthlySalesData = await calculateMonthlySalesData();

    const yearlySalesData = await calculateYearlySalesData();
console.log("weeklySalesData",weeklySalesData);
console.log("monthlySalesData",monthlySalesData);

    res.json({
        weeklySalesData:weeklySalesData,
        monthlySalesData:monthlySalesData,
        yearlySalesData:yearlySalesData
    });

} catch (error) {
    console.error("Error rendering admin dashboard:", error);
    res.status(500).send("Internal Server Error");
}

},
salesDataOnes:async(req,res)=>{
  try {
    const totalRevenue = await calculateTotalRevenue();
    const pendingOrdersCount = await calculatePendingOrders();
    const totalProductCount = await calculateTotalProductCount();
    const monthlyEarnings = await calculateMonthlyEarnings();
console.log("reached ro salesdata ones",totalRevenue);
    res.json({
        totalRevenue,
        pendingOrdersCount,
        totalProductCount,
        monthlyEarnings
    });
} catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    res.status(500).send("Internal Server Error");
}
},
 topCounts:async (req, res) => {
  try {
    console.log("topCounts reached");

    const productCounts = await Order.aggregate([
      {
        $unwind: "$items"
      },
      {
        $match: {
          "items.orderStatus": "Delivered" 
        }
      },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "productInfo"
        }
      },
      {
        $unwind: "$productInfo"
      },
      {
        $group: {
          _id: "$productInfo.productName",
          count: { $sum: 1 }
        }
      }
    ]);
    

    const categoryCounts = await Order.aggregate([
      {
        $unwind: "$items"
      },
      {
        $match: {
          "items.orderStatus": "Delivered" 
        }
      },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "productInfo"
        }
      },
      {
        $unwind: "$productInfo"
      },
      {
        $lookup: {
          from: "categories", 
          localField: "productInfo.category",
          foreignField: "_id",
          as: "categoryInfo"
        }
      },
      {
        $unwind: "$categoryInfo"
      },
      {
        $group: {
          _id: "$categoryInfo.category_name",
          count: { $sum: 1 }
        }
      }
    ]);
    
    

    const brandCounts = await Order.aggregate([
      {
        $unwind: "$items"
      },
      {
        $match: {
          "items.orderStatus": "Delivered"
        }
      },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "productInfo"
        }
      },
      {
        $unwind: "$productInfo"
      },
      {
        $group: {
          _id: "$productInfo.brand",
          count: { $sum: 1 }
        }
      }
    ]);
    

    const topProducts = productCounts.sort((a, b) => b.count - a.count).slice(0, 10);
    const topCategories = categoryCounts.sort((a, b) => b.count - a.count).slice(0, 10);
    const topBrands = brandCounts.sort((a, b) => b.count - a.count).slice(0, 10);

    res.json({ success: true, topProducts, topCategories, topBrands });
  } catch (error) {
    console.error("Error in topCounts:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}
}

module.exports = adminDashboardController;