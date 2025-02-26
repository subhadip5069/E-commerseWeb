const nodemailer = require("nodemailer");
const User = require("../../model/user");
const Purchase = require("../../model/purchase");
const Address = require("../../model/address");
const Bill = require("../../model/bill");
const Cart  = require("../../model/cart");
const mongoose = require("mongoose");

class BillController {
    createBill = async (req, res) => {
        try {
            const { purchaseid, addressid, cartItems } = req.body;
            const userId = req.user.id;
    
            const user = await User.findById(userId);
            const purchase = await Purchase.Purchase.findById(purchaseid).populate("items.product");
            const address = await Address.findById(addressid);
    
            if (!user || !purchase || !address) {
                console.log("User, purchase, or address not found.");
                return res.redirect("/login");
            }
    
            const bill = new Bill.Bill({ userid: userId, purchaseid, addressid });
            await bill.save();
            console.log("Bill created successfully:", bill);
    
            await this.sendInvoiceEmail(user.email, purchase);
            console.log("Invoice email sent successfully to:", user.email);
    
            // 🔥 Remove cart items after payment
            if (cartItems && cartItems.length > 0) {
                const deletedItems = await Cart.Cart.deleteMany({ _id: { $in: cartItems } });
                console.log(`Deleted ${deletedItems.deletedCount} cart items.`);
            } else {
                console.log("No cart items to delete.");
            }
    
            return res.redirect("/cart");
        } catch (error) {
            console.error("Error creating bill:", error);
            return res.redirect("/");
        }
    };
    


     sendInvoiceEmail = async (email, purchase) => {
        try {
            const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: "rahulshop4560000@gmail.com",
                    pass: "mnju jqzp vwqn qkmg",
                },
            });
    
            const shippingCharge = (purchase.subtotal < 500 ? (purchase.shippingCharge || 70) : 0); 
            const grandTotal = (purchase.subtotal + purchase.sgst + purchase.gst + shippingCharge).toFixed(2);
            
            const orderTable = `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px; max-width: 600px; margin: auto;">
                    <h2 style="color: #333; text-align: center;">Order Invoice</h2>
                    <p>Dear Customer,</p>
                    <p>Thank you for your purchase! Here is your order summary:</p>
            
                    <!-- Responsive Table Container -->
                    <div style="overflow-x: auto; border-radius: 8px;">
                        <table style="border-collapse: collapse; width: 100%; text-align: left; font-size: 14px;">
                            <thead>
                                <tr style="background-color: #f2f2f2;">
                                    <th style="border: 1px solid #ddd; padding: 8px;">No.</th>
                                    <th style="border: 1px solid #ddd; padding: 8px;">Product</th>
                                    <th style="border: 1px solid #ddd; padding: 8px;">Description</th>
                                    <th style="border: 1px solid #ddd; padding: 8px;">Quantity</th>
                                    <th style="border: 1px solid #ddd; padding: 8px;">SGST (5%)</th>
                                    <th style="border: 1px solid #ddd; padding: 8px;">CGST (5%)</th>
                                    <th style="border: 1px solid #ddd; padding: 8px;">Unit Price</th>
                                    <th style="border: 1px solid #ddd; padding: 8px;">Total Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${purchase.items.map((item, index) => {
                                    const productName = item.product?.name || "Unknown Product";
                                    const description = item.product?.description || "No description available";
                                    const quantity = item.quantity ?? 0;
                                    const unitPrice = item.price ?? 0;
                                    const sgst = unitPrice * 0.05;
                                    const cgst = unitPrice * 0.05;
                                    const totalPrice = quantity * (unitPrice + sgst + cgst);
            
                                    return `
                                        <tr>
                                            <td style="border: 1px solid #ddd; padding: 8px;">${index + 1}</td>
                                            <td style="border: 1px solid #ddd; padding: 8px;">${productName}</td>
                                            <td style="border: 1px solid #ddd; padding: 8px;">${description}</td>
                                            <td style="border: 1px solid #ddd; padding: 8px;">${quantity}</td>
                                            <td style="border: 1px solid #ddd; padding: 8px;">₹${sgst.toFixed(2)}</td>
                                            <td style="border: 1px solid #ddd; padding: 8px;">₹${cgst.toFixed(2)}</td>
                                            <td style="border: 1px solid #ddd; padding: 8px;">₹${unitPrice.toFixed(2)}</td>
                                            <td style="border: 1px solid #ddd; padding: 8px;">₹${totalPrice.toFixed(2)}</td>
                                        </tr>`;
                                }).join("")}
                            </tbody>
                        </table>
                    </div>
            
                    <br>
                    <p><strong>Subtotal:</strong> ₹${(purchase.subtotal ?? 0).toFixed(2)}</p>
                    <p><strong>SGST (5%):</strong> ₹${(purchase.sgst ?? 0).toFixed(2)}</p>
                    <p><strong>CGST (5%):</strong> ₹${(purchase.gst ?? 0).toFixed(2)}</p>
                    <p><strong>Shipping Charge:</strong> ₹${shippingCharge.toFixed(2)}</p>
                    <p><strong>Grand Total:</strong> ₹${grandTotal}</p>
            
                    <br>
                    <p style="font-style: italic; color: #555; text-align: center;">
                        "Thank you for shopping with us! We appreciate your business and look forward to serving you again."
                    </p>
                </div>
            `;
            
            const mailOptions = {
                from: "E-commerce <noreply@example.com>",
                to: email,
                subject: "Your Invoice from RahulShop",
                html: orderTable,
            };
            
    
            await transporter.sendMail(mailOptions);
            
            
            res.redirect("/cart");
        } catch (error) {
            res.session.error_msg = "Failed to send invoice email.";
            res.redirect("/cart");
        }
    };



    
    
    
}

module.exports = new BillController();
