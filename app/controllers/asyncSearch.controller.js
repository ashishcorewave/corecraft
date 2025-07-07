const Quiz = require("../models/quiz.model.js")
const messages = require("../utility/messages")

exports.asyncSearchQuiz = async (req, res) => {
  const { searchQuery } = req.query
  try {
    let limit = 10
    const search = new RegExp(searchQuery, "i")
    const articles = await Quiz.find(
      { $or: [{ title: search }] },
      {},
      { limit: limit, sort: { _id: -1 } }
    ).select("_id, title")

    res.json({
      status: true,
      data: articles,
      message: messages.read.success
    })
  } catch (error) {
    res.status(404).json({ message: messages.read.error })
  }
}
