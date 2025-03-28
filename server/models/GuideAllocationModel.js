const mongoose = require("mongoose");
const guideAllocationSchema = new mongoose.Schema(
  {
    guide: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Guide",
      required: true,
    },
    range: {
      type: String,
      required: true,
    },
    semester: {
      type: Number,
      enum: [5, 7],
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
 guideAllocationSchema.index({ guide: 1, semester: 1, range: 1 }); // Ensure unique guide-semester combination

// Soft delete pre-hook
guideAllocationSchema.pre(/^find/, function (next) {
  this.where({ isDeleted: false });
  next();
});

const GuideAllocationModel = mongoose.model(
  "GuideAllocation",
  guideAllocationSchema
);

module.exports = GuideAllocationModel;
