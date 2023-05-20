const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const cookieParser = require("cookie-parser");

require("../database/conn");
const authenticate = require("../middleware/authenticate");
const User = require("../modal/userSchema");
const Item = require("../modal/itemSchema");
const Cart = require("../modal/cartSchema");

router.get("/", (req, res, next) => {
  console.log(req.params);
  res.send({ message: "Serve is started" });

});

//for registration
router.post("/signup", async (req, res) => {
  const { name, email, phone, customer, password, cpassword } = req.body;
  // console.log(req.body);
  if (!name || !email || !phone || !customer || !password || !cpassword) {
    return res.status(422).json({ error: "Please fill all the fields" });
  }
  try {
    const UserExist = await User.findOne({ email: email });
    if (UserExist) {
      return res.status(422).json({ error: "Email already exist." });
    } else if (password != cpassword) {
      return res.status(422).json({ error: "Password are not matching." });
    } else {
      const user = new User({
        name,
        email,
        phone,
        customer,
        password,
        cpassword,
      });

      const userRegister = await user.save();

      if (userRegister) {
        res.status(201).json({ message: "User register successful" });
      }
    }
  } catch (err) {
    console.log(err);
  }
});

//for login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(req.body);
    if (!email || !password) {
      return res.status(422).json({ error: "please fill the data" });
    }
    const userFind = await User.findOne({ email: email });

    if (userFind) {
      const isMatch = await bcrypt.compare(password, userFind.password);

      if (isMatch) {
        token = await userFind.generateAuthToken();

        res.cookie("jwtoken", token, {
          expires: new Date(Date.now() + 25892000000),
          httpOnly: true,
        });
        //console.log(userFind);
        res.status(200).json(userFind);
      } else {
        res.status(422).json({ error: "“Invalid Credentials!" });
      }
    } else {
      res.status(422).json({ error: "“Invalid Credentials!" });
    }
  } catch (err) {
    console.log(err);
  }
});

router.use(cookieParser());

//for About
router.get("/about", authenticate, async (req, res) => {
  res.send(req.rootUser);
});

//for app.js it's check for user is logged in or not for dispay a logout,login,signup.
router.get("/check", authenticate, async (req, res) => {
  res.send(req.rootUser);
});

//for home page
router.get("/getdata", authenticate, async (req, res) => {
  res.send(req.rootUser);
});

//logout
router.get("/logout", (req, res) => {
  res.clearCookie("jwtoken", { path: "/" });
  res.status(201).send("user logout succussfully.");
});

const multer = require("multer");
const upload = multer({ dest: "uploads/" });

//for add the item on the website
router.post(
  "/additems",
  authenticate,
  upload.single("pimage"),
  async (req, res) => {
    console.log("inbackend", req.file);
    const imgUrl = req.file.path;
    const { pname, pprice, pcategory, pdescription } = req.body;

    try {
      if (!pname || !pprice || !pcategory || !pdescription || !imgUrl) {
        return res.status(422).json({ error: "Please fill all the fields" });
      } else {
        const newItem = new Item({
          owner: req.userId,
          name: pname,
          description: pdescription,
          category: pcategory,
          price: pprice,
          imageUrl: imgUrl,
        });
        const add = await newItem.save();
        if (add) {
          return res.status(201).send(newItem);
        } else {
          return res.status(400).send({ message: "error" });
        }
      }
    } catch (error) {
      res.status(400).send({ message: "error" });
    }
  }
);

router.put(
  "/updatedata/:itemId",
  authenticate,
  upload.single("pimage"),
  async (req, res) => {
    const itemId = req.params.itemId;
    const { pname, pprice, pcategory, pdescription } = req.body;

    try {
      const item = await Item.findById(itemId);
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }

      // Update the item properties
      item.name = pname;
      item.price = pprice;
      item.category = pcategory;
      item.description = pdescription;

      // Check if a new image is provided
      if (req.file) {
        const imgUrl = req.file.path;
        item.imageUrl = imgUrl;
      }

      // Save the updated item
      const updatedItem = await item.save();
      res.status(200).json({ updatedItem });
    } catch (error) {
      res.status(500).json({ error: "Failed to update item" });
    }
  }
);

//fetchb all the items from the Item table
router.get("/items", async (req, res) => {
  try {
    const items = await Item.find({});
    res.status(200).send(items);
  } catch (error) {
    res.status(400).send(error);
  }
});

//item delete from the application
router.delete("/itemdelete/:itemId", authenticate, async (req, res) => {
  const itemId = req.params.itemId;
  try {
    const item = await Item.findOne({ _id: itemId });
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }
    await Item.deleteOne({ _id: itemId });
    res.status(200).json({ message: "Item deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting item" });
  }
});

//delete item from the cart
router.delete("/cartdelete", authenticate, async (req, res) => {
  const owner = req.userId;
  const itemId = req.query.itemId;
  try {
    let cart = await Cart.findOne({ owner });
    const itemIndex = cart.items.findIndex((item) => item.itemId == itemId);
    if (itemIndex > -1) {
      let item = cart.items[itemIndex];
      cart.bill -= item.quantity * item.price;
      if (cart.bill < 0) {
        cart.bill = 0;
      }
      cart.items.splice(itemIndex, 1);
      cart.bill = cart.items.reduce((acc, curr) => {
        return acc + curr.quantity * curr.price;
      }, 0);
      cart = await cart.save();

      res.status(200).send(cart);
    } else {
      res.status(400).send({ message: "Item is not found" });
    }
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: "item is not delete" });
  }
});

//Add product to the cart
// router.post("/addcart", authenticate, async (req, res) => {
//   const { owner, itemId, quantity } = req.body;
//   console.log("Owner is : ", owner);
//   try {
//     const cart = await Cart.findOne({ owner });
//     const item = await Item.findOne({ _id: itemId });
//     if (!item) {
//       console.log("!item");
//       res.status(404).send({ message: "item not found" });
//       return;
//     }

//     const price = item.price;
//     const name = item.name;

//     //if cart already exists for user
//     if (cart) {
//       const itemIndex = cart.items.findIndex((item) => item.itemId == itemId);
//       console.log("itemindex : ", itemIndex);
//       //check if product exist or not
//       if (itemIndex > -1) {
//         let product = cart.items[itemIndex];
//         product.quantity += quantity;
//         cart.bill = cart.items.reduce((acc, curr) => {
//           return acc + curr.quantity * curr.price;
//         }, 0);

//         cart.items[itemIndex] = product;
//         await cart.save();
//         console.log("cart is made already");
//         return res.status(201).send(cart);
//       } else {
//         cart.items.push({ itemId, name, quantity, price });
//         cart.bill = cart.items.reduce((acc, curr) => {
//           return acc + curr.quantity * curr.price;
//         }, 0);
//         await cart.save();
//         console.log("Product is new");
//         return res.status(201).send(cart);
//       }
//     } else {
//       //no cart exists, create one
//       const newCart = await Cart.create({
//         owner,
//         items: [{ itemId, name, quantity, price }],
//         bill: quantity * price,
//       });
//       console.log("New cart in making");
//       return res.status(201).send(newCart);
//     }
//   } catch (error) {
//     console.log("Something went wrong");
//     console.log(error);
//     return res.status(500).send("something went wrong");
//   }
// });

router.post("/addcart", authenticate, async (req, res) => {
  const { owner, itemId, quantity } = req.body;

  try {
    const item = await Item.findOne({ _id: itemId });
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    const price = item.price;
    const name = item.name;

    const filter = { owner };
    const update = {
      $addToSet: {
        items: { itemId, name, quantity, price }
      },
      $inc: { bill: price * quantity }
    };

    const options = { upsert: true, new: true };
    const cart = await Cart.findOneAndUpdate(filter, update, options);

    return res.status(201).json(cart);
  } catch (error) {
    console.log("Something went wrong");
    console.log(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
});


//get cart items
router.get("/cart", authenticate, async (req, res) => {
  const owner = req.userId;
  try {
    const cart = await Cart.findOne({ owner });

    if (cart && cart.items.length > 0) {
      res.status(201).send(cart);
    } else {
      res.status(200).send({ message: "The cart is empty" });
    }
  } catch (error) {
    res.status(500).send(error);
  }
});

// dashboard of seller
router.get("/dashboard", authenticate, async (req, res) => {
  const owner = req.userId;
  try {
    const items = await Item.find({ owner: owner });
    res.status(200).json(items);
  } catch (error) {
    res.status(500).send(error);
  }
});

//search product
router.post("/searchproduct", async (req, res) => {
  try {
    var search = req.body.search;
    var product_data = await Item.find({
      name: { $regex: ".*" + search + ".*", $options: "i" },
    });
    // var product_data = await Item.find({ "name":search});
    if (product_data.length > 0) {
      res.status(200).send(product_data);
    } else {
      res.status(201).send({ message: "Product not found" });
    }
  } catch (error) {
    res.status(400).send({ message: "error in searching" });
  }
});

//filter items by category
router.post("/filretbycategory", async (req, res) => {
  const category = req.body.cate;
  try {
    const items = await Item.find({ category });
    if (items.length === 0) {
      return res.status(404).json({ message: "No items found" });
    }
    res.status(200).send(items);
  } catch (error) {
    res.status(500).json({ message: "server error" });
  }
});

//send a email usinf nodemailer
const nodemailer = require("nodemailer");
router.post("/mail", authenticate, async (req, res) => {
  const orderItems = req.body.items;
  const partyEmail = req.rootUser.email;
  const bill = req.body.bill;
  const owner = req.userId;
  // connect with the smtp server
  let transporter = await nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "raoecommerce266@gmail.com",
      pass: "rcgmlpfpfokuzlau",
    },
  });

  let htmlBody = "";
  Object.keys(orderItems).map((key) => {
    const item = orderItems[key];
    htmlBody += `<tr>
                 <td>${item.name}</td>
                 <td>${item.quantity}</td>
                 <td>${item.price}</td>
                 <td>${item.quantity * item.price}</td>
                 </tr>
                 `;
  });

  let details = {
    from: "raoecommerce266@gmail.com",
    to: partyEmail,
    subject: "Bill Of Your Order in RaoEcommerce",
    html: `<p>Thank you for your order!</p>
          <p>Here is the summary of your order:</p>
          <table>
          <thead>
          <tr>
          <th>Product Name</th>
          <th>Quantity</th>
          <th>Price</th>
          <th>Total</th>
          </tr>
          </thead>
          ${htmlBody}
          </table>
          <h3>Total bill: ${bill} ₹</h3>`,
  };

  transporter.sendMail(details, async (err) => {
    if (err) {
      res.status(400).json("email not sent!");
    } else {
      try {
        await Cart.findOneAndDelete({ owner });
        res.status(200).json("email send successfully");
      } catch (error) {
        res.status(400).json("email not sent!");
      }
    }
  });
});

module.exports = router;
