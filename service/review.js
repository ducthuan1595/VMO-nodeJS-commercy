const Review = require('../model/review');
const pageSection = require('../suports/pageSection');
const {destroyCloudinary} = require('../util/cloudinary');

exports.createReview = async (comment, stars, itemId, picture, req) => {
  try{
    const review = new Review({
      comment,
      stars,
      itemId,
      picture,
      reviewer: req.user._id
    });
    const newReview = await review.save();
    if(newReview) {
      return {
        status: 200,
        message: 'ok',
        data: newReview
      }
    }
  }catch(err) {
    console.log(err);
  }
};

exports.getReview = async (itemId, req) => {
  try{
    let reviews = await Review.find({
      reviewer: req.user._id});
    
    if (itemId !== "undefined") {
      reviews = reviews.filter(
        (item) => item.itemId.toString() === itemId.toString()
      );
    }

    return {
      status: 201,
      message: 'ok',
      data: reviews
    }

  }catch(err) {
    console.error(err);
  }
}

exports.getAllReview = async (page, limit) => {
  try {
    let reviews = await Review.find().populate('reviewer', '-password, -cart').sort({createdAt: -1});
    if (page !== "undefined" || limit !== "undefined") {
      const data = pageSection(page, limit, reviews);
      return {
        status: 201,
        message: "ok",
        data: {
          data: data.result,
          totalPage: data.totalPage,
          totalOrder: reviews.length,
          currPage: page,
          nextPage: +page * +limit < reviews.length,
          prevPage: +page > 1,
        },
      };
    }
    return {
      status: 201,
      message: 'ok',
      data: reviews
    }
  } catch (err) {
    console.error(err);
  }
};

exports.getReviewWithItem = async(itemId, page, limit) => {
  try{
    let reviews = await Review.find({itemId: itemId})
      .populate("reviewer", "-password, -cart")
      .sort({ createdAt: -1 });

    if (page !== "undefined" || limit !== "undefined") {
      const data = pageSection(page, limit, reviews);
      return {
        status: 201,
        message: "ok",
        data: {
          data: data.result,
          totalPage: data.totalPage,
          totalOrder: reviews.length,
          currPage: page,
          nextPage: +page * +limit < reviews.length,
          prevPage: +page > 1,
        },
      };
    }
  }catch(err) {
    console.log(err);
    return {
      status: 500,
      message: 'Error from server'
    }
  }
}

exports.updateReview = async (comment, stars, reviewId, picture) => {
  try {
    const review = await Review.findById(reviewId);
    if(review) {
      if(picture.length) {
        for (let i = 0; i < review.picture.length; i++) {
          await destroyCloudinary(review.picture[i].public_id);
        }
        review.picture = picture;
      }
      review.comment = comment;
      review.stars = stars;
    }
    const newReview = await review.save();
    if (newReview) {
      return {
        status: 200,
        message: "ok",
        data: newReview,
      };
    }
  } catch (err) {
    console.log(err);
  }
};