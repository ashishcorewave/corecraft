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
router.post("/insert/articles/comments", articles.createComment);
router.get("/get/articles/comments", articles.getAllComments);
router.delete("/delete/articles/comments/:commentId", articles.deleteComment);

// Other Article Actions
router.post("/readArticle", articles.readArticle);
router.post("/likeArticle", articles.likeArticle)
router.post("/articles/report", articles.reportArticle);
router.post("/articles/uploadImage", uploadArticle.single("image"), articles.uploadArticleImage);


router.post("/create-article", articles.createArticle);// New Api
router.post('/mark-top-article', articles.isTopArticlesMarks);
router.get('/top-article', articles.listOfTopArticles);
router.get('/top-doctor-article', articles.listOfTopDoctorArticles);
router.get('/article-detail', articles.detailsOfArticle);
router.get('/article-by-category', articles.ArticleByCategory);
router.get('/all-articles', articles.listOfAllArticles);
module.exports = router;
