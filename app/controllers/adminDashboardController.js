const Order = require("../models/order")
const PDFDocument = require("pdfkit");


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

};

module.exports = adminDashboardController;