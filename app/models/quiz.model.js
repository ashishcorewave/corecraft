const mongoose = require('mongoose');

const QuizSchema = mongoose.Schema({
   title: {
      type: Object,
      required: true
   },
   description: {
      type: Object,
      required: true
   },
   Img: {
      type: Object,
      required: false,
   },
   questions: [
   {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question'
   },
   ],
   created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
   },
   isDeleted: {
      type: Boolean,
      default: false
   }
},
{
   timestamps: true
});

module.exports = mongoose.model("Quiz", QuizSchema);