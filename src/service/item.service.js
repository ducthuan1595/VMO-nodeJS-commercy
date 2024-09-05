'use strict'

const { BadRequestError } = require('../core/error.response.js')
const _User = require("../model/user.model.js");
const _Item = require("../model/item.model.js");
const _Order = require("../model/order");
const _FlashSale = require("../model/flashsale");
const path = require("path");
const handleFile = require("../config/file");
const pageSection = require("../support/pageSection");
const { destroyCloudinary } = require("../util/cloudinary");
const { findAllProduct, findProduct, publishProductByShop, unpublishProductByShop, searchProductByUser, updateProductById } = require('../model/repositories/item.repo.js')
const { insertInventory } = require('../model/repositories/inventory.repo.js')

class ProductFactory {
  static productRegistry = {}
  static registerProductType(type, classRef) {
    ProductFactory.productRegistry[type] = classRef
  }

  static async createProduct(type, payload) {
    const productClass = ProductFactory.productRegistry[type]
    if(!productClass) throw new BadRequestError('Invalid type product')

    return new productClass(payload).createProduct()
  }

  static async updateProduct(type, product_id, payload) {
    const productClass = ProductFactory.productRegistry[type]
    if(!productClass) throw new BadRequestError('Invalid type product')

    return new productClass(payload).updateProduct(product_id)
  }

  static async findAllDraftsForShop({product_shop, limit=50, skip=0}) {
    const query = { product_shop, isDraft: true }
    return await findAllDraftsForShop({query, limit, skip})
  }

  static async findAllPublishedForShop({product_shop, limit=50, skip=0}) {
    const query = { product_shop, isPublished: true }
    return await this.findAllPublishedForShop({query, limit, skip})
  }

  static async getAllProduct({limit=50, sort='ctime', page=1, filter={isPublished: true}}) {
    return await findAllProduct({limit, sort, page, filter, select: ['product_name', 'product_price', 'product_thumb']})
  }

  static async getProduct({product_id}) {
    return await findProduct({product_id, unselect: ['__v']})
  }

  static async publishProductByShop({product_shop, product_id}) {
    return await publishProductByShop({product_shop, product_id})
  }

  static async unpublishProductByShop({product_shop, product_id}) {
    return await unpublishProductByShop({product_shop, product_id})
  }

  static async searchProduct(keySearch) {
    return await searchProductByUser(keySearch)
  }
}

class Product {
  constructor({
    product_name,
    product_thumb,
    product_description,
    product_price,
    product_type,
    product_shop,
    product_attributes,
    product_quantity
  }) {
    this.product_name = product_name
    this.product_thumb = product_thumb
    this.product_description = product_description
    this.product_price = product_price
    this.product_type = product_type
    this.product_shop = product_shop
    this.product_attributes = product_attributes
    this.product_quantity = product_quantity
  }

  async createProduct(product_id) {
    const newProduct = await _Product.create({...this, _id: product_id})
    if(newProduct) {
      await insertInventory({
        productId: newProduct._id,
        shopId: this.product_shop,
        stock: this.product_quantity
      })

    }
    return newProduct
  }

  async updateProduct(product_id, payload) {
    return await updateProductById({product_id, payload, model: _Product})
  }
}

  const createItem = async({data, user}) => {

    const user = await _User.findById(req.user._id);
    if (user && user.role === "F3") {
        const item = new _Item({
        name: value.name,
        priceInput: value.priceInput,
        pricePay: value.priceInput,
        author: value.author,
        categoryId: value.categoryId,
        slogan: value?.slogan,
        description: value.description,
        barcode: value.barcode,
        count: value.count,
        pic: value.pic,
        detailPic: value.detailPic,
        pages: value.pages,
        language: value.language
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
  }


module.exports = ProductFactory


exports.updateItem = (value, req) => {
  return new Promise(async (resolve, reject) => {
    try {
      const user = await _User.findById(req.user._id);
      if (user && user.role === "F3") {
        const product = await _Item.findById(value.itemId);
        if (product) {
          if(value.pic.length) {
            for (let i = 0; i < product.pic.length; i++) {
              await destroyCloudinary(product.pic[i].public_id);
            }
            product.pic = value.pic;
          }
          product.detailPic = value.detailPic;
          product.name = value.name;
          product.priceInput = value.priceInput;
          product.pricePay = value.priceInput;
          product.categoryId = value.categoryId;
          product.slogan = value?.slogan;
          product.description = value.description;
          product.barcode = value.barcode;
          product.count = value.count;
          product.author = value.author;
          product.pages = value.pages;
          product.language = value.language;

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
      const user = await _User.findById(req.user._id);
      if (user && user.role === "F3") {
        const orders = await _Order.find().where("items.itemId", itemId);
        if (!orders.length) {
          const item = await _Item.findByIdAndDelete(itemId);
          if (item) {
            for (let i = 0; i < item.pic.length; i++) {
              await destroyCloudinary(item.pic[i].public_id);
            }
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

exports.getAllItem = (k, f, s, limit, page, itemId, type, column, isSale) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (f === null && k === null && s === null && itemId === null) {
        const items = await _Item.find()
          .populate("categoryId")
          .populate("flashSaleId")
          .sort([[column ? column : "updatedAt", type ? type : -1]]);

        if (items.length) {
          // page section
          const data = pageSection(page, limit, items);

          for (let i = 0; i < data.result.length; i++) {
            if (data.result[i].flashSaleId) {
              const flashSale = await _FlashSale.findById(
                data.result[i].flashSaleId
              );

              if (!flashSale || flashSale.end_date < Date.now()) {
                data.result[i].pricePay = data.result[i].priceInput;
                data.result[i].flashSaleId = null;
                await data.result[i].save();
              }
            }
          }
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
        const item = await _Item.findById(itemId)
          .populate("categoryId")
          .populate("flashSaleId");
        const flashSale = await _FlashSale.findById(item.flashSaleId);
        if (!flashSale || flashSale.end_date < Date.now()) {
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
        ? await _Item.find()
            .populate({
              path: "categoryId",
              match: {
                name: f,
              },
            })
            .populate("flashSaleId")
            .sort([[column ? column : "updatedAt", type ? type : -1]])
        : await _Item.find().sort([
            [column ? column : "updatedAt", type ? type : -1],
          ]);

      let filters = f
        ? itemFilter.filter((item) => item.categoryId !== null)
        : itemFilter;

      if (isSale) {
        filters = filters.filter((i) => i.flashSaleId === null);
      }

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

      if (sort) {
        for (let i = 0; i < sort.length; i++) {
          if (sort[i].flashSaleId) {
            const flashSale = await _FlashSale.findById(sort[i].flashSaleId);
            if (!flashSale || flashSale.end_date < Date.now()) {
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
      const items = await _Item.find()
        .populate("flashSaleId")
        .sort({ updatedAt: -1 });
      if (items) {
        let itemFlashSale = items.filter((item) => item.flashSaleId !== null);

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

exports.getItemFollowPrice = (low, hight, name) => {
  return new Promise(async (resolve, reject) => {
    try {
      let items = await _Item.find().populate({
        path: "categoryId",
        match: {
          name: name,
        },
        sort: {
          updatedAt: -1,
        },
      });
      items = items.filter((i) => i.categoryId !== null);
      if (items) {
        const newItem = items.filter((i) => {
          if (i.pricePay >= +low && i.pricePay <= +hight) {
            return i;
          }
        });
        // console.log({ newItem });
        resolve({
          status: 200,
          message: "ok",
          data: newItem,
        });
      }
    } catch (err) {
      reject(err);
    }
  });
};
