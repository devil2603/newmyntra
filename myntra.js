const express = require("express");
const con = require("./databse");
const auth = require("./server")

const router = express.Router();

const getnew = async (req, res, next) => {
  console.log("ffffnode");
  try {
    const limit = req.query.limit;
    const offset = req.query.offset;

    const queryString =
      "SELECT product_id, `name`, `type`, `description`, `price`, `discount`, `is_active`, `created_at` FROM products LIMIT ? OFFSET ?";
    const sizeQueryString =
      "SELECT `sizes`.`name` FROM `product_in_sizes` RIGHT JOIN `products` ON `products`.`product_id` = `product_in_sizes`.`product_id` LEFT JOIN `sizes` ON `sizes`.`sizes_id` = `product_in_sizes`.`sizes_id`";

    const [results] = await con.promise().execute(queryString, [limit, offset]);
    const [sizeResults] = await con.promise().execute(sizeQueryString);

    const responseBody = {
      message: " product list ",
      products: results,
      totalProducts: (
        await con.promise().execute("SELECT COUNT(*) as count FROM products")
      )[0][0].count,
      sizes: sizeResults,
    };

    res.status(200).send(responseBody);
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    // console.log(req.params);
    if (!req.params) {
      res.status(400).send({
        message: "bad request",
      });
    }
    let queryString = `SELECT name,email from users where users_id = ?`;
    const [result] = await con.promise().execute(queryString, [id]);

    if (result.length === 0) {
      res.status(404).send({
        message: "User not found",
      });
    }
    res.status(200).send({
      message: "Successfully retrieved user",
      result,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error while getting user",
      error,
    });
  }
};

//GET PRODUCTS
const getAllProducts = async (req, res) => {
  try {
    const { start_price, end_price, type, limit, offset, sort, sortType } =
      req.query;

    if (!req.query) {
      return res.status(400).send({
        message: "Bad request",
      });
    }

    let whereArray = [];
    let whereData = [];
    let sortArray = [];

    if (start_price && end_price) {
      whereArray.push("price between ? and ?");
      whereData.push(start_price);
      whereData.push(end_price);
    }

    if (type) {
      whereArray.push("type = ?");
      whereData.push(type);
    }

    if (sort && sortType) {
      sortArray.push(`${sort} ${sortType}`);
    }

    let sortString = "";
    if (sortArray.length) {
      sortString = `ORDER BY ${sortArray.join(", ")}`;
    }

    let whereString = "";
    if (whereArray.length) {
      whereString = `WHERE ${whereArray.join(" and ")}`;
    }

    let queryString = `SELECT product_id, name, description, rating, price, is_active, type FROM products ${whereString} ${sortString} LIMIT ? OFFSET ?`;

    const [result] = await con
      .promise()
      .execute(queryString, [...whereData, limit,offset]);

    let countQueryString = `SELECT COUNT(product_id) AS count FROM products ${whereString}`;
    const [countResult] = await con
      .promise()
      .execute(countQueryString, whereData);

    const responseBody = {
      message: "Successfully got all products",
      list: result,
      count: countResult[0].count,
    };
    res.status(200).send(responseBody);
  } catch (error) {
    console.error(error);
    res.status(500).send({
      message: "Error while getting products",
      error: error.message,
    });
  }
};

const getProductById = async (req, res) => {    
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).send({
        message: "Bad request",
      });
    }

    let queryString = `SELECT P.product_id AS productId, P.name AS productName, P.description AS description,
    P.rating AS rating, P.price AS price, P.is_active AS isActive,
   P.type AS type, S.name AS sizeName
   FROM products AS P
   INNER JOIN product_in_sizes AS PS ON P.product_id = PS.product_id
   INNER JOIN sizes AS S ON PS.sizes_id = S.sizes_id
   WHERE P.product_id = ?`;

    const [result] = await con.promise().execute(queryString, [id]);

    if (result.length === 0) {
      return res.status(404).send({
        message: "Product not found",
      });
    }

    res.status(200).send({
      message: "Successfully retrieved product",
      result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      message: "Error while getting product",
    });
  }
};

//WISHLIST
const getWishlist = async (req, res) => {
  try {
    const { users_id } = req.headers; 
    console.log(users_id)
    if (!users_id) {
      return res.status(400).send({
        message: "Bad request",
      });
    }
    let queryString = `SELECT U.users_id, U.name AS userName, P.name AS productName,
      P.description AS description, P.price AS price,
      P.rating AS rating, W.quantity, W.is_active
FROM wishlists AS W
INNER JOIN products AS P ON P.product_id = W.product_id
INNER JOIN users AS U ON U.users_id = W.users_id
WHERE U.users_id = ?;
`;
    const [result] = await con.promise().execute(queryString, [users_id]); 

    if (result.length === 0) {
      return res.status(404).send({
        message: "Nothing in the wishlist",
      });
    }

    let countQueryString = `SELECT COUNT(U.users_id) AS count
    FROM wishlists AS W
    INNER JOIN products AS P ON P.product_id = W.product_id
    INNER JOIN users AS U ON U.users_id = W.users_id
    WHERE U.users_id = ?`;
    const [countResult] = await con
      .promise()
      .execute(countQueryString, [users_id]);

    const responseBody = {
      message: "Successfully got wishlist",
      list: result,
      count: countResult[0].count,
    };
    res.status(200).send(responseBody);
  } catch (error) {
    console.error(error);
    res.status(500).send({
      message: "Error while getting wishlist",
      error: error.message,
    });
  }
};

//add wishlist
const addWishlist = async (req, res) => {
  try {
    const { users_id, product_id, quantity ,is_active} = req.body;
    if (!users_id || !product_id || !is_active || !quantity) {
      return res.status(400).send({
        message: "Bad request",
      });
    }

    let queryString = `INSERT INTO wishlists (users_id, product_id, quantity, is_active)
                         VALUES (?, ?, ?, ?)`;
    const [result] = await con
      .promise()
      .execute(queryString, [users_id, product_id, is_active, quantity]);

    res.status(201).send({
      message: "Wishlist created successfully",
      result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      message: "Error while creating wishlist",
      error: error.message,
    });
  }
};

//update wishlist
const updateWishlist = async (req, res) => {
  try {
    const { users_id } = req.params;
    const { quantity } = req.body;
    

    console.log(req.params);
    console.log(req.body);
    

    if (!users_id || !quantity) {
      return res.status(400).send({
        message: "Bad request",
      });
    }

    let queryString = `UPDATE wishlists
                         SET quantity = ?
                         WHERE users_id = ?`;
    const [result] = await con
      .promise()
      .execute(queryString, [quantity, users_id]);

    // Get count of items in wishlist
    let countQueryString = `SELECT COUNT(users_id) AS count
                              FROM wishlists
                              WHERE users_id = ?`;
    const [countResult] = await con
      .promise()
      .execute(countQueryString, [users_id]);

    const responseBody = {
      message: "Wishlist updated successfully",
      count: countResult[0].count,
    };
    res.status(200).send(responseBody);
  } catch (error) {
    console.error(error);
    res.status(500).send({
      message: "Error while updating wishlist",
      error: error.message,
    });
  }
};

// delete wishlist
const deleteWishlist = async (req, res) => {
  try {
    const { is_active } = req.body;
    const { users_id } = req.params;
    console.log(req.body);
    console.log(req.params);

    if (!users_id || is_active !== 0) {
      return res.status(400).send({
        message: "Bad request",
      });
    }

    let queryString = `UPDATE wishlists
                         SET is_active = ?
                         WHERE users_id = ?`;
    const [result] = await con
      .promise()
      .execute(queryString, [ is_active, users_id]);

    // Get count of items in wishlist
    let countQueryString = `SELECT COUNT(users_id) AS count
                              FROM wishlists
                              WHERE users_id = ?`;
    const [countResult] = await con
      .promise()
      .execute(countQueryString, [users_id]);

    const responseBody = {
      message: "Wishlist deleted successfully",
      count: countResult[0].count,
    };
    res.status(200).send(responseBody);
  } catch (error) {
    console.error(error);
    res.status(500).send({
      message: "Error while deleting wishlist",
      error: error.message,
    });
  }
};

const userlogin = async (req, res, next) => {
  try {
    const { email } = req.body;
    const { password } = req.body;

    if (!email && !password) {
      res.status(400).send({
        message: "missing parameters",
      });
    } else {
      let string = `select email,password from users  where email=? and password=?`;
      let [result] = await con.promise().execute(string, [email, password]);

      if (result.length === 0) {
        res.status(404).send({
          message: "User not found",
        });
      } else {
        res.status(200).send({
          message: "Successfully login user",
          result,
        });
      }
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error while getting user",
      error,
    });
  }
};

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name && !email && !password) {
      res.status(400).send({
        message: "bad request",
      });
    }

    let queryString = `insert into users
      ( name,email,password)
       values (?, ?, ?) `;
    const [result] = await con
      .promise()
      .execute(queryString, [name, email, password]);

    res.status(201).send({
      message: "user registered successfully",
      result,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error while creating users",
      error,
    });
  }
};



const middleware = async(req,res,next) => {
  if(req.headers.users_id && req.headers.request_id){
    next()
  }else{
    res.status(400).send(
      {message:"invalid token && user_id request"})
  }
}

// router.get("/v1/users", getAllUser);
router.get("/v1/users/:id", getUserById);

//Products routes
router.get("/v1/products",middleware, getAllProducts);
router.get("/v1/products/:id",middleware, getProductById);

//Wishlist routes
router.get("/v1/wishlist",middleware, getWishlist);
router.post("/v1/wishlist",middleware, addWishlist);
router.delete("/v1/wishlist/:users_id",middleware, deleteWishlist);
router.put("/v1/wishlist/:users_id",middleware, updateWishlist);

router.post("/v1/login", userlogin);
router.post("/v1/register", register);
router.get("/product", getnew);

module.exports = router;
