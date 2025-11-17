const Task = require("../models/taskModel");
const User = require("../models/userModel");
const TaskStatusMap = require("../models/taskStatusMapModel");
const Comment = require("../models/commentModel");
const { successHandle, errorHandle, sendEmail } = require("../helper/helper");

const createTask = async (req, res) => {
  try {
    const {
      taskName,
      description,
      priority,
      category,
      userId,
      statusId,
      comment,
      assignDate,
      dueDate,
    } = req.body;

    try {
      const existingTask = await Task.findOne({ taskName });
      if (existingTask) {
        return errorHandle("", res, "Task Already Exists", 422, "");
      }
    } catch (error) {
      return errorHandle(
        "",
        res,
        "Error Checking Existing Task",
        500,
        error.message
      );
    }

    try {
      const newTask = await Task.create({
        taskName,
        description,
        priority,
        category,
        userId,
        comment,
        assignDate,
        dueDate,
      });
      if (comment) {
        try {
          await Comment.create({
            taskId: newTask.id,
            userId: userId,
            comment: comment,
            isLiked: false,
          });
        } catch (error) {
          return errorHandle(
            "",
            res,
            "Error Creating Comment",
            500,
            error.message
          );
        }
      }

      try {
        const newStatusMap = await TaskStatusMap.create({
          taskId: newTask.id,
          statusId: statusId,
        });
        try {
          await Task.findByIdAndUpdate(newTask.id, {
            $push: { status: newStatusMap },
          });
        } catch (error) {
          return errorHandle(
            "",
            res,
            "Error Updating Task Status Map",
            500,
            error.message
          );
        }
      } catch (error) {
        return errorHandle(
          "",
          res,
          "Error Creating Task Status Map",
          500,
          error.message
        );
      }
      try {
        const user = await User.findById(userId);
        if (user?.email) {
          try {
            await sendEmail(
              user?.email,
              "Task Assigned",
              `<h1>Task Assigned</h1>
                            <p>Task Name: ${taskName}</p>
                            <p>Due Date: ${dueDate}</p>`
            );
          } catch (error) {
            return errorHandle(
              "",
              res,
              "Error Sending Email",
              500,
              error.message
            );
          }
        }
      } catch (error) {
        return errorHandle("", res, "Error Sending Email", 500, error.message);
      }
      return successHandle("", res, "Task Created Successfully", 201, newTask);
    } catch (error) {
      return errorHandle("", res, "Error Creating Task", 500, error.message);
    }
  } catch (error) {
    return errorHandle("", res, "Task Creation Failed", 500, error.message);
  }
};

const getAllTasks = async (req, res) => {
  try {
    const limit = parseInt(req?.query?.limit || 5);
    const page = parseInt(req?.query?.page || 1);
    if (page < 1 || limit < 1) {
      return errorHandle(
        "",
        res,
        "Page must be >= 1 and limit must be > 0",
        400,
        ""
      );
    }

    const offset = (page - 1) * limit;
    let filter = { isDeleted: false };
    let sortTask = {};
    let search = {};
    const { searchObj, sortObj } = req.query;

    if (searchObj) {
      try {
        search = JSON.parse(searchObj);
        if (search.name === "isLiked") {
          filter[search.name] = search.value.toLowerCase() === "true";
        } else if (
          search.name === "taskName" ||
          search.name === "priority" ||
          search.name === "category"
        ) {
          filter[search.name] = { $regex: search.value, $options: "i" };
        }
        if (search.name == "assignDate" || search.name == "dueDate") {
          filter[search.name] = new Date(search.value);
        }
      } catch (error) {
        return errorHandle(
          "",
          res,
          "Invalid Search Object",
          400,
          error.message
        );
      }
    }

    if (sortObj) {
      try {
        const sort = JSON.parse(sortObj);
        if (sort.name && sort.order) {
          sortTask[sort.name] = sort.order == "ASC" ? 1 : -1;
        } else {
          return errorHandle(
            "",
            res,
            "Invalid Sort Object Properties",
            400,
            error.message
          );
        }
      } catch (error) {
        return errorHandle("", res, "Invalid Sort Object", 400, error.message);
      }
    }

    try {
      let tasks = await Task.find(filter).sort(sortTask);
      try {
        tasks = await Promise.all(
          tasks.map(async (task) => {
            try {
              return await Task.populate(task, {
                path: "status",
                options: { sort: { createdAt: -1 }, limit: 1 },
                populate: {
                  path: "statusId",
                  select: "statusName",
                },
              });
            } catch (error) {
              return errorHandle(
                "",
                res,
                "Error Populating Task",
                500,
                error.message
              );
            }
          })
        );
      } catch (error) {
        return errorHandle(
          "",
          res,
          "Error Populating Task",
          500,
          error.message
        );
      }

      if (search?.name === "statusName") {
        tasks = tasks.filter(
          (task) => task.status[0]?.statusId?.statusName === search.value
        );
      }

      const totalTaskLiked = tasks.reduce(
        (total, task) => total + task?.likedBy?.length,
        0
      );
      const totalTaskComment = tasks.filter((task) => task.comment).length;
      const totalRecord = tasks.length;
      const totalPage = Math.ceil(totalRecord / limit);
      tasks = tasks.slice(offset, offset + limit);

      const commentCounts = await Promise.all(
        tasks.map(async (task) => {
          const commentCount = await Comment.countDocuments({
            taskId: task._id,
          });
          const likedCount = task.likedBy.length;
          return {
            ...task.toObject(),
            commentCount: commentCount,
            likedCount: likedCount,
          };
        })
      );

      const paginationInfo = {
        totalRecord: totalRecord,
        currentPage: page,
        limit: limit,
        totalPage,
        totalTaskLiked,
        totalTaskComment,
      };
      return successHandle("", res, "Tasks Retrieved Successfully", 200, {
        paginationInfo,
        tasks: commentCounts,
      });
    } catch (error) {
      return errorHandle("", res, "Task Not Found", 404, error.message);
    }
  } catch (error) {
    return errorHandle("", res, "Error Retrieving Tasks", 500, error.message);
  }
};

const getByIdTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate({
      path: "status",
      options: { sort: { createdAt: -1 }, limit: 1 },
      populate: {
        path: "statusId",
        select: "statusName",
      },
    });

    if (!task) {
      return errorHandle("", res, "Task not found", 404, "");
    }

    const commentCount = await Comment.countDocuments({ taskId: task.id });
    const likedCount = task.likedBy.length;
    const taskWithCommentCount = {
      ...task.toObject(),
      commentCount: commentCount,
      likedCount: likedCount,
    };
    return successHandle(
      "",
      res,
      "Tasks Retrieved Successfully",
      200,
      taskWithCommentCount
    );
  } catch (error) {
    return errorHandle("", res, "Error Retrieving Task", 500, error.message);
  }
};

const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    const { comment, userId } = updateData;
    try {
      if (comment && userId) {
        try {
          await Comment.create({
            taskId: id,
            userId: userId,
            comment: comment,
          });
        } catch (error) {
          return errorHandle(
            "",
            res,
            "Error Updating Comment",
            500,
            error.message
          );
        }
      }
      const updatedTask = await Task.findByIdAndUpdate(id, updateData);
      if (!updatedTask) {
        return errorHandle("", res, "Task Not Found", 404, "");
      }
      return successHandle(
        "",
        res,
        "Task Updated Successfully",
        200,
        updatedTask
      );
    } catch (error) {
      return errorHandle("", res, "Error Updating Task", 500, error.message);
    }
  } catch (error) {
    return errorHandle("", res, "Error Updating Task", 500, error.message);
  }
};

const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { statusId } = req.body;
    try {
      const updatedStatus = await TaskStatusMap.create({
        taskId: id,
        statusId: statusId,
      });
      try {
        await Task.findByIdAndUpdate(id, {
          $push: { status: updatedStatus },
        });
      } catch (error) {
        return errorHandle(
          "",
          res,
          "Error Updating Task Status",
          500,
          error.message
        );
      }
      if (!updatedStatus) {
        return errorHandle("", res, "Task Status Not Found", 404, "");
      }
      return successHandle(
        "",
        res,
        "Task Status Updated Successfully",
        200,
        updatedStatus
      );
    } catch (error) {
      return errorHandle(
        "",
        res,
        "Error Updating Task Status",
        500,
        error.message
      );
    }
  } catch (error) {
    return errorHandle(
      "",
      res,
      "Error Updating Task Status",
      500,
      error.message
    );
  }
};

const getTaskStatusHistory = async (req, res) => {
  try {
    const { id } = req.params;
    try {
      const statusHistory = await TaskStatusMap.find({ taskId: id })
        .populate({
          path: "statusId",
          select: "statusName",
        })
        .populate({
          path: "taskId",
          select: "taskName",
        });
      return successHandle("", res, "Task Status History", 200, statusHistory);
    } catch (error) {
      return errorHandle(
        "",
        res,
        "Error in Task Status History",
        500,
        error.message
      );
    }
  } catch (error) {
    return errorHandle(
      "",
      res,
      "Error in Task Status History",
      500,
      error.message
    );
  }
};

const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    try {
      const deletedTask = await Task.findByIdAndUpdate(id, { isDeleted: true });
      if (!deletedTask) {
        return errorHandle("", res, "Task Not Found", 404, "");
      }
      return successHandle("", res, "Task Deleted Successfully", 204, "");
    } catch (error) {
      return errorHandle("", res, "Error Deleting Task", 500, error.message);
    }
  } catch (error) {
    return errorHandle("", res, "Error Deleting Task", 500, error.message);
  }
};

const addIsLikedTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const task = await Task.findById(id);
    if (!task) {
      return errorHandle("", res, "Task Not Found", 404, "");
    }
    const alreadyLiked = task.likedBy.includes(userId);

    if (!alreadyLiked) {
      task.isLiked = true;
      task.likedBy.push(userId);
    } else {
      task.isLiked = false;
      task.likedBy.pull(userId);
    }
    await task.save();
    return successHandle("", res, "Task Liked", 200, task);
  } catch (error) {
    return errorHandle("", res, "Error Liking Task", 500, error.message);
  }
};

const addIsLikedComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const comment = await Comment.findById(id);
    if (!comment) {
      return errorHandle("", res, "Comment Not Found", 404, "");
    }
    const alreadyLiked = comment.likedBy.includes(userId);

    if (!alreadyLiked) {
      comment.isLiked = true;
      comment.likedBy.push(userId);
    } else {
      comment.isLiked = false;
      comment.likedBy.pull(userId);
    }
    await comment.save();
    return successHandle("", res, "Comment Liked", 200, comment);
  } catch (error) {
    return errorHandle("", res, "Error Liking Comment", 500, error.message);
  }
};

const filterByPriority = async (req, res) => {
  try {
    const { priority } = req.query;
    if (!priority) {
      return errorHandle("", res, "Priority is Required", 400, "");
    }
    const pipeline = [
      {
        $match: {
          isDeleted: false,
          priority: { $regex: priority, $options: "i" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $group: {
          _id: "$priority",
          taskCount: { $sum: 1 },
          userName: {
            $addToSet: { $concat: ["$user.firstName", " ", "$user.lastName"] },
          },
        },
      },
    ];
    const ans = await Task.aggregate(pipeline);
    return successHandle("", res, "Task Filtered Successfully", 200, ans);
  } catch (error) {
    return errorHandle("", res, "Error Filtering Task", 500, error.message);
  }
};

module.exports = {
  createTask,
  getAllTasks,
  getByIdTask,
  updateTask,
  updateTaskStatus,
  getTaskStatusHistory,
  deleteTask,
  addIsLikedTask,
  addIsLikedComment,
  filterByPriority,
};
