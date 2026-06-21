import mongoose from "mongoose"
import mongooseAggregatePaginate  from "mongoose-aggregate-paginate-v2"

// Video schema stores upload and ownership details.
const videoSchema = new mongoose.Schema(
    {
        videoFile : {
            type : String,
            requied : true,
        },
        thumbnail : {
            type : String,
            required : true,
        },
        title : {
            type : String,
            required : true,
        },
        description : {
            type : String,
            required : true,
        },
        duration : {
            type : Number,
            required : true,
        },
        views : {
            type : Number,
            required : true,
            default : 0,
        },
        isPublished : {
            type : Boolean,
            default : true,
        },
        owner : {
            type : Schema.Type.ObjectId,
            ref : "User"
        },
    } , {
        timestamps : true
    }
)

export const Video = mongoose.model("Video" , videoSchema)