// Wrap async route handlers and forward errors to middleware.
const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next))
            .catch((err) => next(err))
    }
}

export {asyncHandler}

// Using Try Catch

// const asyncHandler = (fn) => async(req,res,next) => { 
//     try {
//         await fn(req, res, next)
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success : false,
//             message : err.message
//         })
//     } 
// }