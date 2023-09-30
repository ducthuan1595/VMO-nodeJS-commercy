const User = require("../model/user");
const Item = require("../model/item");
const Order = require("../model/order");
const FlashSale = require("../model/flashsale");
const path = require("path");
const handleFile = require("../config/file");
const pageSection = require("../suports/pageSection");

const p = path.join("data", "images", "image");

exports.createItem = (value, req) => {
  return new Promise(async (resolve, reject) => {
    try {
      const user = await User.findById(req.user._id);
      if (user && user.role === "F3") {
        const handleImage = (images) => {
          const imageName = [];
          images.forEach((img) => {
            const pathname = Date.now() + img.name;
            imageName.push("image" + pathname);
            img.mv(p + pathname, (err) => {
              if (err) {
                console.log("Error upload image");
              } else {
                console.log("Upload image successfully");
              }
            });
          });
          return imageName;
        };
        let pic;
        if (value.imageArr && value.imageArr[0]) {
          pic = handleImage(value.imageArr);
        }
        let detailPic;
        if (value.detailPicArr[0]) {
          detailPic = handleImage(value.detailPicArr);
        }
        const item = new Item({
          name: value.name,
          priceInput: value.priceInput,
          pricePay: value.priceInput,
          author: value.author,
          categoryId: value.categoryId,
          slogan: value?.slogan,
          description: value.description,
          barcode: value.barcode,
          count: value.count,
          pic: pic,
          detailPic: detailPic,
          weight: value.weight,
        });
        const newItem = await item.save();
        if (newItem) {
          resolve({
            status: 200,
            message: "ok",
            data: newItem,
          });
        }
      } else {
        resolve({
          message: "Unauthorized",
          status: 402,
        });
      }
    } catch (err) {
      reject(err);
    }
  });
};

exports.updateItem = (value, req) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log(value.imageArr);
      const user = await User.findById(req.user._id);
      if (user && user.role === "F3") {
        const product = await Item.findById(value.itemId);
        if (product) {
          const handleImage = (images) => {
            const imageName = [];
            images.forEach((img) => {
              const pathname = Date.now() + img.name;
              imageName.push("image" + pathname);
              img.mv(p + pathname, (err) => {
                if (err) {
                  console.log("Error upload image");
                } else {
                  console.log("Upload image successfully");
                }
              });
            });
            return imageName;
          };
          if (value.imageArr && value.imageArr[0]) {
            const pic = handleImage(value.imageArr);
            if (product.pic.length) {
              handleFile.deleteFile(product.pic);
            }
            product.pic = pic;
          }
          if (value.detailPicArr[0]) {
            const detailPic = handleImage(value.detailPicArr);
            if (product.detailPic.length) {
              handleFile.deleteFile(product.detailPic);
            }
            product.detailPic = detailPic;
          }
          product.name = value.name;
          product.priceInput = value.priceInput;
          product.pricePay = value.priceInput;
          product.categoryId = value.categoryId;
          product.slogan = value?.slogan;
          product.description = value.description;
          product.barcode = value.barcode;
          product.count = value.count;
          product.author = value.author;
          product.weight = value.weight;

          const newItem = await product.save();
          if (newItem) {
            resolve({
              status: 200,
              message: "ok",
              data: newItem,
            });
          }
        }
      } else {
        resolve({
          message: "Unauthorized",
          status: 402,
        });
      }
    } catch (err) {
      reject(err);
    }
  });
};

exports.deleteItem = (itemId, req) => {
  return new Promise(async (resolve, reject) => {
    try {
      const user = await User.findById(req.user._id);
      if (user && user.role === "F3") {
        const orders = await Order.find().where("items.itemId", itemId);
        if (!orders.length) {
          const item = await Item.findByIdAndDelete(itemId);
          if (item) {
            handleFile.deleteFile(item.pic);
            handleFile.deleteFile(item.detailPic);
            resolve({
              status: 200,
              message: "ok",
            });
          } else {
            resolve({
              status: 404,
              message: "Item is not exist!",
            });
          }
        } else {
          resolve({
            status: 403,
            message: "Item used order!",
          });
        }
      } else {
        resolve({
          status: 403,
          message: "Unauthorized",
        });
      }
    } catch (err) {
      reject(err);
    }
  });
};

exports.getAllItem = (k, f, s, limit, page, itemId, type, column) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (f === null && k === null && s === null && itemId === null) {
        const items = await Item.find()
          .populate("categoryId")
          .populate("flashSaleId")
          .sort([[column ? column : "name", type ? type : "asc"]]);

        // console.log({ items });
        for (let i = 0; i < items.length; i++) {
          if (items[i].flashSaleId) {
            const flashSale = await FlashSale.findById(items[i].flashSaleId);
            if (
              flashSale &&
              flashSale.end_date &&
              flashSale.end_date < Date.now()
            ) {
              items[i].pricePay = items[i].priceInput;
              items[i].flashSaleId = null;
              await items[i].save();
            }
          } else {
            items[i].pricePay = items[i].priceInput;
            items[i].flashSaleId = null;
            await items[i].save();
          }
        }

        // page section
        if (items.length) {
          const data = pageSection(page, limit, items);
          resolve({
            status: 200,
            message: "ok",
            data: {
              currPage: page,
              nextPage: page * limit < items.length,
              prevPage: 0 < page - 1,
              products: data.result,
              totalPage: data.totalPage,
              totalNumber: items.length,
            },
          });
        }
      } else if (itemId) {
        const item = await Item.findById(itemId).populate("categoryId");
        const flashSale = await FlashSale.findById(item.flashSaleId);
        if (flashSale && flashSale.end_date < Date.now()) {
          item.pricePay = item.priceInput;
          item.flashSaleId = null;
          await item.save();
        }
        if (item) {
          resolve({
            status: 200,
            message: "ok",
            data: item,
          });
        } else {
          resolve({
            status: 404,
            message: "Not found item",
          });
        }
      }
      // filter
      const itemFilter = f
        ? await Item.find()
            .populate({
              path: "categoryId",
              match: {
                name: f,
              },
            })
            .sort([[column ? column : "name", type ? type : "asc"]])
        : await Item.find().sort([
            [column ? column : "name", type ? type : "asc"],
          ]);

      const filters = f
        ? itemFilter.filter((item) => item.categoryId !== null)
        : itemFilter;

      // search
      // console.log("key", k);
      // console.log("filter", filters);
      const search = k
        ? filters.filter((item) => {
            if (item.name.toLowerCase().includes(k.toLowerCase())) {
              return item;
            }
          })
        : filters;

      // console.log("search", search);

      // Sort
      const sort = s
        ? search.filter((item) => {
            if (+item.pricePay <= +s) {
              return item;
            }
          })
        : search;

      // console.log("sort", sort);

      if (sort) {
        for (let i = 0; i < sort.length; i++) {
          if (sort[i].flashSaleId) {
            const flashSale = await FlashSale.findById(sort[i].flashSaleId);
            if (flashSale && flashSale.end_date < Date.now()) {
              sort[i].pricePay = sort[i].priceInput;
              sort[i].flashSaleId = null;
              await sort[i].save();
            }
          }
        }

        // page section
        if (page && limit) {
          const data = pageSection(page, limit, sort);
          resolve({
            status: 200,
            message: "ok",
            data: {
              currPage: page,
              nextPage: page * limit < sort.length,
              prevPage: 0 < page - 1,
              products: data.result,
              totalPage: data.totalPage,
              totalNumber: sort.length,
            },
          });
        } else {
          resolve({
            message: "ok",
            status: 200,
            data: sort,
          });
        }
      }
    } catch (err) {
      reject(err);
    }
  });
};

exports.getAllItemFlashSale = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const items = await Item.find().populate("flashSaleId");
      if (items) {
        let itemFlashSale = items.filter((item) => item.flashSaleId);
        itemFlashSale = itemFlashSale.filter(
          (i) => i.flashSaleId.end_date > Date.now()
        );
        if (itemFlashSale) {
          resolve({
            status: 200,
            message: "ok",
            data: itemFlashSale,
          });
        } else {
          resolve({
            status: 404,
            message: "Not found",
          });
        }
      }
    } catch (err) {
      reject(err);
    }
  });
};
