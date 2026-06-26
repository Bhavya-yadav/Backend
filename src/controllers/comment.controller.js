import mongoose from 'mongoose';
import { Comment } from '../models/comment.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, 'Invalid video id');
    }

    const comments = await Comment.find({
        video: videoId,
    })
        .populate('owner', 'username avatar')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit));

    return res.status(200).json(new ApiResponse(200, comments, 'Comments fetched successfully'));
});

const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { content } = req.body;

    if (!content?.trim()) {
        throw new ApiError(400, 'Comment is required');
    }

    const comment = await Comment.create({
        content,
        owner: req.user._id,
        video: videoId,
    });

    return res.status(201).json(new ApiResponse(201, comment, 'Comment added successfully'));
});

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!mongoose.isValidObjectId(commentId)) {
        throw new ApiError(400, 'Invalid Commentg id');
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(404, 'Comment not found');
    }

    if (comment.owner.toString() != req.user._id.toString()) {
        throw new ApiError(403, 'Unauthorized');
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set: {
                content,
            },
        },
        {
            returnDocument: 'after',
        }
    );

    return res.status(200).json(new ApiResponse(200, updatedComment, 'Comment updated'));
});

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(404, 'Comment not found');
    }

    if (comment.owner.toString() != req.user._id.toString()) {
        throw new ApiError(403, 'Unauthorized');
    }

    await Comment.findByIdAndDelete(commentId);

    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            'Comment deleted'
        )
    );
});

export { getVideoComments, addComment, updateComment, deleteComment };
