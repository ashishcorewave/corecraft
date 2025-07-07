const express = require("express");
const router = express.Router();
const articles = require("../controllers/article.controller.js");
const upload = require("../middleware/upload.js");
const uploadArticle = require("../middleware/uploadArticle.js");

// Articles CRUD
router.get("/articles", articles.getAll);
router.get("/articles/search", articles.searchArticle);
router.get("/articles/:articleId", articles.getById);
router.put("/articles/:articleId", articles.update);
router.delete("/articles/:articleId", articles.delete);

// Article Comments
router.post("/articles/comments", articles.createComment);
router.get("/articles/comments", articles.getAllComments);
router.delete("/articles/comments/:commentId", articles.deleteComment);

// Other Article Actions
router.post("/articles/read", articles.readArticle);
router.post("/articles/like", articles.likeArticle);
router.post("/articles/report", articles.reportArticle);
router.post("/articles/uploadImage", uploadArticle.single("image"), articles.uploadArticleImage);


router.post("/create-article", articles.createArticle);// New Api
router.post('/mark-top-article', articles.isTopArticlesMarks);
router.get('/top-article', articles.listOfTopArticles);
router.get('/article-detail', articles.detailsOfArticle);
module.exports = router;
