import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import Task from "../models/taskModel.js";
import User from "../models/userModel.js";
import TaskStatusMap from "../models/taskStatusMapModel.js";
import Comment from "../models/commentModel.js";
import { successHandle, errorHandle, sendEmail } from "../helper/helper.js";
import cache from "../utils/cache.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// create task
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
          Comment.create({
            taskId: newTask.id,
            userId,
            comment,
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
            let htmlBody = fs.readFileSync(
              path.join(__dirname, "..", "emailTemplate", "sendEmail.html"),
              "utf8"
            );
            htmlBody = htmlBody
              .replace("{taskName}", taskName)
              .replace("{dueDate}", dueDate);
            try {
              await sendEmail(user?.email, "Task Assigned", htmlBody);
            } catch (error) {
              return errorHandle(
                "",
                res,
                "Error Sending Email",
                500,
                error.message
              );
            }
          } catch (error) {
            return errorHandle(
              "",
              res,
              "Error Creating Task and Sending Email",
              500,
              error.message
            );
          }
        }
      } catch (error) {
        return errorHandle("", res, "Error Creating Task", 500, error.message);
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
    // pagination
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
    // fetch Tasks with status populated
    let tasks;
    try {
      tasks = await Task.find(filter)
        .sort(sortTask)
        .populate({
          path: "status",
          options: { sort: { createdAt: -1 }, limit: 1 },
          populate: {
            path: "statusId",
            select: "statusName",
          },
        });
    } catch (error) {
      return errorHandle("", res, "Error Populating Task", 500, error.message);
    }

    if (search?.name === "statusName") {
      tasks = tasks.filter(
        (task) => task.status[0]?.statusId?.statusName === search.value
      );
    }

    // aggregate totals
    const totalTaskLiked = tasks.reduce(
      (total, task) => total + task?.likedBy?.length,
      0
    );
    const totalTaskComment = tasks.filter((task) => task.comment).length;
    const totalRecord = tasks.length;
    const totalPage = Math.ceil(totalRecord / limit);
    tasks = tasks.slice(offset, offset + limit);

    // add commentCount and likedCount to each task
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
    return errorHandle("", res, "Error Retrieving Tasks", 500, error.message);
  }
};

// get task by id
const getByIdTask = async (req, res) => {
  const { id } = req.params;
  const cacheKey = `task:${JSON.stringify(id)}`;
  const cacheData = cache.get(cacheKey);
  if (cacheData) {
    return successHandle(
      "",
      res,
      "User Retrieved Successfully (Cache)",
      200,
      cacheData
    );
  }
  try {
    const task = await Task.findById(id).populate({
      path: "status",
      options: { sort: { createdAt: -1 }, limit: 1 },
      populate: {
        path: "statusId",
        select: "statusName",
      },
    });
    cache.set(cacheKey, task);
    if (!task) {
      return errorHandle("", res, "Task not found", 404, "");
    }

    // add commentCount and likedCount to each task
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

// update task
const updateTask = async (req, res) => {
  cache.keys((err, keys) => {
    if (!err) {
      // find all keys that start with "task:"
      const taskKeys = keys.filter((key) => key.startsWith("task:"));
      if (taskKeys.length) {
        cache.del(taskKeys);
      }
    }
  });
  const { id } = req.params;
  const updateData = { ...req.body };
  const { comment, userId } = updateData;
  if (comment && userId) {
    try {
      Comment.create({
        taskId: id,
        userId,
        comment,
      });
    } catch (error) {
      return errorHandle("", res, "Error Updating Comment", 500, error.message);
    }
  }
  const updatedTask = await Task.findByIdAndUpdate(id, updateData);
  if (!updatedTask) {
    return errorHandle("", res, "Task Not Found", 404, "");
  }
  return successHandle("", res, "Task Updated Successfully", 200, updatedTask);
};

// update task status
const updateTaskStatus = async (req, res) => {
  const { id } = req.params;
  const { statusId } = req.body;
  try {
    const updatedStatus = await TaskStatusMap.create({
      taskId: id,
      statusId,
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
};

// get task status history
const getTaskStatusHistory = async (req, res) => {
  const { id } = req.params;
  try {
    const statusHistory = await TaskStatusMap.find({ taskId: id })
      .populate([
        {
          path: "statusId",
          select: "statusName",
        },
        {
          path: "taskId",
          select: "taskName",
        },
      ])
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
};

// delete task
const deleteTask = async (req, res) => {
  cache.keys((err, keys) => {
    if (!err) {
      // find all keys that start with "task:"
      const taskKeys = keys.filter((key) => key.startsWith("task:"));
      if (taskKeys.length) {
        cache.del(taskKeys);
      }
    }
  });
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
};

// add is liked task
const addIsLikedTask = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  let task;
  try {
    task = await Task.findById(id);
    if (!task) {
      return errorHandle("", res, "Task Not Found", 404, "");
    }
  } catch (error) {
    return errorHandle("", res, "Error Liking Task", 500, error.message);
  }
  const alreadyLiked = task.likedBy.includes(userId);

  if (!alreadyLiked) {
    task.isLiked = true;
    task.likedBy.push(userId);
  } else {
    task.isLiked = false;
    task.likedBy.pull(userId);
  }
  try {
    await task.save();
  } catch (error) {
    return errorHandle("", res, "Error Liking Task", 500, error.message);
  }
  return successHandle("", res, "Task Liked", 200, task);
};

// add is liked comment
const addIsLikedComment = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  let comment;
  try {
    comment = await Comment.findById(id);
    if (!comment) {
      return errorHandle("", res, "Comment Not Found", 404, "");
    }
  } catch (error) {
    return errorHandle("", res, "Error Liking Comment", 500, error.message);
  }
  const alreadyLiked = comment.likedBy.includes(userId);

  if (!alreadyLiked) {
    comment.isLiked = true;
    comment.likedBy.push(userId);
  } else {
    comment.isLiked = false;
    comment.likedBy.pull(userId);
  }
  try {
    await comment.save();
  } catch (error) {
    return errorHandle("", res, "Error Liking Comment", 500, error.message);
  }
  return successHandle("", res, "Comment Liked", 200, comment);
};

// filter by priority
const filterByPriority = async (req, res) => {
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
  try {
    const ans = await Task.aggregate(pipeline);
    return successHandle("", res, "Task Filtered Successfully", 200, ans);
  } catch (error) {
    return errorHandle("", res, "Error Filtering Task", 500, error.message);
  }
};

export {
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
