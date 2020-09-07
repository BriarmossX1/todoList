//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
// const date = require(__dirname + "/date.js");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB", { useNewUrlParser: true, useUnifiedTopology: true });

const itemsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    }
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome to your todolist!"
});

const item2 = new Item({
    name: "Hit the + button to add a new item."
});

const item3 = new Item({
    name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];

app.get("/", function(req, res) {

    Item.find({}, (err, foundItems) => {

        if (foundItems.length === 0) {

            Item.insertMany(defaultItems, (err) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Successfully added items to database!");
                }
            });

            res.redirect("/");

        } else {
            res.render("list", { listTitle: /*day*/ "Today", newListItems: foundItems });
        }
    });

    // const day = date.getDate();



});

app.get("/:customListName", (req, res) => {

    const customListName = _.capitalize(req.params.customListName);

    List.findOne({ name: customListName }, (err, foundList) => {

        if (!err) {
            if (!foundList) {
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });

                list.save();

                res.redirect("/" + customListName);

            } else {
                console.log("found List!");
                res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
            }
        }
    });

});

app.post("/", function(req, res) {

    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    if (listName === "Today") {

        item.save();

        res.redirect("/");

    } else {

        List.findOne({ name: listName }, (err, foundList) => {

            if (!err) {
                foundList.items.push(item);
                foundList.save();
                res.redirect("/" + listName);

            } else {

                console.log(err);

            }

        });

    }


    // const item = req.body.newItem;

    // if (req.body.list === "Work") {
    //     workItems.push(item);
    //     res.redirect("/work");
    // } else {
    //     items.push(item);
    //     res.redirect("/");
    // }
});

app.post("/delete", (req, res) => {

    const listName = req.body.listName;
    const checkedItemId = req.body.checkbox;

    if (listName === "Today") {

        Item.findByIdAndRemove(checkedItemId, (err) => {
            if (!err) {
                console.log("Item successfully removed!");
            }
        });

        res.redirect("/");

    } else {

        List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } }, (err, foundList) => {
            if (!err) {
                res.redirect("/" + listName);
            } else {
                console.log(err);
            }
        });

    }




    // console.log(req.body.checkbox);

});

// app.get("/work", function(req, res) {
//     res.render("list", { listTitle: "Work List", newListItems: workItems });
// });

app.get("/about", function(req, res) {
    res.render("about");
});

app.listen(3000, function() {
    console.log("Server started on port 3000");
});