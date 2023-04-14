import toast from 'react-hot-toast'

export const notify = (err) => {
    console.error(JSON.stringify(err))
    toast.error(JSON.stringify(err))
}
