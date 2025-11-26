import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import Comment from '../models/commentModel.js';
import Task from '../models/taskModel.js';
import TaskStatusMap from '../models/taskStatusMapModel.js';
import User from '../models/userModel.js';
import Cache from '../utils/cache.js';
import { successHandle, errorHandle, sendEmail } from '../helper/helper.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Create new task
 * 
 * @param {Request} req - Request object
 * @param {string} req.body.taskName - Name of the task
 * @param {string} req.body.description - Description of the task
 * @param {string} req.body.priority - Priority of the task (Low, Medium, High)
 * @param {string} req.body.category - Category of the task
 * @param {string} req.body.userId - User ID of the task
 * @param {string} req.body.statusId - Status ID of the task
 * @param {string} req.body.comment - Comment for the task (Optional)
 * @param {string} req.body.assignDate - Assign date of the task
 * @param {string} req.body.dueDate - Deadline of the task
 * 
 * @param {Response} res - Response object 
 */
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

      // Add comment
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
        // Create task status map
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
        // Send email to user
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

/**
 * Get all tasks with pagination, search, sorting
 * 
 * @param {Request} req - Request object
 * @param {number} req.query.limit - Number of items per page
 * @param {number} req.query.page - Page number
 * @param {string} req.query.searchObj - Search filtering
 * @param {string} req.query.sortObj - Sort filtering
 * 
 * @param {Response} res - Response object
 */
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

    // Search
    if (req.query.searchObj) {
      try {
        search = JSON.parse(req.query.searchObj);

        if (search.name === "isLiked") {
          filter[search.name] = search.value.toLowerCase() === "true";
        } else if (
          ["taskName", "priority", "category"].includes(search.name)
        ) {
          filter[search.name] = { $regex: search.value, $options: "i" };
        } else if (["assignDate", "dueDate"].includes(search.name)) {
          filter[search.name] = new Date(search.value);
        }
      } catch (error) {
        return errorHandle(
          "",
          res,
          "Invalid Search Object Properties",
          400,
          error.message
        );
      }
    }

    // Sorting
    if (req.query.sortObj) {
      try {
        const sort = JSON.parse(req.query.sortObj);
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
    // Fetch tasks with status populated
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

    // Filter by status name
    if (search?.name === "statusName") {
      tasks = tasks.filter(
        (task) => task.status[0]?.statusId?.statusName === search.value
      );
    }

    // Aggregate totals
    const totalTaskLiked = tasks.reduce(
      (total, task) => total + task?.likedBy?.length,
      0
    );
    const totalTaskComment = tasks.filter((task) => task.comment).length;
    const totalRecord = tasks.length;
    const totalPage = Math.ceil(totalRecord / limit);
    tasks = tasks.slice(offset, offset + limit);

    // Add commentCount and likedCount to each task
    const commentCounts = await Promise.all(
      tasks.map(async (task) => {
        const commentCount = await Comment.countDocuments({
          taskId: task._id,
        });
        return {
          ...task.toObject(),
          commentCount: commentCount,
          likedCount: task.likedBy.length,
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

/**
 * Get task by ID
 * @param {Request} req - Request object
 * @param {string} req.params.id - Task ID
 * 
 * @param {Response} res - Response object
 */
const getByIdTask = async (req, res) => {
  const { id } = req.params;

  const cacheKey = `task:${JSON.stringify(id)}`;
  const cacheData = Cache.get(cacheKey);

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
      }
    });

    if (!task) {
      return errorHandle("", res, "Task not found", 404, "");
    }

    // add commentCount and likedCount to each task
    const commentCount = await Comment.countDocuments({ taskId: task.id });
    const taskWithCommentCount = {
      ...task.toObject(),
      commentCount: commentCount,
      likedCount: task.likedBy.length,
    };

    Cache.set(cacheKey, taskWithCommentCount);
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

/**
 * Update task
 * @param {Request} req - Request object
 * @param {string} req.params.id - Task ID
 * @param {string} req.body.taskName - Update task name
 * @param {string} req.body.priority - Update task priority
 * @param {string} req.body.category - Update task category
 * @param {string} req.body.comment - Update comment Or Add new comment
 * @param {string} req.body.userId - User ID who comments
 * @param {string} req.body.assignDate - Update task assign date
 * @param {string} req.body.dueDate - Update task due date
 * 
 * @param {Response} res - Response object
 */
const updateTask = async (req, res) => {
  Cache.keys((err, keys) => {
    if (!err) {
      // find all keys that start with "task:"
      const taskKeys = keys.filter((key) => key.startsWith("task:"));
      if (taskKeys.length) {
        Cache.del(taskKeys);
      }
    }
  });

  const { id } = req.params;
  const updateData = { ...req.body };

  if (updateData.comment && updateData.userId) {
    try {
      Comment.create({
        taskId: id,
        userId: updateData.userId,
        comment: updateData.comment,
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

/**
 * Update task status
 * 
 * @param {Request} req - Request object
 * @param {string} req.params.id - Task ID
 * @param {string} req.body.statusId - Update task status or Add new status
 * 
 * @param {Response} res - 
 */
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

/**
 * Get task status history
 * 
 * @param {Request} req - Request object
 * @param {string} req.params.id - Task ID
 * 
 * @param {Response} res - Response object
 */
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

/**
 * Delete task(soft delete)
 * 
 * @param {Request} req - Request object
 * @param {string} req.params.id - Task ID
 * 
 * @param {Response} res - Response object
 */
const deleteTask = async (req, res) => {
  Cache.keys((err, keys) => {
    if (!err) {
      // find all keys that start with "task:"
      const taskKeys = keys.filter((key) => key.startsWith("task:"));
      if (taskKeys.length) {
        Cache.del(taskKeys);
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

/**
 * Like/Unlike task
 * 
 * @param {Request} req - Request object
 * @param {string} req.params.id - Task ID
 * @param {string} req.body.userId - User ID who likes the task
 * 
 * @param {Response} res - Response object
 */
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

/**
 * Like/Unlike comment
 * 
 * @param {Request} req - Request object
 * @param {string} req.params.id - Comment ID
 * @param {string} req.body.userId - User ID who likes the comment
 * 
 * @param {Response} res - Response object
 */
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

/**
 * Filter tasks by priority
 * 
 * @param {Request} req - Request object
 * @param {string} req.query.priority - Priority of the task
 * 
 * @param {Response} res - Response object
 */
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
