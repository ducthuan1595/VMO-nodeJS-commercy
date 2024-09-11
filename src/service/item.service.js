'use strict'

const { BadRequestError } = require('../core/error.response.js')
const _User = require("../model/user.model.js");
const {_Product, _Electronic, _Clothing, _Book} = require("../model/item.model.js");
const _Order = require("../model/order");
const _FlashSale = require("../model/flashsale");
const pageSection = require("../support/pageSection");
const { destroyCloudinary } = require("../util/cloudinary");
const { 
  findAllProduct, 
  findProduct, 
  publishProductByShop, 
  unpublishProductByShop, 
  searchProductByUser, 
  updateProductById, 
  findAllProductWithQuery 
} = require('../model/repositories/item.repo.js')
const { insertInventory } = require('../model/repositories/inventory.repo.js');
const { removeUndefinedObject, updateNestParser } = require('../util/index.js');

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
    return await findAllProductWithQuery({query, limit, skip})
  }

  static async findAllPublishedForShop({product_shop, limit=50, skip=0}) {
    const query = { product_shop, isPublished: true }
    return await findAllProductWithQuery({query, limit, skip})
  }

  static async getAllProduct({limit=50, sort='ctime', page=1, filter={isPublished: true}}) {    
    return await findAllProduct({limit, sort, page, filter, select: ['product_name', 'product_price', 'product_thumb']})
  }

  static async getProduct(product_id) {
    return await findProduct({product_id, unselect: ['__v']})
  }

  static async getProductWithFlashSale({limit=50, page=1}) {
    const query = { product_flashSaleId: { $ne: null }, isPublished: true }
    const skip = (page - 1) * limit
    return findAllProductWithQuery({query, limit, skip})
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
    product_slogan,
    product_price,
    product_type,
    product_shop,
    product_attributes,
    product_quantity
  }) {
    this.product_name = product_name
    this.product_thumb = product_thumb
    this.product_description = product_description
    this.product_slogan = product_slogan
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
    console.log({...payload})

    return await updateProductById({product_id, payload, model: _Product})
  }
}

class Clothing extends Product {
  async createProduct () {
    try{
      const newClothing = await _Clothing.create({...this.product_attributes, shopId: this.product_shop})
      if(!newClothing) throw new BadRequestError('Create new clothing error')

      const newProduct = await super.createProduct(newClothing._id)
      if(!newProduct) throw new BadRequestError('Create new product error')

      return newProduct
    }catch(err) {
      console.error(err)
      
    }
  }

  async updateProduct(product_id) {
    const objectParams = removeUndefinedObject(this)
    const objParams = objectParams.product_attributes
    if(objParams) {
      await updateProductById({product_id, payload: updateNestParser(objParams), model: _Clothing})
    }
    const updateProduct = await super.updateProduct(product_id, updateNestParser(objectParams))
    return updateProduct
  }
}

class Book extends Product {
  async createProduct () {
    try{
      const newBook = await _Book.create({...this.product_attributes, shopId: this.product_shop})
      if(!newBook) throw new BadRequestError('Create new book error')

      const newProduct = await super.createProduct(newBook._id)
      if(!newProduct) throw new BadRequestError('Create new product error')

      return newProduct
    }catch(err) {
      console.error(err)
      
    }
  }

  async updateProduct(product_id) {
    const objectParams = removeUndefinedObject(this)
    const objParams = objectParams.product_attributes

    if(objParams) {
      await updateProductById({product_id, payload: updateNestParser(objParams), model: _Book})
    }
    const updateProduct = await super.updateProduct(product_id, updateNestParser(objectParams))
    return updateProduct
  }
}

class Electronic extends Product {
  async createProduct () {
    try{
      const newElectronic = await _Electronic.create({...this.product_attributes, shopId: this.product_shop})
      if(!newElectronic) throw new BadRequestError('Create new clothing error')

      const newProduct = await super.createProduct(newElectronic._id)
      if(!newProduct) throw new BadRequestError('Create new product error')

      return newProduct
    }catch(err) {
      console.error(err)
      
    }
  }

  async updateProduct(product_id) {
    const objectParams = removeUndefinedObject(this)
    const objParams = objectParams.product_attributes
    if(objParams) {
      await updateProductById({product_id, payload: updateNestParser(objParams), model: _Electronic})
    }
    const updateProduct = await super.updateProduct(product_id, updateNestParser(objectParams))
    return updateProduct
  }
}

// Register product type
ProductFactory.registerProductType('clothing', Clothing)
ProductFactory.registerProductType('book', Book)
ProductFactory.registerProductType('electronic', Electronic)

module.exports = ProductFactory
