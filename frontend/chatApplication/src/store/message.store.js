import {create} from "zustand"
import { axiosInstance } from "../lib/axios"
import { Contact } from "lucide-react"


export const messageStore=create((set)=>({
    contacts:[],
    messages:[],
    contactsLoading:false,
    get_all_contacts:async()=>{
        try {
            set({contactsLoading:true})
            const response=await axiosInstance.get(`/user/get_contact`);
            set({contacts:response.data.data.contacts})
        } catch (error) {
            console.log(error)
        }
        finally{
            set({contactsLoading:false})

        }
    },
    send_message:async(data)=>{
        try {
            const response =await axiosInstance.post(`/message/save_message`,data);
            console.log(response)
        } catch (error) {
            console.log(error)
        }
    },
    getAll_messages:async(receiverId)=>{
        try {
            const response=await axiosInstance.get(`/message/get_message/${receiverId}`);
            set({messages:response.data.data})
            console.log(response.data.data)
        } catch (error) {
            console.log(error)
        }
    }
}))