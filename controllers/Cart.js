const Cart = require("../models/Cart")
const mongoose = require('mongoose')

exports.fetchCartController = async(req, res) => {
    const { userId } = req.params;

    try {
        const cart = await Cart.findOne({ userId }).populate('items.courseId');

        if(!cart) {
            return res.status(200).json({
                items: []
            });
        }
        res.status(200).json(cart);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Failed to fetch cart" });
    }
}

exports.addToCartController = async (req, res) => {
    const { userId } = req.params;
    const { courseId, price } = req.body;

    // Validate userId and courseId
    // if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(courseId)) {
    //     return res.status(400).json({ error: "Invalid userId or courseId" });
    // }

    try {
        let cart = await Cart.findOne({ userId });

        if (cart) {
            // Check if the course is already in the cart
            const itemExists = cart.items.some(item => item.courseId.equals(courseId));
            if (itemExists) {
                return res.status(400).json({ message: "Course already in cart" });
            }
            // Add new course to the cart
            cart.items.push({ courseId: mongoose.Types.ObjectId(courseId), price });
        } else {
            // Create a new cart
            cart = new Cart({
                userId: mongoose.Types.ObjectId(userId),
                items: [{ courseId: mongoose.Types.ObjectId(courseId), price }],
            });
        }

        await cart.save();
        console.log("Cart updated successfully:", cart);
        res.status(200).json(cart);
    } catch (error) {
        console.error("Error saving cart:", error);
        res.status(500).json({ error: "Failed to add course to cart" });
    }
};


exports.removeFromCartController = async (req, res) => {
    const { userId } = req.params;
    const { courseId } = req.body;

    try {
        const cart = await Cart.findOne({ userId });
        if (cart) {
            const itemIndex = cart.items.findIndex(item => item.courseId.equals(courseId));
            if (itemIndex > -1) {
                // Remove the course
                cart.items.splice(itemIndex, 1);
                await cart.save();
                return res.status(200).json(cart);
            } else {
                return res.status(404).json({ message: "Course not found in cart" });
            }
        } else {
            return res.status(404).json({ message: "Cart not found" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to remove course from cart" });
    }
};
