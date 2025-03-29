import {create} from "zustand"
import { axiosInstance } from "../lib/axios"
import { Contact } from "lucide-react"
import { authStore } from "./userAuth.store"

export const messageStore=create((set,get)=>({
    contacts:[],
    messages:[],
    selectedUser:null,
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
    update_message_array_received:async(activeContact)=>{
        try {
            
            const response=await axiosInstance.post(`/message/update_message_array_received`,{activeContact});
            console.log(response);
        } catch (error) {
            console.log(error)
        }
    },
    locallyUpdateMessage: async() => {
        try {
            const {messages} = get() // Remove the await here
            let update_message = messages.map(message => 
                 message.status == "sent" && message.isOwn
                ? {...message, status: "received"} 
                : message
            )
            set({ messages: update_message });
        } catch (error) {
            console.log(error)
        }
    },
    update_message_array_to_seen:async(contact_id)=>{
        try {
            const response=await axiosInstance.post(`/message/update_message_array_seen`,{contact_id});
        } catch (error) {
            console.log(error)
        }
    },
    send_message:async(data)=>{
        try {
            const {messages}=get();
            const response =await axiosInstance.post(`/message/save_message`,data);
            set({messages:[...messages,response.data.data]})
        } catch (error) {
            console.log(error)
        }
    },
    getAll_messages:async(receiverId)=>{
        try {
            const response=await axiosInstance.get(`/message/get_message/${receiverId}`);
            set({messages:response.data.data})
        } catch (error) {
            console.log(error)
        }
    },
    subScribe:()=>{
        const socket=authStore.getState().socket;
        if(!socket)return
        socket.on('newMessage',(data)=>{
            const {messages}=get();

            set({messages:[...messages,data]})
        })
    },
    unSubScribe:()=>{
        // let's unSubScribe
        const socket=authStore.getState().socket;
        if(!socket)return
        socket.off('newMessage')
    },
    setSelectedUser:(selectedUserId)=>{
        
        set({selectedUser:selectedUserId})
    },
    locallyUpdate_toSeen: async() => {
        try {
            const {messages} = get() // Remove the await here
            let update_message = messages.map(message => 
                 message.status != "seen" && message.isOwn
                ? {...message, status: "seen"} 
                : message
            )
            set({ messages: update_message });
        } catch (error) {
            console.log(error)
        }
    },
}))