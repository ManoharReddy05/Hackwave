import mongoose from "mongoose";

const playgroundSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
      unique: true, // One playground per group
    },
    canvasUrl: {
      type: String,
      default: process.env.CANVAS_BASE_URL || "https://mavericks-whiteboard-mvvs1437.onrender.com/boards/",
    },
    boardId: {
      type: String,
      default: function() {
        // Generate a unique board ID for this group
        return this.groupId.toString();
      }
    },
    activeUsers: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      joinedAt: {
        type: Date,
        default: Date.now,
      }
    }],
    settings: {
      allowAnonymous: {
        type: Boolean,
        default: false,
      },
      maxUsers: {
        type: Number,
        default: 50,
      },
      toolsEnabled: {
        type: [String],
        default: ["pen", "eraser", "shapes", "text", "sticky-notes"],
      }
    },
    snapshots: [{
      timestamp: Date,
      snapshotUrl: String,
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      }
    }]
  },
  { timestamps: true }
);

// Method to get full canvas URL with board ID
playgroundSchema.methods.getFullCanvasUrl = function() {
  return `${this.canvasUrl}${this.boardId}`;
};

// Static method to get or create playground for a group
playgroundSchema.statics.getOrCreateForGroup = async function(groupId) {
  let playground = await this.findOne({ groupId });
  
  if (!playground) {
    playground = await this.create({
      groupId,
      boardId: groupId.toString(),
    });
  }
  
  return playground;
};

export default mongoose.model("Playground", playgroundSchema);
