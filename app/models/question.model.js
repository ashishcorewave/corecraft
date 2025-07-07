const mongoose = require("mongoose")

const QuestionSchema = mongoose.Schema(
  {
    question: {
      type: Object,
      required: true
    },
    quiz_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Quiz"
    },
    question_type: {
      type: String,
      enum: ["SingleChoice", "MultipleChoice", "Text"],
      default: "Text"
    },
    answers: [
      {
        answer: {
          type: Object,
          required: false
        },
        external_link: {
          type: Object
        },
        isCorrect: {
          type: Object,
          required: true,
        }
      }
    ],
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model("Question", QuestionSchema)
