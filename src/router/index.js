'use strict'

const express = require('express');
const { apiKey, permission } = require('../auth/checkAuth')

const route = express.Router();


// route.use(apiKey)
// route.use(permission('0000'))

route.use('/v1/api/access', require('./access'))
route.use('/v1/api/user', require('./user'))
route.use('/v1/api/cart', require('./cart'))
route.use('/v1/api/product', require('./product'))
route.use('/v1/api/voucher', require('./voucher'))
route.use('/v1/api/flashsale', require('./flashsale'))
route.use('/v1/api/checkout', require('./order'))
route.use('/v1/api/otp', require('./otp'))
route.use('/v1/api/category', require('./category'))
// route.use('/v1/api/review', require('./review'))
route.use('/v1/api/stripe', require('./stripe'))
route.use('/v1/api/upload', require('./upload'))


module.exports = route;