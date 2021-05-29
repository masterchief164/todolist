const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://<username></username>:<password>@todolist.0egpa.mongodb.net/todolist?retryWrites=true&w=majority", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

//// ITEM SCHEMA////
const itemsSchema = {
    name: String
};

const Item = mongoose.model("Item", itemsSchema);

////DEFAULT ITEMS////
const item1 = new Item({
    name: "Type a new item below"
});

const item2 = new Item({
    name: "Click the + button to add the new item"
});

const item3 = new Item({
    name: "<--Click this to delete an item"
});


const defaultItems = [item1, item2, item3];

////CUSTOM LIST ITEM SCHEMA////
const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

//////HOME ROUTE/////
app.get("/", function (req, res) {

    Item.find({}, function (err, foundItems) {

        if (foundItems.length === 0) {
            Item.insertMany(defaultItems, function (err) {
                if (err) {
                }
            });
            res.redirect("/");
        } else {
            res.render("list", {listTitle: "Today", newListItems: foundItems});
        }
    })

});

/////ADD NEW ITEM/////
app.post("/", function (req, res) {

    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    if (itemName !== "") {

        if (listName === "Today") {
            item.save();
            res.redirect("/");

        } else {
            ///// for custom list////
            List.findOne({name: listName}, function (err, foundList) {
                foundList.items.push(item);
                foundList.save();
                res.redirect("/" + listName);
            })
        }
    }

});

/////CUSTOM LIST//////
app.get("/:customListName", function (req, res) {

    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName}, function (err, foundList) {
        if (!err) {
            if (!foundList) {

                ////create a new list////
                const list = new List({
                    name: customListName,
                    items: defaultItems
                })

                list.save();
                res.redirect("/" + customListName);
            } else {

                /////Show an existing list////
                res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
            }

        }
    })
});


////DELETE ITEM/////
app.post("/delete", function (req, res) {

    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {

        Item.findByIdAndRemove(checkedItemId, function (err) {
            if (!err) {
                res.redirect("/");
            }
        });
    } else {
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function (err) {
            if (!err) {
                res.redirect("/" + listName);
            }
        })
    }


});

app.listen(process.env.PORT || 3000, function () {
    console.log("Server has started successfully!");
});
