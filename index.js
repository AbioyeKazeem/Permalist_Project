import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user:"postgres",
  host: "localhost",
  database: "permalist",
  password: "mypass",
  port: 5432,
})

db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));


 //let currenItemid = 1;

let items = [
  { id: 1, title: "Buy milk" },
  { id: 2, title: "Finish homework" },
];


async function postedItems() {
  try {
    const result = await db.query("SELECT * FROM items ORDER BY id ASC");
    return result.rows; // Return array of objects containing id and title
  } catch (error) {
    console.error("Error fetching items from database:", error);
    return []; // Return empty array in case of error
  }
}


// Read a data from database and passed over to index.js
app.get("/", async (req, res) => {
  const tday = `${new Date().getDate()}/${new Date().getMonth() + 1}/${new Date().getFullYear()}`;
  items = await postedItems();
  res.render("index.ejs", {
    listTitle: "Today",
    schedule: `My schedule for ${tday}`,
    listItems: items,
  });
});



app.post("/add", async (req, res) => {
  const newItemTitle = req.body.newItem;

  try {
    // Insert the new item into the database
    await db.query("INSERT INTO items (title) VALUES ($1)", [newItemTitle]);

    // Optionally, if you still want to push the item into the local items array
    items.push({ title: newItemTitle });

    // Redirect back to the homepage after adding the item
    res.redirect("/");
  } catch (err) {
    console.error("Error adding item to database:", err);
    let error;
    if (err.code === '23505') { // Unique constraint violation error code
      error = "Item has already been added to your database.";
    } else {
      error = "Something is wrong with your database.";
    }
    const items = await postedItems();
    res.render("index.ejs", {
      listTitle: "Today",
      schedule: `My schedule for ${tday}`,
      listItems: items,
      error: error
    });
  }
});



app.post("/edit", async (req, res) => {
  const item = req.body.updatedItemTitle;
  const id = req.body.updatedItemId;
  try {
    // Update the item title in the database
    await db.query("UPDATE items SET title = $1 WHERE id = $2", [item, id]);
    res.redirect("/");      // Redirect back to the homepage after editing the item

    }catch(err){
      console.log(err);
    }
});

  

app.post("/delete", async(req, res) => {
   const id = req.body.deleteItemId;
   
   try{
    await db.query("delete FROM items WHERE id = $1", [id]);
    res.redirect("/");
   }catch(err){
    console.log(err);
   }
});


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
