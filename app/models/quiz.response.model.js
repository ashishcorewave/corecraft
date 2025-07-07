const mongoose = require("mongoose")

const QuizResponseSchema = mongoose.Schema(
  {
    quiz_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz"
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    question: [
      {
        question_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Question"
        },
        question: {
          type: String
        },
        answer_id: {
          type: mongoose.Schema.Types.ObjectId
        },
        answer: {
          type: String
        }
      }
    ],
    total_questions: {
      type: Number
    },
    correct_answer: {
      type: Number
    },
    incorrect_answer: {
      type: Number
    },
    result: {
      type: Number
    },
    start_time: {
      type: Date
    },
    end_time: {
      type: Date
    }
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model("QuizResponse", QuizResponseSchema)
