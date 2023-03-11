import toast from "react-hot-toast";
import {MdOutlineClose} from "react-icons/md";
import {HiLightningBolt} from "react-icons/hi";

export const notify = (err) =>
{
    console.error(JSON.stringify(err));
    toast.error(JSON.stringify(err));
}