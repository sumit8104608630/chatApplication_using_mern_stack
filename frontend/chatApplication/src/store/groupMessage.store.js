import {create} from "zustand"
import { axiosInstance } from "../lib/axios"
import {io} from "socket.io-client"
import { authStore } from "./userAuth.store";

const API_URL = import.meta.env.VITE_DATA_BASE_LINK; // Your backend URL

export const groupMessageStore=create((set,get)=>({
    groupMessages:[],
    selectedGroup:null,
    messageSendingLoading:false,
    messageLoading:false,
    sendGroupMessage:async(data)=>{
        try {
            const {groupMessages}=get()
            const response=await axiosInstance.post("/groupMessage/save_groupMessage",data);
            if(response.status==201){
                set({groupMessages:[...groupMessages,response.data.data]})
            }
        } catch (error) {
            console.log(error)
        }
    },
        get_all_groupMessage:async(groupId)=>{
            try {
                set({messageLoading:true})
                const response=await axiosInstance.get(`/groupMessage/get_all_groupMessage/${groupId}`)
                if(response.status===200){
                    set(state=>({...state,groupMessages:response.data.data}))
                    set({messageLoading:false})

                }
            } catch (error) {
                set({messageLoading:false})
               console.log(error) 
            }
        },
        groupSubScribe: async () => {
            const socket = authStore.getState().socket;
            if (!socket) return;
            const {unGroupSubScribe}=get()
            unGroupSubScribe()
            const { selectedGroup } = get();
            socket.on('groupNewMessage', (data) => {
                if (data.groupId === selectedGroup) {
                    const { groupMessages } = get();
                    set({ groupMessages: [...groupMessages, data] });
                }
            });
        },
            setSelectedGroup:(selectedGroupId)=>{
        
                set({selectedGroup:selectedGroupId})
            },
            unGroupSubScribe:()=>{
                    // let's unSubScribe
                    const socket=authStore.getState().socket;
                    if(!socket)return
                    socket.off('groupNewMessage')
                },
}))